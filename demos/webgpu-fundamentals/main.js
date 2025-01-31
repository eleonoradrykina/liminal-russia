

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
    label: 'our hardcoded rgb triangle shaders',
    code: `
        struct OurVertexShaderOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
      };
      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
     ) -> OurVertexShaderOutput {
        let pos = array(
          vec2f( 0.0,  0.5),  // top center
          vec2f(-0.5, -0.5),  // bottom left
          vec2f( 0.5, -0.5)   // bottom right
        );

        let color = array(
          vec4f(1, 0, 0, 1), // red
          vec4f(0, 1, 0, 1), // green
          vec4f(0, 0, 1, 1), // blue
        );
 
        var vsOutput: OurVertexShaderOutput;
        vsOutput.position = vec4f(pos[vertexIndex], 0.0, 1.0);
        vsOutput.color = color[vertexIndex];
        return vsOutput;
      }
 
       @fragment fn fs(fsInput: OurVertexShaderOutput) -> @location(0) vec4f {
        let red = vec4f(1, 0, 0, 1);
        let colored = fsInput.color;

        let grid = vec2u(fsInput.position.xy) / 16;
        let checker = (grid.x + grid.y) % 2 == 1;

        return select(red, colored, checker);
      }
    `,
  });

  /*

  UNIFORMS

  */

  const moduleUniforms = device.createShaderModule({
    label: 'uniforms module',
    code: `
       struct OurStruct {
        color: vec4f,
        scale: vec2f,
        offset: vec2f,
      };

      @group(0) @binding(0) var<uniform> ourStruct: OurStruct;

      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> @builtin(position) vec4f {
        let pos = array(
          vec2f( 0.0,  0.5),  // top center
          vec2f(-0.5, -0.5),  // bottom left
          vec2f( 0.5, -0.5)   // bottom right
        );
        return vec4f(
          pos[vertexIndex] * ourStruct.scale + ourStruct.offset, 0.0, 1.0);
      }

      @fragment fn fs() -> @location(0) vec4f {
        return ourStruct.color;
      }
    `,
  });



  const moduleCompute = device.createShaderModule({
    label: 'doubling compute module',
    code: `
      @group(0) @binding(0) var<storage, read_write> data: array<f32>;

      @compute @workgroup_size(1) fn computeSomething(
        @builtin(global_invocation_id) id: vec3u //this is the iteration number, just like in vertex shader
      ) {
        let i = id.x;
        data[i] = data[i] * 2.0;
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: 'triangle with uniforms', //this will be shown in case of error
    layout: 'auto',
    vertex: {
      // entryPoint: 'vs', //only needed if there are multiple vertex shaders
      // module,
      module: moduleUniforms,
    },
    fragment: {
      // entryPoint: 'fs', //only needed if there are multiple fragment shaders
      // module,
      module: moduleUniforms,
      targets: [{ format: presentationFormat }], //where we render our shaders, corresponds with location(0) in fs
    },
  });


  const uniformBufferSize =
    4 * 4 + // color is 4 32bit floats (4bytes each)
    2 * 4 + // scale is 2 32bit floats (4bytes each)
    2 * 4;  // offset is 2 32bit floats (4bytes each)
  const uniformBuffer = device.createBuffer({
    label: 'uniforms for triangle',
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // create a typedarray to hold the values for the uniforms in JavaScript
  const uniformValues = new Float32Array(uniformBufferSize / 4);

  // offsets to the various uniform values in float32 indices
  let kColorOffset = 0;
  let kScaleOffset = 4;
  let kOffsetOffset = 6;

  uniformValues.set([0, 1, 0, 1], kColorOffset);        // set the color
  uniformValues.set([-0.5, -0.25], kOffsetOffset);      // set the offset

  //uniform bindGroup
  const bindGroupUniforms = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
    ],
  });

  /*

COMPUTE SHADER

*/
  const pipelineCompute = device.createComputePipeline({
    label: 'doubling compute pipeline',
    layout: 'auto',
    compute: {
      module: moduleCompute,
      entryPoint: 'computeSomething',
    },
  });

  //data for compute shader
  const input = new Float32Array([1, 3, 5]);

  //For WebGPU to use it, we need to make a buffer that exists on the GPU and copy the data to the buffer.

  // create a buffer on the GPU to hold our computation
  // input and output
  const workBuffer = device.createBuffer({
    label: 'work buffer',
    size: input.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  });
  // Copy our input data to that buffer
  device.queue.writeBuffer(workBuffer, 0, input);

  // create a buffer on the GPU to get a copy of the results
  const resultBuffer = device.createBuffer({
    label: 'result buffer',
    size: input.byteLength,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
  });

  // Setup a bindGroup to tell the shader which
  // buffer to use for the computation
  const bindGroup = device.createBindGroup({
    label: 'bindGroup for work buffer',
    layout: pipelineCompute.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: workBuffer } },
    ],
  });

  // Encode commands to do the computation
  const encoder = device.createCommandEncoder({
    label: 'doubling encoder',
  });
  const pass = encoder.beginComputePass({
    label: 'doubling compute pass',
  });
  pass.setPipeline(pipelineCompute);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(input.length);
  pass.end();

  // Encode a command to copy the results to a mappable buffer.
  encoder.copyBufferToBuffer(workBuffer, 0, resultBuffer, 0, resultBuffer.size);

  // Finish encoding and submit the commands
  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);

  // Read the results
  await resultBuffer.mapAsync(GPUMapMode.READ);
  const result = new Float32Array(resultBuffer.getMappedRange());

  console.log('input', input);
  console.log('result', result);

  resultBuffer.unmap();

  const renderPassDescriptor = {
    label: 'our basic canvas renderPass',
    colorAttachments: [
      {
        // view: <- to be filled out when we render
        clearValue: [0.3, 0.3, 0.3, 1],
        loadOp: 'clear', //clear the color before drawing, 'load' would mean to draw over what we have
        storeOp: 'store', //store what we draw
      },
    ],
  };

  function render() {
    // Get the current texture from the canvas context and
    // set it as the texture to render to.
    renderPassDescriptor.colorAttachments[0].view =
      context.getCurrentTexture().createView();

    const time = performance.now();

    const aspect = canvas.width / canvas.height;
    uniformValues.set([Math.sin(time * 0.001) / aspect, 0.5], kScaleOffset); // set the scale
    uniformValues.set([Math.cos(time * 0.001) / aspect, 0.5], kOffsetOffset); // set the offset
    uniformValues.set([Math.sin(time * 0.001), Math.cos(time * 0.001), 0, 1], kColorOffset); // set the color

    // copy the values from JavaScript to the GPU
    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

    // make a command encoder to start encoding commands
    const encoder = device.createCommandEncoder({ label: 'our encoder' });

    // make a render pass encoder to encode render specific commands
    const pass = encoder.beginRenderPass(renderPassDescriptor); //We pass it our renderPassDescriptor to tell it which texture we want to render to.
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroupUniforms);
    pass.draw(3);  // call our vertex shader 3 times
    pass.end();

    const commandBuffer = encoder.finish(); //creates a commanf buffer
    device.queue.submit([commandBuffer]); //submits the command buffer to be executed

    requestAnimationFrame(render);
  }

  render();

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
  // observer.observe(canvas);

}

main();


