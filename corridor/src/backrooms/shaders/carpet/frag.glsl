#include ../includes/worley.glsl
#include ../includes/perlin.glsl

varying vec2 vUv;
uniform float freq;
uniform float strength;
uniform float scale;
uniform float tile;
uniform float threshold;

void main() {
    // vec3 baseColor = vec3(0.639, 0.545, 0.016);
    vec3 baseColor = vec3(0.569, 0.45, 0.018);
    vec3 darkColor = vec3(0.31, 0.163, 0.0);
    float noise = step(threshold, cnoise(vUv * scale));
    float mask = noise * strength;


    vec3 color = mix(baseColor, darkColor, mask);
    csm_DiffuseColor = vec4(color, 1.0);
}