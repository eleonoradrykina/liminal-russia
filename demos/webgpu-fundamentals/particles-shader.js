import { mat4 } from 'https://webgpufundamentals.org/3rdparty/wgpu-matrix.module.js';


async function loadImageBitmap(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    return await createImageBitmap(blob, { colorSpaceConversion: 'none' });
}

const k = {
    chunkWidth: 16,
    chunkHeight: 16,
};

const sharedConstants = Object.entries(k)
    .map(([k, v]) => `const ${k} = ${v};`)
    .join('\n');


const createFibonacciSphereVertices = ({
    numSamples,
    radius,
}) => {
    const vertices = [];
    const increment = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < numSamples; ++i) {
        const offset = 2 / numSamples;
        const y = ((i * offset) - 1) + (offset / 2);
        const r = Math.sqrt(1 - Math.pow(y, 2));
        const phi = (i % numSamples) * increment;
        const x = Math.cos(phi) * r;
        const z = Math.sin(phi) * r;
        vertices.push(x * radius, y * radius, z * radius, 1.0);
    }
    return new Float32Array(vertices);
}

async function main() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        fail('need a browser that supports WebGPU');
        return;
    }

    console.log('iam here');

    // Get a WebGPU context from the canvas and configure it
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('webgpu');
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: presentationFormat,
    });

    const computeModule = device.createShaderModule({
        label: 'compute',
        code: `
        ${sharedConstants}

        struct Particle {
            pos: vec4f,    // xyz for position, w for lifetime/age
        }

        struct Chunk {
            particles: array<Particle, 1000>,      // Current state
            prevParticles: array<Particle, 1000>,  // Previous state
            initialPos: array<Particle, 1000>,     // Initial/reset positions
        };

        struct Uniforms {
            matrix: mat4x4f,
            resolution: vec2f,
            size: f32,
            time: f32,
        };

        @group(0) @binding(0) var<storage, read_write> chunks: array<Chunk>;
        @group(0) @binding(1) var<uniform> uni: Uniforms;

        @compute @workgroup_size(64)
        fn cs(@builtin(global_invocation_id) id: vec3u) {
            if (id.x >= 1000) {
                return;
            }

            let i = id.x;
            let initialPos = chunks[0].initialPos[i].pos;
            let distance = length(chunks[0].particles[i].pos.xyz - initialPos.xyz);

            if (distance < 2.0) {
                var newPos = chunks[0].particles[i].pos;
                // let wobbleAmount = 0.5;
                newPos.x = initialPos.x + sin(uni.time + f32(i) * 0.001)*0.8 ;
                chunks[0].particles[i].pos = newPos;
            } else {
                chunks[0].particles[i].pos = initialPos;
            }

            chunks[0].prevParticles[i] = chunks[0].particles[i];
        }
        `
    });

    const module = device.createShaderModule({
        label: 'particles',
        code: `
        struct Vertex {
            @location(0) position: vec4f,
        };

        struct Uniforms {
            matrix: mat4x4f,
            resolution: vec2f,
            size: f32,
        };

        struct VSOutput {
            @builtin(position) position: vec4f,
            @location(0) texcoord: vec2f,
        };

        @group(0) @binding(0) var<uniform> uni: Uniforms;


        @vertex fn vs(vert: Vertex,
        @builtin(vertex_index) vNdx: u32,
        ) -> VSOutput {
            let points = array(
                vec2f(-1, -1),
                vec2f( 1, -1),
                vec2f(-1,  1),
                vec2f(-1,  1),
                vec2f( 1, -1),
                vec2f( 1,  1),
            );
            var vsOut: VSOutput;
            let pos = points[vNdx];
            let particlePos = vert.position.xyz;
            let clipPos = uni.matrix * vec4f(particlePos, 1.0);
            let pointPos = vec4f(pos * uni.size / uni.resolution, 0, 0);
            vsOut.position = clipPos + pointPos;
            vsOut.texcoord = (pos + 1.0) * 0.5;  // convert -1,+1 to 0,1
            return vsOut;
        }

        @group(0) @binding(1) var s: sampler;
        @group(0) @binding(2) var t: texture_2d<f32>;

        @fragment fn fs(vsOut: VSOutput) -> @location(0) vec4f {
            // use texture as transparency mask
            let mask = textureSample(t, s, vsOut.texcoord);
            // Pre-multiply the RGB color by the alpha value
            let alpha = mask.r * 1.0;  // adjust the 0.5 multiplier to control overall transparency
            return vec4f(vec3f(0.4, 0.4, 0.9) * alpha, alpha);
        }
        `
    });

    const url = 'images/texture-1.png';
    const source = await loadImageBitmap(url);
    const texture = device.createTexture({
        label: url,
        format: 'rgba8unorm',
        size: [source.width, source.height],
        usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT,
    });

    device.queue.copyExternalImageToTexture(
        { source, flipY: true },
        { texture },
        { width: source.width, height: source.height },
    );

    const pipeline = device.createRenderPipeline({
        label: '3d points',
        layout: 'auto',
        vertex: {
            module,
            buffers: [
                {
                    arrayStride: 16,  // vec4f = 16 bytes
                    stepMode: 'instance',
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x4' },  // position + lifetime
                    ],
                },
            ],
        },
        fragment: {
            module,
            targets: [
                {
                    format: presentationFormat,
                    blend: {
                        color: {
                            srcFactor: 'one',
                            dstFactor: 'one-minus-src-alpha',
                            operation: 'add',
                        },
                        alpha: {
                            srcFactor: 'one',
                            dstFactor: 'one-minus-src-alpha',
                            operation: 'add',
                        },
                    },
                },
            ],
        },
        // primitive: {
        //     topology: 'point-list', // THIS IS MAIN DIFEERENCE FOR POINTS
        // },
    });

    const rand = (min, max) => min + Math.random() * (max - min);

    const vertexData = createFibonacciSphereVertices({
        radius: 1,
        numSamples: 1000,
    });
    const kNumPoints = vertexData.length / 4;

    const uniformValues = new Float32Array(16 + 2 + 1 + 1);
    const uniformBuffer = device.createBuffer({
        size: uniformValues.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const kMatrixOffset = 0;
    const kResolutionOffset = 16;
    const kSizeOffset = 16 + 2;
    const matrixValue = uniformValues.subarray(
        kMatrixOffset, kMatrixOffset + 16);
    const resolutionValue = uniformValues.subarray(
        kResolutionOffset, kResolutionOffset + 2);
    const sizeValue = uniformValues.subarray(
        kSizeOffset, kSizeOffset + 1);

    const sampler = device.createSampler({
        minFilter: 'linear',
        magFilter: 'linear',
    });


    // Create bind group layouts first
    const computeBindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'storage' }
            },
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'uniform' }
            },
        ]
    });

    const computePipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [computeBindGroupLayout]
    });

    const computePipeline = device.createComputePipeline({
        label: 'compute',
        layout: computePipelineLayout,
        compute: {
            module: computeModule,
            entryPoint: 'cs',
        },
    });

    //I am going to update 1000 particles
    const chunksBuffer = device.createBuffer({
        label: 'chunks buffer',
        size: 3 * 1000 * 32, // 3 arrays * 1000 particles * (8 floats * 4 bytes)
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
    });

    // Create buffer containing all three particle arrays (current, previous, initial)
    const allParticleData = new Float32Array(3 * vertexData.length);
    allParticleData.set(vertexData, 0);                        // current state
    allParticleData.set(vertexData, vertexData.length);        // previous state
    allParticleData.set(vertexData, vertexData.length * 2);    // initial positions

    // Write the initial data to the chunksBuffer
    device.queue.writeBuffer(chunksBuffer, 0, allParticleData);
    // Update the bind group creation to match the layout
    const bindComputeGroup = device.createBindGroup({
        layout: computeBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: chunksBuffer } },
            { binding: 1, resource: { buffer: uniformBuffer } },
        ],
    });


    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: sampler },
            { binding: 2, resource: texture.createView() },
        ],
    });

    const vertexBuffer = device.createBuffer({
        label: 'vertex buffer vertices',
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertexData);


    const renderPassDescriptor = {
        label: 'our basic canvas renderPass',
        colorAttachments: [
            {
                // view: <- to be filled out when we render
                clearValue: [0.1, 0.1, 0.2, 1],
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
    };

    const render = (time) => {
        time *= 0.001;

        // Get the current texture from the canvas context and
        // set it as the texture to render to.
        const canvasTexture = context.getCurrentTexture();
        renderPassDescriptor.colorAttachments[0].view =
            canvasTexture.createView();

        // Update the resolution in the uniform buffer
        resolutionValue.set([canvasTexture.width, canvasTexture.height]);
        device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

        const encoder = device.createCommandEncoder();

        const computePass = encoder.beginComputePass();
        computePass.setPipeline(computePipeline);
        computePass.setBindGroup(0, bindComputeGroup);
        computePass.dispatchWorkgroups(1000 / 64);
        computePass.end();

        // Set the size in the uniform values
        sizeValue[0] = 12;

        // Set the matrix in the uniform values
        const fov = 90 * Math.PI / 180;
        const aspect = canvas.clientWidth / canvas.clientHeight;
        const projection = mat4.perspective(fov, aspect, 0.1, 50);
        const view = mat4.lookAt(
            [0, 0, 1.5],  // position
            [0, 0, 0],    // target
            [0, 1, 0],    // up
        );
        const viewProjection = mat4.multiply(projection, view);
        mat4.rotateY(viewProjection, time, matrixValue);
        mat4.rotateX(matrixValue, time * 0.5, matrixValue);

        // Update the resolution in the uniform values
        resolutionValue.set([canvasTexture.width, canvasTexture.height]);

        // Copy the uniform values to the GPU
        device.queue.writeBuffer(uniformBuffer, 0, uniformValues);


        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(pipeline);
        // Each Chunk struct has 3 arrays of 1000 particles
        // The current particles are in the first array at offset 0
        // Each particle is a vec4f (16 bytes)
        pass.setVertexBuffer(0, chunksBuffer, 0, 1000 * 16);
        pass.setBindGroup(0, bindGroup);
        pass.draw(6, kNumPoints);  // Use exact number of particles instead of kNumPoints
        pass.end();

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
            // re-render
            render();
        }
    });
    observer.observe(canvas);
}

function fail(msg) {
    alert(msg);
}

main();