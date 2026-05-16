class Wall extends MeshNode {
  constructor(gl, program, locs, color = [0.8, 0.7, 0.5, 1.0]) {
    super({ program, locs, color });
    this.program = program;
    this.locs = locs;
    this.color = color;
    
    // Position (4) + UV (2) = 6 floats per vertex
    const vertices = new Float32Array([
      // Front face
      -0.5, -0.5,  0.5, 1,  0, 0,
       0.5, -0.5,  0.5, 1,  1, 0,
       0.5,  0.5,  0.5, 1,  1, 1,
      -0.5,  0.5,  0.5, 1,  0, 1,
      // Back face
      -0.5, -0.5, -0.5, 1,  0, 0,
      -0.5,  0.5, -0.5, 1,  1, 0,
       0.5,  0.5, -0.5, 1,  1, 1,
       0.5, -0.5, -0.5, 1,  0, 1,
      // Top face
      -0.5,  0.5, -0.5, 1,  0, 0,
      -0.5,  0.5,  0.5, 1,  1, 0,
       0.5,  0.5,  0.5, 1,  1, 1,
       0.5,  0.5, -0.5, 1,  0, 1,
      // Bottom face
      -0.5, -0.5, -0.5, 1,  0, 0,
       0.5, -0.5, -0.5, 1,  1, 0,
       0.5, -0.5,  0.5, 1,  1, 1,
      -0.5, -0.5,  0.5, 1,  0, 1,
      // Right face
       0.5, -0.5, -0.5, 1,  0, 0,
       0.5,  0.5, -0.5, 1,  1, 0,
       0.5,  0.5,  0.5, 1,  1, 1,
       0.5, -0.5,  0.5, 1,  0, 1,
      // Left face
      -0.5, -0.5, -0.5, 1,  0, 0,
      -0.5, -0.5,  0.5, 1,  1, 0,
      -0.5,  0.5,  0.5, 1,  1, 1,
      -0.5,  0.5, -0.5, 1,  0, 1,
    ]);

    const indices = new Uint16Array([
      0, 1, 2, 0, 2, 3,    // front
      4, 5, 6, 4, 6, 7,    // back
      8, 9, 10, 8, 10, 11, // top
      12, 13, 14, 12, 14, 15, // bottom
      16, 17, 18, 16, 18, 19, // right
      20, 21, 22, 20, 22, 23, // left
    ]);

    this.mesh = {
      vbuf: gl.createBuffer(),
      ibuf: gl.createBuffer(),
      count: indices.length,
    };

    gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vbuf);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.ibuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  }

  draw(gl, viewProjection, texture) {
    if (!this.program) return;
    gl.useProgram(this.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vbuf);
    // Stride is 24 bytes (6 floats * 4 bytes)
    gl.vertexAttribPointer(this.locs.pos, 4, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(this.locs.pos);
    
    if (this.locs.uv !== undefined && this.locs.uv !== -1) {
      gl.vertexAttribPointer(this.locs.uv, 2, gl.FLOAT, false, 24, 16);
      gl.enableVertexAttribArray(this.locs.uv);
    }

    const mvp = mat4.multiply(mat4.create(), viewProjection, this.worldMatrix);
    gl.uniformMatrix4fv(this.locs.matrix, false, mvp);

    if (this.locs.tex && texture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(this.locs.tex, 0);
    }

    if (this.locs.color) {
      gl.uniform4fv(this.locs.color, this.color);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.ibuf);
    gl.drawElements(gl.TRIANGLES, this.mesh.count, gl.UNSIGNED_SHORT, 0);
  }
}
