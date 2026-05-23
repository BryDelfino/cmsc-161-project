class Wall extends MeshNode {
  constructor(gl, program, locs, color = [0.8, 0.7, 0.5, 1.0]) {
    super({ program, locs, color });
    this.program = program;
    this.locs = locs;
    this.color = color;
    this.emissive = 0.0;
    this.twoSided = 0.0;
    
    // Position (4) + UV (2) + Normal (3) = 9 floats per vertex (stride 36 bytes)
    const vertices = new Float32Array([
      // Front face
      -0.5, -0.5,  0.5, 1,  0, 0,  0, 0, 1,
       0.5, -0.5,  0.5, 1,  1, 0,  0, 0, 1,
       0.5,  0.5,  0.5, 1,  1, 1,  0, 0, 1,
      -0.5,  0.5,  0.5, 1,  0, 1,  0, 0, 1,
      // Back face (corrected to run horizontally: U along X, V along Y)
      -0.5, -0.5, -0.5, 1,  0, 0,  0, 0, -1,
      -0.5,  0.5, -0.5, 1,  0, 1,  0, 0, -1,
       0.5,  0.5, -0.5, 1,  1, 1,  0, 0, -1,
       0.5, -0.5, -0.5, 1,  1, 0,  0, 0, -1,
      // Top face (rotated 90 degrees so wood grain runs horizontally along X-axis)
      -0.5,  0.5, -0.5, 1,  0, 0,  0, 1, 0,
      -0.5,  0.5,  0.5, 1,  0, 1,  0, 1, 0,
       0.5,  0.5,  0.5, 1,  1, 1,  0, 1, 0,
       0.5,  0.5, -0.5, 1,  1, 0,  0, 1, 0,
      // Bottom face
      -0.5, -0.5, -0.5, 1,  0, 0,  0, -1, 0,
       0.5, -0.5, -0.5, 1,  1, 0,  0, -1, 0,
       0.5, -0.5,  0.5, 1,  1, 1,  0, -1, 0,
      -0.5, -0.5,  0.5, 1,  0, 1,  0, -1, 0,
      // Right face (corrected to run horizontally: U along Z, V along Y)
       0.5, -0.5, -0.5, 1,  0, 0,  1, 0, 0,
       0.5,  0.5, -0.5, 1,  0, 1,  1, 0, 0,
       0.5,  0.5,  0.5, 1,  1, 1,  1, 0, 0,
       0.5, -0.5,  0.5, 1,  1, 0,  1, 0, 0,
      // Left face
      -0.5, -0.5, -0.5, 1,  0, 0, -1, 0, 0,
      -0.5, -0.5,  0.5, 1,  1, 0, -1, 0, 0,
      -0.5,  0.5,  0.5, 1,  1, 1, -1, 0, 0,
      -0.5,  0.5, -0.5, 1,  0, 1, -1, 0, 0,
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

  draw(gl, viewProjection, texture, shadowProgramInfo) {
    if (texture && typeof texture === 'object' && texture.program && texture.locs) {
      shadowProgramInfo = texture;
      texture = null;
    }
    let program = shadowProgramInfo ? shadowProgramInfo.program : this.program;
    let locs = shadowProgramInfo ? shadowProgramInfo.locs : this.locs;

    if (!program) return;
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vbuf);
    // Stride is 36 bytes (9 floats * 4 bytes)
    gl.vertexAttribPointer(locs.pos, 4, gl.FLOAT, false, 36, 0);
    gl.enableVertexAttribArray(locs.pos);
    
    if (!shadowProgramInfo) {
      if (locs.uv !== undefined && locs.uv !== -1) {
        gl.vertexAttribPointer(locs.uv, 2, gl.FLOAT, false, 36, 16);
        gl.enableVertexAttribArray(locs.uv);
      }

      if (locs.tex && texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(locs.tex, 0);

        if (locs.uvScale) {
          gl.uniform2fv(locs.uvScale, this.uvScale || [1.0, 1.0]);
        }
        if (locs.uvOffset) {
          gl.uniform2fv(locs.uvOffset, this.uvOffset || [0.0, 0.0]);
        }
      }

      if (locs.normal !== undefined && locs.normal !== -1) {
        gl.vertexAttribPointer(locs.normal, 3, gl.FLOAT, false, 36, 24);
        gl.enableVertexAttribArray(locs.normal);
      }
    }

    const mvp = mat4.multiply(mat4.create(), viewProjection, this.worldMatrix);
    gl.uniformMatrix4fv(locs.matrix, false, mvp);

    if (!shadowProgramInfo) {
      if (locs.worldMatrix) {
        gl.uniformMatrix4fv(locs.worldMatrix, false, this.worldMatrix);
      }
      if (locs.worldInverseTranspose) {
        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, this.worldMatrix);
        mat4.transpose(normalMatrix, normalMatrix);
        gl.uniformMatrix4fv(locs.worldInverseTranspose, false, normalMatrix);
      }
      if (locs.shininess) {
        gl.uniform1f(locs.shininess, this.shininess !== undefined ? this.shininess : 1.0);
      }
      if (locs.specularStrength) {
        gl.uniform1f(locs.specularStrength, this.specularStrength !== undefined ? this.specularStrength : 0.0);
      }
      if (locs.emissive) {
        gl.uniform1f(locs.emissive, this.emissive !== undefined ? this.emissive : 0.0);
      }
      if (locs.twoSided) {
        gl.uniform1f(locs.twoSided, this.twoSided !== undefined ? this.twoSided : 0.0);
      }

      if (locs.color) {
        gl.uniform4fv(locs.color, this.color);
      }
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.ibuf);
    gl.drawElements(gl.TRIANGLES, this.mesh.count, gl.UNSIGNED_SHORT, 0);
  }
}
