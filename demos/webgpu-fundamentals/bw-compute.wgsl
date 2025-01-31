const chunkWidth = 256;
const chunkHeight = 1;
const chunkSize = chunkWidth * chunkHeight;

struct Chunk {
    pixels: array<vec4f, chunkSize>,
};

@group(0) @binding(0) var ourTexture: texture_external;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<storage, read_write> chunks: array<Chunk>;

const kSRGBLuminanceFactors = vec3f(0.2126, 0.7152, 0.0722);
fn srgbLuminance(color: vec3f) -> f32 {
     return saturate(dot(color, kSRGBLuminanceFactors));
}

@compute @workgroup_size(chunkWidth, chunkHeight, 1)
fn cs(
    @builtin(global_invocation_id) global_id: vec3u,
    @builtin(workgroup_id) workgroup_id: vec3u,
    @builtin(local_invocation_id) local_id: vec3u,
    ) {
    let size = textureDimensions(ourTexture);
    let position = global_id.xy;
            
    if (all(position < size)) {
        var color = textureLoad(ourTexture, position);
                
        // Check if the pixel is in the left half of the video
        // if (position.x < size.x / 2u) {
            //check if the pixel is red
            if (color.r > color.g && color.r > color.b) {
                let luminance = srgbLuminance(color.rgb);
                color = vec4f(luminance, luminance, luminance, color.a);
            }
        //}

        // Store in chunk
        let chunk_idx = workgroup_id.y * (size.x / chunkWidth) + workgroup_id.x;
        let pixel_idx = local_id.y * chunkWidth + local_id.x;
        chunks[chunk_idx].pixels[pixel_idx] = color;
            

        // Write to output texture
        textureStore(outputTexture, position, color);
    }
}
