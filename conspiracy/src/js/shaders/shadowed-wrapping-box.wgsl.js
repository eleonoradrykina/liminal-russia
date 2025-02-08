import { getShadowPosition } from './includes/get-shadow-position.wgsl'
import { getPCFSoftShadows } from './includes/get-pcf-soft-shadows.wgsl'

export const wrappingBoxVs = /* wgsl */ `  
  struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
    @location(1) normal: vec3f,
    @location(2) shadowPosition: vec3f,
    @location(3) worldPosition: vec3f,
  };
  
  ${getShadowPosition}

  @vertex fn main(
    attributes: Attributes,
  ) -> VSOutput {    
    var vsOutput : VSOutput;
    
    let worldPosition: vec4f = matrices.model * vec4(attributes.position, 1.0);
    vsOutput.position = camera.projection * camera.view * worldPosition;
    
    vsOutput.uv = attributes.uv;
    
    vsOutput.normal = getWorldNormal(attributes.normal);
    
    vsOutput.shadowPosition = getShadowPosition(
      light.projectionMatrix,
      light.viewMatrix * matrices.model * vec4(attributes.position, 1.0)
    );
    
    vsOutput.worldPosition = worldPosition.xyz;
    
    return vsOutput;
  }
`

export const wrappingBoxFs = /* wgsl */ `
  struct VSOutput {
    @builtin(position) position: vec4f,
    @builtin(front_facing) frontFacing: bool,
    @location(0) uv: vec2f,
    @location(1) normal: vec3f,
    @location(2) shadowPosition: vec3f,
    @location(3) worldPosition: vec3f,
  };
  
  ${getPCFSoftShadows}
  
  fn applyDithering(color: vec3f, fragCoord: vec2f) -> vec3f {
    // Simple random noise based on fragment coordinates
    let scale = 1.0 / 255.0; // Adjust this value to control the strength of the dithering
    let noise = fract(sin(dot(fragCoord, vec2(12.9898, 78.233))) * 43758.5453);

    // Apply the noise to the color
    return color + vec3(noise * scale);
  }

  fn applyWallpaper(color: vec3f, uv: vec2f) -> vec3f {
    var wallpaper: vec3f = color;

    let stripeWidth: f32 = 0.02;
    let stripeColor: vec3f = vec3(161.0 / 256.0, 179.0 / 256.0, 178.0 / 256.0);

    let stripePosition: f32 = fract(uv.x / stripeWidth);
    let stripeMask: f32 = step(0.5, stripePosition);

    //first add the stripes
    wallpaper = mix(wallpaper, stripeColor, stripeMask);

    // accent color:
    let accentColor: vec3f = vec3(142.0 / 256.0, 168.0 / 256.0, 167.0 / 256.0);

    // Create a grid of flowers using UV coordinates
    let gridSize: f32 = 12.0; //  number of flowers
    let uvLocal = uv * gridSize;
    let cell = vec2f(floor(uvLocal.x), floor(uvLocal.y));
    let localUV = vec2f(fract(uvLocal.x), fract(uvLocal.y)) - 0.5; // Center in cell
    
    //draw every 4 cells    
    let drawFlower: bool = (cell.x + cell.y) % 2.0 == 0.0;

    if (drawFlower) {
      // Create flower pattern using sin/cos
      let angle = atan2(localUV.y, localUV.x);
      let radius = length(localUV);
      let petals = 5.0; // Number of petals
      var flower = 0.5 + 0.5 * sin(angle * petals);
      flower *= 1.0 - smoothstep(0.2, 0.3, radius); // Create center

      // Use flower pattern as mask
      let flowerMask = step(0.5, flower);

      wallpaper = mix(wallpaper, accentColor, flowerMask);
    }

    //draw circle every 6 cells
    let drawCircle: bool = (cell.x + cell.y) % 2.0 == 1.0;

    if (drawCircle) {
      // Create circle pattern using sin/cos
      let circle = length(localUV);
      let circleMask = 1.0 - step(0.15, circle);

      wallpaper = mix(wallpaper, accentColor, circleMask);
    }
    return wallpaper;
  }
  
  @fragment fn main(fsInput: VSOutput) -> @location(0) vec4f {
    var visibility = getPCFSoftShadows(fsInput.shadowPosition);

    visibility = clamp(visibility, 1.0 - clamp(shading.shadowIntensity, 0.0, 1.0), 1.0);
    
    // ambient light
    let ambient: vec3f = ambientLight.intensity * ambientLight.color;
    
    // inverse the normals if we're using front face culling
    let faceDirection = select(-1.0, 1.0, fsInput.frontFacing);
    
    // diffuse lambert shading
    let N = normalize(faceDirection * fsInput.normal);
    let L = normalize(light.position - fsInput.worldPosition);
    let NDotL = max(dot(N, L), 0.0);

    let diffuse: vec3f = NDotL * directionalLight.color * directionalLight.intensity;
    
    // apply shadow to diffuse
    let lightAndShadow: vec3f = ambient + visibility * diffuse;

    // Check if surface is a wall using normal
    let isWall = abs(fsInput.normal.y) < 0.5; // true for walls (where y component is close to 0)
    let isCeiling = (fsInput.normal.y) > 0.9; // true for ceiling (where y component is close to 1 and is positive)
    
    // Apply wallpaper only to walls
    var wallpaper: vec3f;
    if (isWall) {
        wallpaper = applyWallpaper(shading.color, fsInput.uv);
    } else if (isCeiling) {
        wallpaper = vec3f(254.0 / 256.0, 253.0 / 256.0, 238.0 / 256.0); // ceiling color
    } else {
        var floorColor: vec3f = vec3f(55.0 / 256.0, 23.0 / 256.0, 4.0 / 256.0); // floor color
        //add a bit of shadow in the center
        let center = vec2f(0.5, 0.15);
        let distance = length(fsInput.uv - center);
        let shadow = 1.0 - smoothstep(0.15, 0.2, distance);
        wallpaper = mix(floorColor, vec3f(36.0 / 256.0, 14.0 / 256.0, 1.0 / 256.0), shadow);
    }

    // apply dithering to reduce color banding
    let color = applyDithering(wallpaper * lightAndShadow, fsInput.position.xy);

    return vec4(color, 1.0);
  }
`
