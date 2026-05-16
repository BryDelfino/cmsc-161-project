class Floor extends TexturedMeshNode {
  constructor(gl, program, locs, texture, size = 20) {
    const s = size;
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -s, -2, -s, 1,  s, -2, -s, 1,  s, -2,  s, 1,
      -s, -2, -s, 1,  s, -2,  s, 1, -s, -2,  s, 1,
    ]), gl.STATIC_DRAW);

    const uvScale = s / 5; // Repeats every 10 units (much larger clumps)
    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0,  uvScale, 0,  uvScale, uvScale,
      0, 0,  uvScale, uvScale,  0, uvScale,
    ]), gl.STATIC_DRAW);

    super({
      program: program,
      locs: locs,
      posBuffer: posBuffer,
      uvBuffer: uvBuffer,
      texture: texture,
      count: 6
    });
  }
}
