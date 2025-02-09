#include ../includes/worley.glsl
#include ../includes/perlin.glsl

uniform float uTime;

varying vec2 vUv;

void main() {
    vec3 baseColor = vec3(1.1, 0.6, 1.3);

    // Distort the UV coordinates
    vec2 distortedUv = vUv;
    float noiseScale = 4.0;
    float timeScale = uTime * 0.2;
    
    // Use Perlin noise to create organic distortion
    float distortionStrength = 0.02;
    distortedUv.x += sin(uTime + vUv.x * 60.0) * cos(uTime + vUv.y * 40.0) * distortionStrength;
    distortedUv.y += cos(uTime + vUv.y * 80.0) * sin(uTime + vUv.x * 20.0) * distortionStrength;
    
    float dist = length(distortedUv - 0.5);
    
    // Create base ripple waves
    float ripple1 = sin(dist * 30.0 - uTime * 3.0) * 0.5 + 0.5;
    float ripple2 = sin(dist * 20.0 - uTime * 2.0) * 0.5 + 0.5;
    float ripple3 = sin(dist * 10.0 - uTime * 1.5) * 0.5 + 0.5;
    
    // Mix the ripples
    float ripples = mix(ripple1, ripple2, 0.5) * ripple3;
    
    // Add noise to the ripple pattern
    float noiseTime = uTime * 0.5;
    float noise = sin(ripples * 6.0 + noiseTime) * cos(ripples * 4.0 - noiseTime) * 0.3;
    float distortedRipples = ripples + noise;
    
    // Create circular falloff
    float circle = 1.0 - smoothstep(0.2, 0.4, dist);
    
    float alpha = distortedRipples * circle;

    //clamp alpga to 1.0
    alpha = clamp(alpha, 0.0, 1.0);
    // make it brighter
    alpha *= alpha * 10.0;

    csm_DiffuseColor = vec4(baseColor, alpha);
}