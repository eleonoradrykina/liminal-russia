#include ../includes/perlin.glsl

varying vec2 vUv;
uniform float aspectRatio;
uniform float offset;
uniform float uTime;



void main() {
    vec2 uv = vUv;
    float strength = 0.0;

    // Create a grid for wallpaper
    float gridSize = 20.0;
    float rowSize = 2.0;
    vec2 aspectCorrectedUV = vec2(uv.x * aspectRatio, uv.y);
    vec2 cell = fract(aspectCorrectedUV * gridSize);
    vec2 cellId = floor(aspectCorrectedUV * gridSize);

    vec3 colorGreen = vec3(0.3, 0.3, 0.0);
    vec3 baseColor = vec3(0.617, 0.632, 0.125);

    // Add the bars
    float barWidthGreen = 0.25;
    float barY = step(barWidthGreen, mod(uv.x * gridSize, 1.0));
    strength +=  barY;


    //add shells pattern to the grid
    vec2 cell2 = fract(aspectCorrectedUV * 10.0);
    vec2 cellId2 = floor(aspectCorrectedUV * 10.0);
    if (mod(cellId2.x, 3.0) == 1.0 && mod(cellId2.y, 8.0) == 1.0) {
    float angle = atan(cell2.x - 0.5, cell2.y + 0.5);
    angle /= PI * 2.0;
    angle += 0.5;
    angle *= 20.0;
    float angleStrength = mod(angle, 1.0);
    vec2 bottomCenter = vec2(cell2.x-0.5, cell2.y)*1.5;
    float radius = length(bottomCenter);
    float radiusStrength = (1.0 - smoothstep(0.75, 1.0, radius));

    strength += angleStrength * radiusStrength;
    }

    //draw a vertical line connecting 2 rows of cells
    // float lineStrength = step(0.9, mod(uv.x * 20.0, 1.0)) * step(0.9, mod(uv.y * 20.0, 1.0));
    float lineStrength =(step(0.9, mod(uv.x * 20.0, 1.0))) + cos(uv.y * 20.0);
    // strength += lineStrength;

    //add noise
    float noise = cnoise(vec2(uv.x * 1000.0* aspectRatio * 0.25, uv.y * 1000.0)) * 0.3;
    strength += noise;

    vec3 color = mix(colorGreen, baseColor, strength);

    //add red bars
    vec3 redColor = vec3(0.5, 0.1, 0.0);
    float barWidthRed = 0.025;
    // float offset = 0.25;

    float redBar1 = step(barWidthRed, mod((uv.x) * gridSize, 1.0));
    float redBar2 = step(barWidthRed, mod((uv.x - offset) * gridSize, 1.0));
    float redBar = min(redBar1, redBar2);

    color = mix(redColor, color, redBar);

    csm_DiffuseColor = vec4(color, 1.0);
}