#include ../includes/perlin.glsl

varying vec2 vUv;
uniform float aspectRatio;
uniform float offset;

void main() {
    vec2 uv = vUv;
    float strength = 0.0;

    // Create a grid for wallpaper
    float gridSize = 20.0;
    vec2 aspectCorrectedUV = vec2(uv.x * aspectRatio, uv.y);
    vec2 cell = fract(aspectCorrectedUV * gridSize);
    vec2 cellId = floor(aspectCorrectedUV * gridSize);

    vec3 colorGreen = vec3(0.3, 0.3, 0.0);
    vec3 baseColor = vec3(0.6, 0.5, 0.15);

    // Add the bars
    float barWidthGreen = 0.25;
    float barY = step(barWidthGreen, mod(uv.x * gridSize, 1.0));
    strength +=  barY;

     //add noise
    float noise = cnoise(vec2(uv.x * 1000.0* aspectRatio * 0.25, uv.y * 1000.0)) * 0.3;
    strength += noise;

    vec3 color = mix(colorGreen, baseColor, strength);

    //add red bars
    vec3 redColor = vec3(0.5, 0.1, 0.0);

    float barWidthRed = 0.025;
    // float offset = ;
    float redBar1 = step(barWidthRed, mod((uv.x + offset) * gridSize, 1.0));
    float redBar2 = step(barWidthRed, mod((uv.x - offset) * gridSize, 1.0));

    float redBar = min(redBar1, redBar2);

    color = mix(redColor, color, redBar);


    csm_DiffuseColor = vec4(color, 1.0);
}