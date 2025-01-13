async function initializeWebGPU() {
    // Fetch the adapter and device asynchronously
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        console.error('WebGPU is not supported on this device.');
        return;
    }
    const device = await adapter.requestDevice();

    // Get the canvas and WebGPU context
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('webgpu');

    // Fetch the WGSL shader code asynchronously
    const wgslShaderCode = await fetch('wgslPingPong.wgsl').then(response => response.text());

    // Define width and height of the textures
    const width = canvas.width;
    const height = canvas.height;

    // Create textures for ping-ponging
    const flowTextureA = device.createTexture({
        size: [width, height],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
    });

    const flowTextureB = device.createTexture({
        size: [width, height],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
    });

    // Create the compute pipeline
    const computePipeline = device.createComputePipeline({
        layout: 'auto',
        compute: {
            module: device.createShaderModule({ code: wgslShaderCode }),
            entryPoint: 'main',
        },
    });

    // Create a buffer for uniforms (like mouse position and velocity)
    // Create a uniform buffer with correct size (32 bytes: 2x vec2 + 2x float + padding)
    const uniformBufferSize = 4 * Float32Array.BYTES_PER_ELEMENT * 4; // 32 bytes
    const uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });


    // Create a bind group for the compute pipeline
    const bindGroup = device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: flowTextureA.createView() },
            { binding: 1, resource: flowTextureB.createView() },
            { binding: 2, resource: { buffer: uniformBuffer } },
        ],
    });

    // Encode and submit the compute pass commands
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(computePipeline);
    passEncoder.setBindGroup(0, bindGroup);

    // Dispatch the compute shader (adjust workgroup size based on your shader)
    passEncoder.dispatchWorkgroups(Math.ceil(width / 8), Math.ceil(height / 8));
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
}

// Call the async initialization function
initializeWebGPU().catch(console.error);
