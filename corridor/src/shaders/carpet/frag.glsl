#include ../includes/worley.glsl
#include ../includes/perlin.glsl

varying vec2 vUv;
uniform float freq;
uniform float strength;
uniform float scale;
uniform float tile;
uniform float threshold;

void main() {
    vec3 baseColor = vec3(0.7, 0.6, 0.25);
    vec3 darkColor = vec3(0.3, 0.2, 0.1);
    float noise = step(threshold, cnoise(vUv * scale));
    float mask = noise * strength;


    vec3 color = mix(baseColor, darkColor, mask);
    csm_DiffuseColor = vec4(color, 1.0);


}