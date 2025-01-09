const canvas = document.querySelector('#webgpu-canvas');

async function initWebGPU() {
    // Check for WebGPU support
    if (!navigator.gpu) {
        console.error('WebGPU not supported in this browser.');
        return;
    }

    // Get WebGPU adapter and device
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();

    // Configure canvas context
    const context = canvas.getContext('webgpu');
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format,
        alphaMode: 'opaque',
    });

    // Load shader code from file
    const shaderCode = await fetch('../shaders/shader.wgsl').then((res) => res.text());

    // Create shader module
    const shaderModule = device.createShaderModule({ code: shaderCode });

    // Define pipeline
    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: shaderModule,
            entryPoint: 'vtx_main',
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'frag_main',
            targets: [{ format }],
        },
        primitive: {
            topology: 'triangle-list',
        },
    });

    // Create uniform buffer for frame counter
    const frameBuffer = device.createBuffer({
        size: 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: frameBuffer } }],
    });

    // Create command encoder and render pass
    const renderPassDescriptor = {
        colorAttachments: [{
            view: undefined,
            clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store',
        }],
    };

    let frame = 0;

    // Render loop
    function frameUpdate() {
        // Update frame counter
        device.queue.writeBuffer(frameBuffer, 0, new Uint32Array([frame++]));

        // Set render target
        renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();

        const commandEncoder = device.createCommandEncoder();
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

        passEncoder.setPipeline(pipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.draw(3); // 3 vertices for a triangle
        passEncoder.end();

        device.queue.submit([commandEncoder.finish()]);

        requestAnimationFrame(frameUpdate);
    }

    frameUpdate();
}

initWebGPU();
