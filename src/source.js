const { mat4, vec3 } = glMatrix;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

function main() {
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl");
  if (!gl) return;

  // 1. SETUP PROGRAMS
  const skyboxProgram = createProgram(gl, vertexShaderSource, fragmentShaderSource);
  const texProgram = createProgram(gl, texVertexShaderSource, texFragmentShaderSource);

  // 2. LOOKUP LOCATIONS
  const skyboxLocs = {
    pos: gl.getAttribLocation(skyboxProgram, "a_position"),
    tex: gl.getUniformLocation(skyboxProgram, "u_skybox"),
    viewInv: gl.getUniformLocation(skyboxProgram, "u_viewDirectionProjectionInverse"),
  };

  const texLocs = {
    pos: gl.getAttribLocation(texProgram, "a_position"),
    uv: gl.getAttribLocation(texProgram, "a_texcoord"),
    matrix: gl.getUniformLocation(texProgram, "u_matrix"),
    tex: gl.getUniformLocation(texProgram, "u_texture"),
  };

  // 3. INITIALIZE COMPONENTS
  const camera = new Camera(canvas);
  
  const skybox = new Skybox(gl, skyboxProgram, skyboxLocs, [
    '../assets/skybox/px.png', 
    '../assets/skybox/nx.png',
    '../assets/skybox/py.png', 
    '../assets/skybox/ny.png',
    '../assets/skybox/pz.png', 
    '../assets/skybox/nz.png'
  ]);

  // Create Floor Texture
  const floorTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, floorTexture);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 2, 2, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array([190, 255, 255, 190]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  const floorSize = 15;
  const floor = new Floor(gl, texProgram, texLocs, floorTexture, floorSize);

  let then = 0;
  function render(time) {
    time *= 0.001;
    const deltaTime = time - then;
    then = time;

    // Update Camera
    camera.update(deltaTime);

    // Viewport Setup
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
    }
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    const projectionMatrix = camera.getProjectionMatrix(gl);
    const viewMatrix = camera.getViewMatrix();

    // --- DRAW COMPONENTS ---
    skybox.draw(projectionMatrix, viewMatrix);
    
    gl.depthFunc(gl.LESS);
    const viewProjection = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix);
    floor.draw(gl, viewProjection);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main();
