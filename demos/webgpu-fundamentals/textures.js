import GUI from 'muigui'


async function main() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        fail('need a browser that supports WebGPU');
        return;
    }

    // Get a WebGPU context from the canvas and configure it
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('webgpu');
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: presentationFormat,
    });

    const module = device.createShaderModule({
        label: 'our hardcoded textured quad shaders',
        code: `
      struct OurVertexShaderOutput {
        @builtin(position) position: vec4f,
        @location(0) texcoord: vec2f,
      };

      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> OurVertexShaderOutput {
        let pos = array(
          // 1st triangle
          vec2f( 0.0,  0.0),  // center
          vec2f( 1.0,  0.0),  // right, center
          vec2f( 0.0,  1.0),  // center, top

          // 2st triangle
          vec2f( 0.0,  1.0),  // center, top
          vec2f( 1.0,  0.0),  // right, center
          vec2f( 1.0,  1.0),  // right, top
        );

        var vsOutput: OurVertexShaderOutput;
        let xy = pos[vertexIndex];
        vsOutput.position = vec4f(xy, 0.0, 1.0);
        vsOutput.texcoord = xy;
        return vsOutput;
      }

      @group(0) @binding(0) var ourSampler: sampler;
      @group(0) @binding(1) var ourTexture: texture_2d<f32>;

      @fragment fn fs(fsInput: OurVertexShaderOutput) -> @location(0) vec4f {
        return textureSample(ourTexture, ourSampler, fsInput.texcoord);
      }
    `,
    });

    const pipeline = device.createRenderPipeline({
        label: 'hardcoded textured quad pipeline',
        layout: 'auto',
        vertex: {
            module,
        },
        fragment: {
            module,
            targets: [{ format: presentationFormat }],
        },
    });

    const kTextureWidth = 5;
    const kTextureHeight = 7;
    const _ = [255, 0, 0, 255];  // red
    const y = [255, 255, 0, 255];  // yellow
    const b = [0, 0, 255, 255];  // blue
    const textureData = new Uint8Array([
        _, _, _, _, _,
        _, y, _, _, _,
        _, y, _, _, _,
        _, y, y, _, _,
        _, y, _, _, _,
        _, y, y, y, _,
        b, _, _, _, _,
    ].flat());

    const texture = device.createTexture({
        label: 'yellow F on red',
        size: [kTextureWidth, kTextureHeight],
        format: 'rgba8unorm',
        usage:
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST,
    });
    device.queue.writeTexture(
        { texture },
        textureData,
        { bytesPerRow: kTextureWidth * 4 },
        { width: kTextureWidth, height: kTextureHeight },
    );

    const bindGroups = [];
    for (let i = 0; i < 8; i++) {
        const sampler = device.createSampler({
            addressModeU: (i & 1) ? 'repeat' : 'clamp-to-edge',
            addressModeV: (i & 2) ? 'repeat' : 'clamp-to-edge',
            magFilter: (i & 4) ? 'linear' : 'nearest',
        });

        const bindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: sampler },
                { binding: 1, resource: texture.createView() },
            ],
        });
        bindGroups.push(bindGroup);
    }

    const renderPassDescriptor = {
        label: 'our basic canvas renderPass',
        colorAttachments: [
            {
                // view: <- to be filled out when we render
                clearValue: [0.3, 0.3, 0.3, 1],
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
    };
    const settings = {
        addressModeU: 'repeat',
        addressModeV: 'repeat',
        magFilter: 'linear',
    };

    const addressOptions = ['repeat', 'clamp-to-edge'];
    const filterOptions = ['nearest', 'linear'];

    const gui = new GUI();
    gui.onChange(render);
    Object.assign(gui.domElement.style, { right: '', left: '15px' });
    gui.add(settings, 'addressModeU', addressOptions);
    gui.add(settings, 'addressModeV', addressOptions);
    gui.add(settings, 'magFilter', filterOptions);

    function render() {
        //looking at the settings:
        const ndx = (settings.addressModeU === 'repeat' ? 1 : 0) +
            (settings.addressModeV === 'repeat' ? 2 : 0) +
            (settings.magFilter === 'linear' ? 4 : 0);
        const bindGroup = bindGroups[ndx];
        // Get the current texture from the canvas context and
        // set it as the texture to render to.
        renderPassDescriptor.colorAttachments[0].view =
            context.getCurrentTexture().createView();

        const encoder = device.createCommandEncoder({
            label: 'render quad encoder',
        });
        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(6);  // call our vertex shader 6 times
        pass.end();

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
    }

    const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
            const canvas = entry.target;
            const width = entry.contentBoxSize[0].inlineSize / 64 | 0;
            const height = entry.contentBoxSize[0].blockSize / 64 | 0;
            canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
            canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
            // re-render
            render();
        }
    });
    observer.observe(canvas);
}

function fail(msg) {
    // eslint-disable-next-line no-alert
    alert(msg);
}

main();
