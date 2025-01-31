// A random number between [min and max)
// With 1 argument it will be [0 to min)
// With no arguments it will be [0 to 1)
const rand = (min, max) => {
    if (min === undefined) {
        min = 0;
        max = 1;
    } else if (max === undefined) {
        max = min;
        min = 0;
    }
    return min + Math.random() * (max - min);
};

function createCircleVertices({
    radius = 1,
    numSubdivisions = 24,
    innerRadius = 0,
    startAngle = 0,
    endAngle = Math.PI * 2,
} = {}) {
    // 2 vertices at each subdivision, + 1 to wrap around the circle.
    const numVertices = (numSubdivisions + 1) * 2;
    // const vertexData = new Float32Array(numSubdivisions * 2 * 3 * 2);
    const vertexData = new Float32Array(numVertices * (2 + 3));

    let offset = 0;
    const addVertex = (x, y, r, g, b) => {
        vertexData[offset++] = x;
        vertexData[offset++] = y;
        vertexData[offset++] = r;
        vertexData[offset++] = g;
        vertexData[offset++] = b;
    };

    const innerColor = [0.3, 0.3, 0.9];
    const outerColor = [0.9, 0.9, 0.9];

    // 2 triangles per subdivision
    //
    // 0  2  4  6  8 ...
    //
    // 1  3  5  7  9 ...
    for (let i = 0; i <= numSubdivisions; ++i) {
        const angle = startAngle + (i + 0) * (endAngle - startAngle) / numSubdivisions;

        const c1 = Math.cos(angle);
        const s1 = Math.sin(angle);

        addVertex(c1 * radius, s1 * radius, ...outerColor);
        addVertex(c1 * innerRadius, s1 * innerRadius, ...innerColor);
    }

    const indexData = new Uint32Array(numSubdivisions * 6);
    let ndx = 0;

    // 1st tri  2nd tri  3rd tri  4th tri
    // 0 1 2    2 1 3    2 3 4    4 3 5
    //
    // 0--2        2     2--4        4  .....
    // | /        /|     | /        /|
    // |/        / |     |/        / |
    // 1        1--3     3        3--5  .....
    for (let i = 0; i < numSubdivisions; ++i) {
        const ndxOffset = i * 2;

        // first triangle
        indexData[ndx++] = ndxOffset;
        indexData[ndx++] = ndxOffset + 1;
        indexData[ndx++] = ndxOffset + 2;

        // second triangle
        indexData[ndx++] = ndxOffset + 2;
        indexData[ndx++] = ndxOffset + 1;
        indexData[ndx++] = ndxOffset + 3;
    }

    return {
        vertexData,
        indexData,
        numVertices: indexData.length,
    };
}

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
        code: `
      struct Vertex {
        @location(0) position: vec2f,
        @location(1) color: vec4f,
        @location(2) offset: vec2f,
        @location(3) scale: vec2f,
        @location(4) perVertexColor: vec3f,
      };

      struct VSOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
      };

      @vertex fn vs(
        vert: Vertex,
      ) -> VSOutput {
        var vsOut: VSOutput;
        vsOut.position = vec4f(
            vert.position * vert.scale + vert.offset, 0.0, 1.0);
        vsOut.color = vert.color * vec4f(vert.perVertexColor, 1.0);
        return vsOut;
      }

      @fragment fn fs(vsOut: VSOutput) -> @location(0) vec4f {
        return vsOut.color;
      }
    `,
    });

    const pipeline = device.createRenderPipeline({
        label: 'flat colors',
        layout: 'auto',
        vertex: {
            module,
            buffers: [
                {
                    arrayStride: 5 * 4, // 2 floats, 4 bytes each
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x2' },  // position
                        { shaderLocation: 4, offset: 8, format: 'float32x3' },  // perVertexColor
                    ],
                },
                {
                    arrayStride: 6 * 4, // 6 floats, 4 bytes each
                    stepMode: 'instance',
                    attributes: [
                        { shaderLocation: 1, offset: 0, format: 'float32x4' },  // color
                        { shaderLocation: 2, offset: 16, format: 'float32x2' },  // offset
                    ],
                },
                {
                    arrayStride: 2 * 4, // 2 floats, 4 bytes each
                    stepMode: 'instance',
                    attributes: [
                        { shaderLocation: 3, offset: 0, format: 'float32x2' },   // scale
                    ],
                },
            ],
        },
        fragment: {
            module,
            targets: [{ format: presentationFormat }],
        },
    });

    const kNumObjects = 100;
    const objectInfos = [];

    // create 2 storage buffers
    const staticUnitSize =
        4 * 4 + // color is 4 32bit floats (4bytes each)
        2 * 4;  // offset is 2 32bit floats (4bytes each)
    const changingUnitSize =
        2 * 4;  // scale is 2 32bit floats (4bytes each)
    const staticVertexBufferSize = staticUnitSize * kNumObjects;
    const changingVertexBufferSize = changingUnitSize * kNumObjects;

    const staticVertexBuffer = device.createBuffer({
        label: 'static vertex for objects',
        size: staticVertexBufferSize,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    const changingVertexBuffer = device.createBuffer({
        label: 'changing vertex for objects',
        size: changingVertexBufferSize,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    // offsets to the various uniform values in float32 indices
    const kColorOffset = 0;
    const kOffsetOffset = 4;

    const kScaleOffset = 0;

    {
        const staticVertexValues = new Float32Array(staticVertexBufferSize / 4);
        for (let i = 0; i < kNumObjects; ++i) {
            const staticOffset = i * (staticUnitSize / 4);

            // These are only set once so set them now
            staticVertexValues.set([rand(), rand(), rand(), 1], staticOffset + kColorOffset);        // set the color
            staticVertexValues.set([rand(-0.9, 0.9), rand(-0.9, 0.9)], staticOffset + kOffsetOffset);      // set the offset

            objectInfos.push({
                scale: rand(0.2, 0.5),
            });
        }
        device.queue.writeBuffer(staticVertexBuffer, 0, staticVertexValues);
    }

    // a typed array we can use to update the changingStorageBuffer
    const vertexValues = new Float32Array(changingVertexBufferSize / 4);

    const { vertexData, indexData, numVertices } = createCircleVertices({
        radius: 0.5,
        innerRadius: 0.25,
    });
    const vertexBuffer = device.createBuffer({
        label: 'vertex buffer vertices',
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertexData);

    const indexBuffer = device.createBuffer({
        label: 'index buffer',
        size: indexData.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indexBuffer, 0, indexData);

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

    function render() {
        // Get the current texture from the canvas context and
        // set it as the texture to render to.
        renderPassDescriptor.colorAttachments[0].view =
            context.getCurrentTexture().createView();

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(pipeline);
        pass.setVertexBuffer(0, vertexBuffer);
        pass.setVertexBuffer(1, staticVertexBuffer);
        pass.setVertexBuffer(2, changingVertexBuffer);
        pass.setIndexBuffer(indexBuffer, 'uint32');


        // Set the uniform values in our JavaScript side Float32Array
        const aspect = canvas.width / canvas.height;

        // set the scales for each object
        objectInfos.forEach(({ scale }, ndx) => {
            const offset = ndx * (changingUnitSize / 4);
            vertexValues.set([scale / aspect, scale], offset + kScaleOffset); // set the scale
        });
        // upload all scales at once
        device.queue.writeBuffer(changingVertexBuffer, 0, vertexValues);

        pass.drawIndexed(numVertices, kNumObjects);

        pass.end();

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
    }

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
