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
    label: 'our hardcoded red triangle shaders',
    code: `
      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> @builtin(position) vec4f {
        let pos = array(
          vec2f( 0.0,  0.5),  // top center
          vec2f(-0.5, -0.5),  // bottom left
          vec2f( 0.5, -0.5)   // bottom right
        );
 
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }
 
      @fragment fn fs() -> @location(0) vec4f { //first render target
        return vec4f(1.0, 0.0, 0.0, 1.0);
      }
    `,
  });

  const moduleCompute = device.createShaderModule({
    label: 'doubling compute module',
    code: `
      @group(0) @binding(0) var<storage, read_write> data: array<f32>;

      @compute @workgroup_size(1) fn computeSomething(
        @builtin(global_invocation_id) id: vec3u
      ) {
        let i = id.x;
        data[i] = data[i] * 2.0;
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: 'our hardcoded red triangle pipeline', //this will be shown in case of error
    layout: 'auto',
    vertex: {
      entryPoint: 'vs', //only needed if there are multiple vertex shaders
      module,
    },
    fragment: {
      entryPoint: 'fs', //only needed if there are multiple fragment shaders
      module,
      targets: [{ format: presentationFormat }], //where we render our shaders, corresponds with location(0) in fs
    },
  });

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

    // make a command encoder to start encoding commands
    const encoder = device.createCommandEncoder({ label: 'our encoder' });

    // make a render pass encoder to encode render specific commands
    const pass = encoder.beginRenderPass(renderPassDescriptor); //We pass it our renderPassDescriptor to tell it which texture we want to render to.
    pass.setPipeline(pipeline);
    pass.draw(3);  // call our vertex shader 3 times
    pass.end();

    const commandBuffer = encoder.finish(); //creates a commanf buffer
    device.queue.submit([commandBuffer]); //submits the command buffer to be executed
  }

  render();

}
main();


