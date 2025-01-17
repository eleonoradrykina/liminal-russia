// see https://webgpufundamentals.org/webgpu/lessons/webgpu-utils.html#wgpu-matrix
import { mat4 } from 'https://webgpufundamentals.org/3rdparty/wgpu-matrix.module.js';
// import { bwChunkCompute } from './bw-compute.wgsl';


const range = (i, fn) => new Array(i).fill(0).map((_, i) => fn(i));

async function main() {
    const adapter = await navigator.gpu?.requestAdapter();
    const canTimestamp = adapter?.features.has('timestamp-query');
    const device = await adapter?.requestDevice({
        requiredFeatures: [
            ...(canTimestamp ? ['timestamp-query'] : []),
        ],
    });
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

    const k = {
        chunkWidth: 256,
        chunkHeight: 1,
    };
    const chunkSize = k.chunkWidth * k.chunkHeight;
    const sharedConstants = Object.entries(k).map(([k, v]) => `const ${k} = ${v};`).join('\n');

    // console.log(`${sharedConstants}\n${bwChunkCompute}`)

    // const bwChunkModule = device.createShaderModule({
    //     label: 'bw shader',
    //     code: `${bwChunkCompute.toString()}`,
    // });
    const bwChunkModule = device.createShaderModule({
        label: 'bw shader',
        code: `
        ${sharedConstants}

        struct Chunk {
            pixels: array<vec4f, ${chunkSize}>
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
        `,
    });



    const videoModule = device.createShaderModule({
        label: 'our hardcoded textured quad shaders',
        code: `
      struct OurVertexShaderOutput {
        @builtin(position) position: vec4f,
        @location(0) texcoord: vec2f,
      };

      struct Uniforms {
        matrix: mat4x4f,
      };

      @group(0) @binding(2) var<uniform> uni: Uniforms;

      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> OurVertexShaderOutput {
        let pos = array(

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
        vsOutput.position = uni.matrix * vec4f(xy, 0.0, 1.0);
        vsOutput.texcoord = xy;
        return vsOutput;
      }

      @group(0) @binding(0) var ourSampler: sampler;
      @group(0) @binding(1) var ourTexture: texture_2d<f32>;

      @fragment fn fs(fsInput: OurVertexShaderOutput) -> @location(0) vec4f {
        return textureSample(
            ourTexture,
            ourSampler,
            fsInput.texcoord,
        );
      }
    `,
    });

    const bwChunkPipeline = device.createComputePipeline({
        label: ' bw',
        layout: 'auto',
        compute: {
            module: bwChunkModule,
        },
    });

    const videoPipeline = device.createRenderPipeline({
        label: 'hardcoded video textured quad pipeline',
        layout: 'auto',
        vertex: {
            module: videoModule,
        },
        fragment: {
            module: videoModule,
            targets: [{ format: presentationFormat }],
        },
    });

    const videoSampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });

    // create a typedarray to hold the values for the uniforms in JavaScript
    const videoUniformValues = new Float32Array(16 * 4);
    // create a buffer for the uniform values
    const videoUniformBuffer = device.createBuffer({
        label: 'uniforms for video',
        size: videoUniformValues.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const kMatrixOffset = 0;
    const videoMatrix = videoUniformValues.subarray(kMatrixOffset, 16);

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

    function startPlayingAndWaitForVideo(video) {
        return new Promise((resolve, reject) => {
            video.addEventListener('error', reject);
            if ('requestVideoFrameCallback' in video) {
                video.requestVideoFrameCallback(resolve);
            } else {
                const timeWatcher = () => {
                    if (video.currentTime > 0) {
                        resolve();
                    } else {
                        requestAnimationFrame(timeWatcher);
                    }
                };
                timeWatcher();
            }
            video.play().catch(reject);
        });
    }

    function waitForClick() {
        return new Promise(resolve => {
            window.addEventListener(
                'click',
                () => {
                    document.querySelector('#start').style.display = 'none';
                    resolve();
                },
                { once: true });
        });
    }

    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.preload = 'auto';
    video.src = 'images/twinpeaks-mirror.mp4';
    await waitForClick();
    await startPlayingAndWaitForVideo(video);

    canvas.addEventListener('click', () => {
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    });

    // Create buffer for chunks
    const chunksAcross = Math.ceil(video.videoWidth / k.chunkWidth);
    const chunksDown = Math.ceil(video.videoHeight / k.chunkHeight);
    const numChunks = chunksAcross * chunksDown;


    const chunksBuffer = device.createBuffer({
        size: numChunks * chunkSize * 4 * 4, // vec4f per pixel
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    function render() {
        const texture = device.importExternalTexture({ source: video });

        const outputTexture = device.createTexture({
            size: [video.videoWidth, video.videoHeight],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        });

        const bwBindGroup = device.createBindGroup({
            layout: bwChunkPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: texture },
                { binding: 1, resource: outputTexture.createView() },
                { binding: 2, resource: { buffer: chunksBuffer } },
            ],
        });

        const encoder = device.createCommandEncoder({ label: 'video post-proc encoder' });
        {
            const pass = encoder.beginComputePass();
            pass.setPipeline(bwChunkPipeline);
            pass.setBindGroup(0, bwBindGroup);
            pass.dispatchWorkgroups(
                Math.ceil(video.videoWidth / k.chunkWidth),
                Math.ceil(video.videoHeight / k.chunkHeight)
            );
            pass.end();
        }

        // Draw to canvas
        {
            const canvasTexture = context.getCurrentTexture().createView();
            renderPassDescriptor.colorAttachments[0].view = canvasTexture;
            const pass = encoder.beginRenderPass(renderPassDescriptor);

            // Draw video
            const bindGroup = device.createBindGroup({
                layout: videoPipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: videoSampler },
                    { binding: 1, resource: outputTexture.createView() }, // Render processed texture
                    { binding: 2, resource: { buffer: videoUniformBuffer } },
                ],
            });

            // 'cover' canvas
            const canvasAspect = canvas.clientWidth / canvas.clientHeight;
            const videoAspect = video.videoWidth / video.videoHeight;
            const scale = canvasAspect > videoAspect
                ? [1, canvasAspect / videoAspect, 1]
                : [videoAspect / canvasAspect, 1, 1];

            const matrix = mat4.identity(videoMatrix);
            mat4.scale(matrix, scale, matrix);
            mat4.translate(matrix, [-1, 1, 0], matrix);
            mat4.scale(matrix, [2, -2, 1], matrix);

            device.queue.writeBuffer(videoUniformBuffer, 0, videoUniformValues);

            pass.setPipeline(videoPipeline);
            pass.setBindGroup(0, bindGroup);
            pass.draw(6);  // call our vertex shader 6 times

            pass.end();
        }

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
            const canvas = entry.target;
            const width = entry.contentBoxSize[0].inlineSize;
            const height = entry.contentBoxSize[0].blockSize;
            canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
            canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
        }
    });
    observer.observe(canvas);
}

function fail(msg) {
    // eslint-disable-next-line no-alert
    alert(msg);
}

main();
