uniform float uTime;
#include ../includes/perlin.glsl

varying vec2 vUv;
uniform float aspectRatio;


const float TWOPI = PI*2.0;


float flower(vec2 center, float radius, vec2 uv) {
    float x = uv.x - center.x;
    float y = uv.y - center.y;
    float angle = atan(x, y);
    float sinusoid = sin(angle * 8.0)*0.04;
    float sinTime = cos(uTime*0.01);
    float noise = cnoise(vec2(uTime*0.1, uTime*0.1));
    radius += sinusoid*sinTime*0.3 + noise*0.015;
    float strength = 1.0 - step(0.015, abs(distance(uv, center) - radius));
    return strength;
}

float shape(vec2 center, float radius, vec2 uv) {
    vec2 pos = (uv - center); // move to center
    pos *= 80.0; // Scale the shape

    // Draw the curve |y| = x^(-1)
    float curve = abs(pos.y) - pow(abs(pos.x - 0.5), -1.0);
    float thickness = 0.1; // Adjust this value to change line thickness
    float shape = 1.0 - step(thickness, abs(curve));

    //clamp between -1 and 1
    shape = clamp(shape, -1.0, 1.0);
    
    return shape;
}

float heart(vec2 center, float radius, vec2 uv) {
    vec2 pos = (uv - center); // move to center

    pos *= 80.0; // Scale the heart
    
    // Heart mathematical formula
    float x = pos.x;
    float y = pos.y;
    
    // This formula creates a heart shape: (x²+y²-1)³ - x²y³ ≤ 0
    float heart = pow(x * x + y * y - 1.0, 3.0) - (x * x * pow(y, 3.0));
    
    // Create the filled shape using step
    float strength = 1.0 - step(0.0, heart);
    
    return strength;
}

void main() {
    vec2 uv = vUv;
    float strength = 0.0;
    
    // Create a grid for wallpaper
    float gridSize = 8.0;
    vec2 aspectCorrectedUV = vec2(uv.x * aspectRatio, uv.y);
    vec2 cell = fract(aspectCorrectedUV * gridSize);
    vec2 cellId = floor(aspectCorrectedUV * gridSize);
    
    // Place flowers every 2 cells
    if (mod(cellId.x, 2.0) == 0.0 && mod(cellId.y, 2.0) == 0.0) {
        vec2 center = (cellId + vec2(0.6)) / gridSize;
        strength += flower(center, 0.001, aspectCorrectedUV);
    }

    // Place shape every 4 cells with a 1 cell offset
    if (mod(cellId.x, 4.0) == 1.0 && mod(cellId.y, 4.0) == 1.0) {
        vec2 center = (cellId + vec2(0.6)) / gridSize;
        strength += heart(center, 0.0006, aspectCorrectedUV);
        // strength += shape(center, 0.0006, aspectCorrectedUV);
    }

    // Add the bars
    float barWidth = 0.2;
    float barX = step(barWidth, mod(uv.x * aspectRatio * gridSize, 1.0));
    float barY = step(barWidth, mod(uv.y * gridSize, 1.0));
    strength += barX + barY;

    //add noise
    float noise = cnoise(vec2(uv.x * 1000.0* aspectRatio * 0.25, uv.y * 1000.0)) * 0.3;
    strength += noise;

    vec3 colorAccent = vec3(0.3, 0.3, 0.0);
    vec3 baseColor = vec3(0.617, 0.632, 0.125);
    
    vec3 color = mix(colorAccent, baseColor, strength);

    csm_DiffuseColor = vec4(color, 1.0);
}