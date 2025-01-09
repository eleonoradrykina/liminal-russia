@binding(0) @group(0) var<uniform> frame : u32;

@vertex
fn vtx_main(@builtin(vertex_index) vertex_index : u32) -> @builtin(position) vec4f {
  const pos = array(
    vec2( 0.0,  1.0),
    vec2( -1.0, -1.0),
    vec2( 1.0, -1.0),
  );

  return vec4f(pos[vertex_index], 0, 1);
}
//https://thebookofshaders.com/08/
// YUV to RGB matrix
const yuv2rgb = mat3x3f(1.0, 0.0, 1.13983,
                    1.0, -0.39465, -0.58060,
                    1.0, 2.03211, 0.0);

@fragment
fn frag_main() -> @location(0) vec4f {
  var color : vec3f = yuv2rgb * vec3f(0.5, sin(f32(frame) / 128), 0.5);
  return vec4(color, 1);
}
