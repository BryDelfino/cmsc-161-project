"use strict";

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
  const solidProgram = createProgram(gl, solidVertexShaderSource, solidFragmentShaderSource);
  const texProgram = createProgram(gl, texVertexShaderSource, texFragmentShaderSource);

  // 2. LOOKUP LOCATIONS
  const skyboxLocs = {
    pos: gl.getAttribLocation(skyboxProgram, "a_position"),
    tex: gl.getUniformLocation(skyboxProgram, "u_skybox"),
    viewInv: gl.getUniformLocation(skyboxProgram, "u_viewDirectionProjectionInverse"),
  };

  const solidLocs = {
    pos: gl.getAttribLocation(solidProgram, "a_position"),
    matrix: gl.getUniformLocation(solidProgram, "u_matrix"),
    color: gl.getUniformLocation(solidProgram, "u_color"),
  };

  const texLocs = {
    pos: gl.getAttribLocation(texProgram, "a_position"),
    uv: gl.getAttribLocation(texProgram, "a_texcoord"),
    matrix: gl.getUniformLocation(texProgram, "u_matrix"),
    tex: gl.getUniformLocation(texProgram, "u_texture"),
  };

  // 3. SETUP GEOMETRY BUFFERS
  // Skybox Quad
  const skyboxBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, skyboxBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

  // Textured Floor Plane
  const floorPosBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, floorPosBuffer);
  const s = 20;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -s, -2, -s,  s, -2, -s,  s, -2,  s,
    -s, -2, -s,  s, -2,  s, -s, -2,  s,
  ]), gl.STATIC_DRAW);

  const floorUVBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, floorUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0, 0,  10, 0,  10, 10,
    0, 0,  10, 10,  0, 10,
  ]), gl.STATIC_DRAW);

  // 4. SETUP TEXTURES
  // Skybox Cubemap
  const skyboxTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
  const faceInfos = [
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: '../assets/skybox/px.png' },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: '../assets/skybox/nx.png' },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: '../assets/skybox/py.png' },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: '../assets/skybox/ny.png' },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: '../assets/skybox/pz.png' },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: '../assets/skybox/nz.png' },
  ];
  faceInfos.forEach((face) => {
    gl.texImage2D(face.target, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,255,255]));
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = face.url;
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
      gl.texImage2D(face.target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    };
  });
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // 2D Checkerboard Texture for the Floor
  const floorTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, floorTexture);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 2, 2, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array([190, 255, 255, 190]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  // 5. FPS CONTROLS
  let cameraPos = vec3.fromValues(0, 0, 5);
  let yaw = -Math.PI / 2;
  let pitch = 0;
  const keys = {};

  canvas.addEventListener('click', () => canvas.requestPointerLock());
  window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
  window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas) {
      const sensitivity = 0.001;
      yaw += e.movementX * sensitivity;
      pitch -= e.movementY * sensitivity;
      const halfPi = Math.PI / 2;
      pitch = Math.max(-halfPi + 0.05, Math.min(halfPi - 0.05, pitch));
    }
  });

  let then = 0;
  function render(time) {
    time *= 0.001;
    const deltaTime = time - then;
    then = time;

    // Movement
    const moveSpeed = 5 * deltaTime;
    const forward = vec3.fromValues(Math.cos(yaw), 0, Math.sin(yaw));
    const right = vec3.fromValues(-Math.sin(yaw), 0, Math.cos(yaw));
    if (keys['w']) vec3.scaleAndAdd(cameraPos, cameraPos, forward, moveSpeed);
    if (keys['s']) vec3.scaleAndAdd(cameraPos, cameraPos, forward, -moveSpeed);
    if (keys['a']) vec3.scaleAndAdd(cameraPos, cameraPos, right, -moveSpeed);
    if (keys['d']) vec3.scaleAndAdd(cameraPos, cameraPos, right, moveSpeed);

    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
    }
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    const aspect = gl.canvas.width / gl.canvas.height;
    const projectionMatrix = mat4.perspective(mat4.create(), Math.PI/3, aspect, 0.1, 2000);
    const front = vec3.fromValues(Math.cos(yaw)*Math.cos(pitch), Math.sin(pitch), Math.sin(yaw)*Math.cos(pitch));
    const target = vec3.add(vec3.create(), cameraPos, front);
    const viewMatrix = mat4.lookAt(mat4.create(), cameraPos, target, [0, 1, 0]);

    // --- DRAW SKYBOX ---
    gl.useProgram(skyboxProgram);
    gl.enableVertexAttribArray(skyboxLocs.pos);
    gl.bindBuffer(gl.ARRAY_BUFFER, skyboxBuffer);
    gl.vertexAttribPointer(skyboxLocs.pos, 2, gl.FLOAT, false, 0, 0);

    const skyboxViewMatrix = mat4.clone(viewMatrix);
    skyboxViewMatrix[12] = 0; skyboxViewMatrix[13] = 0; skyboxViewMatrix[14] = 0;
    const skyboxViewProjInv = mat4.invert(mat4.create(), mat4.multiply(mat4.create(), projectionMatrix, skyboxViewMatrix));
    gl.uniformMatrix4fv(skyboxLocs.viewInv, false, skyboxViewProjInv);
    gl.uniform1i(skyboxLocs.tex, 0);
    gl.depthFunc(gl.LEQUAL);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // --- DRAW TEXTURED FLOOR ---
    gl.useProgram(texProgram);
    gl.enableVertexAttribArray(texLocs.pos);
    gl.bindBuffer(gl.ARRAY_BUFFER, floorPosBuffer);
    gl.vertexAttribPointer(texLocs.pos, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(texLocs.uv);
    gl.bindBuffer(gl.ARRAY_BUFFER, floorUVBuffer);
    gl.vertexAttribPointer(texLocs.uv, 2, gl.FLOAT, false, 0, 0);

    const floorMatrix = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix);
    gl.uniformMatrix4fv(texLocs.matrix, false, floorMatrix);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, floorTexture);
    gl.uniform1i(texLocs.tex, 0);

    gl.depthFunc(gl.LESS);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main();
