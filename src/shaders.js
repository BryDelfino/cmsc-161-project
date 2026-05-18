// 1. SKYBOX SHADERS
const vertexShaderSource = `
  attribute vec4 a_position;
  varying vec4 v_position;
  void main() {
    v_position = a_position;
    gl_Position = a_position;
    gl_Position.z = 1.0;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform samplerCube u_skybox;
  uniform mat4 u_viewDirectionProjectionInverse;
  varying vec4 v_position;
  void main() {
    vec4 t = u_viewDirectionProjectionInverse * v_position;
    gl_FragColor = textureCube(u_skybox, normalize(t.xyz / t.w));
  }
`;

// 2. SOLID COLOR SHADERS
const solidVertexShaderSource = `
  attribute vec4 a_position;
  uniform mat4 u_matrix;
  void main() {
    gl_Position = u_matrix * a_position;
  }
`;

const solidFragmentShaderSource = `
  precision mediump float;
  uniform vec4 u_color;
  void main() {
    gl_FragColor = u_color;
  }
`;

// 3. TEXTURED OBJECT SHADERS
const texVertexShaderSource = `
  attribute vec4 a_position;
  attribute vec2 a_texcoord;
  uniform mat4 u_matrix;
  varying vec2 v_texcoord;
  void main() {
    gl_Position = u_matrix * a_position;
    v_texcoord = a_texcoord;
  }
`;

const texFragmentShaderSource = `
  precision mediump float;
  varying vec2 v_texcoord;
  uniform sampler2D u_texture;
  uniform vec2 u_uvScale;
  uniform vec2 u_uvOffset;
  void main() {
    gl_FragColor = texture2D(u_texture, fract((v_texcoord * u_uvScale) + u_uvOffset));
  }
`;
