@group(0) @binding(0) var<storage, read> inputTexture: texture_2d<f32>;
@group(0) @binding(1) var<storage, write> outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<uniform> params: Uniforms;

struct Uniforms {
    mousePosition: vec2<f32>, // 16-byte aligned
    velocity: vec2<f32>,      // 16-byte aligned
    falloff: f32,             // 4 bytes
    dissipation: f32,         // 4 bytes
    padding: vec2<f32>,       // 8 bytes padding
};

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let coord = vec2<i32>(global_id.xy);

    // Sample the input texture
    let color = textureLoad(inputTexture, coord, 0);

    // Calculate cursor influence
    let cursorDist = length(params.mousePosition - vec2<f32>(coord));
    let falloff = smoothstep(params.falloff, 0.0, cursorDist);

    // Compute new flowmap value
    let velocityEffect = vec4<f32>(params.velocity, 0.0, 1.0 - pow(1.0 - min(1.0, length(params.velocity)), 3.0));
    let newColor = mix(color, velocityEffect, falloff) * params.dissipation;

    // Write the output
    textureStore(outputTexture, coord, newColor);
}
