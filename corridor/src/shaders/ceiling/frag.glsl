#include ../includes/perlin.glsl

uniform float uTime;
varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    float strength = 0.0;
    float flicker = 1.0;
    vec3 emmissiveStrength = vec3(0.0);
    // Create a grid the ceiling
    float gridSize = 10.0;
    vec2 cell = fract(uv * gridSize);
    vec2 cellId = floor(uv * gridSize);

    vec3 colorCeiling = vec3(0.9, 0.78, 0.3);
    vec3 baseUnder = vec3(0.2, 0.1, 0.01);

    // Add the bars
    float barWidth = 0.03;
    float barX = step(barWidth, mod(uv.x * gridSize, 1.0));
    float barY = step(barWidth, mod(uv.y * gridSize, 1.0));
    strength = min(barX, barY);

    //add texture
    float noise = cnoise(vec2(uv.x * 2000.0, uv.y * 2000.0)) * 0.1;
    strength += noise;

    vec3 color = mix(baseUnder, colorCeiling, strength);

    // Place light every 4 cells
    if (mod(cellId.x, 4.0) == 0.0 && mod(cellId.y, 4.0) == 0.0) {
        //minus bars width
        if (cell.x > barWidth && cell.y > barWidth) {
            //flcker every n seconds:
            float n = (cellId.x * cellId.y);
            float time = mod(uTime, n);
            if (time > (n - 1.0)) {
                flicker = sin(uTime * 5.0 * (cellId.x + cellId.y)); //from -1 to 1
                flicker = abs(flicker);
            }
            emmissiveStrength = vec3(5.0, 5.0, 8.0) * flicker;
        }
    }

    csm_DiffuseColor = vec4(color, 1.0);
    csm_Emissive = emmissiveStrength;
    csm_Bump = vec3((1.0 - strength) * 0.5);
}