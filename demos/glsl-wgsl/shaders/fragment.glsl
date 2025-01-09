varying vec2 vUV;

float random (vec2 st) {
        return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
    }

vec2 rotate(vec2 uv, float rotation, vec2 mid)
{
    return vec2(
      cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x,
      cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y
    );
}

//	Classic Perlin 2D Noise 
//	by Stefan Gustavson (https://github.com/stegu/webgl-noise)
//

vec4 permute(vec4 x) 
{
    return mod(((x*34.0)+1.0)*x, 289.0);
}
vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec2 P){
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 * 
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

#define PI 3.1415926535897932384626433832795

void main()
{   
    // BLINDS CURTAINS EFFECT
    // float strength = mod(vUV.y * 10.0, 1.5);

    // B&W STRIPES
    // float strength = mod(vUV.y * 10.0, 1.0);
    //if strength is below 0.8, then it's 0, otherwise it's 1
    // strength = step(0.8, strength);

 
    // B&W GRID
    // float strength = step(0.8, mod(vUV.x * 10.0, 1.0));
    // float strength2 = step(0.8, mod(vUV.y * 10.0, 1.0));

    // strength = max(strength, strength2);
    // strength = strength + strength2;

    // B&W DOTS
    // strength = strength2 * strength;

    // B&W BARS
    // strength = strength2 - strength;

    // B&W ANGLES
    // float barX = step(0.4, mod(vUV.x * 10.0, 1.0));
    // barX *= step(0.8, mod(vUV.y * 10.0, 1.0));
    // float barY = step(0.4, mod(vUV.y * 10.0, 1.0));
    // barY *= step(0.8, mod(vUV.x * 10.0, 1.0));

    // float strength = barX + barY;

    // B&W PLUSES
    // float barX = step(0.4, mod(vUV.x * 10.0 - 0.2, 1.0));
    // barX *= step(0.8, mod(vUV.y * 10.0, 1.0));
    // float barY = step(0.4, mod(vUV.y * 10.0 - 0.2, 1.0));
    // barY *= step(0.8, mod(vUV.x * 10.0, 1.0));
    // float strength = barX + barY;

    //GRADIENT MEETS IN THE MIDDLE
    // float strength = abs(vUV.x-0.5);

    //GRADIENT PLUS IN THE MIDDLE
    // float strengthX = abs(vUV.x-0.5);
    // float strengthY = abs(vUV.y-0.5);
    //float strength = min(strengthX,strengthY);

    //BLACK SQUARE IN THE MIDDLE
    // float strengthX = step(0.25,(abs(vUV.x-0.5)));
    // float strengthY = step(0.25,(abs(vUV.y-0.5)));
    // float strength = max(strengthX,strengthY);

    // float biggerSquareX = step(0.3,(abs(vUV.x-0.5)));
    // float biggerSquareY = step(0.3,(abs(vUV.y-0.5)));
    // float biggerSquare = max(biggerSquareX,biggerSquareY);

    // strength = strength - biggerSquare;

    //B&W PIXELS PALLETTE
    // float strength = (round(vUV.x * 10.0) * 0.1) * (round(vUV.y * 10.0) * 0.1);

    //NOISE PIXALATED
    // vec2 gridUv = vec2 (
    //     floor(vUV.x * 10.0) * 0.1,
    //     floor(vUV.y * 10.0) * 0.1
    // );
    // float strength = random(gridUv);

    //NOISE PIXELATED SKEWED
    // vec2 gridUv = vec2 (
    //     floor(vUV.x * 10.0) * 0.1,
    //     floor((vUV.y + vUV.x*0.5)*10.0) * 0.1
    // );
    // float strength = random(gridUv);

    //RADIAL GRADIENT
    // float strength = distance(vUV, vec2(0.0, 0.0));
    // OR length(vUV)
 
    //SUN
    // vec2 lightUv = vec2(
    //     vUV.x*2.0 - 0.75,
    //     vUV.y 
    // );
    // float strength = 0.125 / distance(lightUv, vec2(0.5, 0.5));

    //BLINGS MEETING EACH OTHER
    vec2 rotatedUv = rotate(vUV, PI/4.0, vec2(0.5, 0.5));

    vec2 lightUv = vec2(
        rotatedUv.x*0.2 + 0.45,
        rotatedUv.y 
    );

    float strengthX = 0.125 / distance(lightUv, vec2(0.5, 0.5));

    vec2 lightUv2 = vec2(
        rotatedUv.x,
        rotatedUv.y*0.01 + 0.35
    );

     float strengthY = 0.125 / distance(lightUv2, vec2(0.5, 0.5));
     float strength = strengthX * strengthY;

    //CIRCLE
    // float strength = step(0.25, distance(vUV, vec2(0.5, 0.5)));
    //GRADIEMT CIRCLE – NO STEP
    // float strength = step(0.01, abs(distance(vUV, vec2(0.5))-0.25));
    // DISTORTED CIRCLE
    // vec2 waveUv = vec2(
    //     vUV.x + sin(vUV.y * 30.0) * 0.15,
    //     vUV.y + sin(vUV.x * 30.0) * 0.2
    // );
    // float strength = 1.0- step(0.01, abs(distance(waveUv, vec2(0.5))-0.25));

    //ANGLES
    // float angle = atan(vUV.x - 0.5, vUV.y - 0.5);
    // angle /= PI * 2.0;
    // angle += 0.5;
    //LOOKS LIKE SOVIET TILE
    //angle *= 20.0;
    //float strength =  mod(angle, 1.0);

    // float strength = sin(angle * PI * 30.0);

    //FLOWER
    // float radius = 0.25;
    // float angle = atan(vUV.x - 0.5, vUV.y - 0.5);
    // angle /= PI;
    // float sinusoid = sin(angle * PI * 12.0);
    // radius += sinusoid*0.02;
    // float strength = 1.0 - step(0.01, abs(distance(vUV, vec2(0.5))-radius));

    //PERLIN NOISE
    // float strength = step(0.1, cnoise(vUV*10.0));
    // float strength = 1.0 - abs(cnoise(vUV*10.0));
    // float strength = sin(cnoise(vUV*10.0)* 20.0);
    // float strength = step(0.9,sin(cnoise(vUV*10.0)* 20.0));

    //CLAMP STRNGTH
    strength = clamp (strength, 0.0, 1.0);

    //COLORED
    vec3 firstColor = vec3(0.0345, 0.07, 0.11);
    vec3 secondColor = vec3(vUV, 1.0);

    vec3 color = mix(firstColor, secondColor, strength);


    gl_FragColor = vec4(vec3(color), 1.0);
}