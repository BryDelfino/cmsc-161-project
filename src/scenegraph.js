// Object node that defines hiearchical objects and world transformations.
class Node {
  constructor() {
    this.children = [];
    this.parent = null;
    this.localMatrix = mat4.create();
    this.worldMatrix = mat4.create();
  }

  // Set node parent.
  setParent(parent) {
    if (this.parent) {
      const index = this.parent.children.indexOf(this);
      if (index >= 0) {
        this.parent.children.splice(index, 1);
      }
    }
    if (parent) {
      parent.children.push(this);
    }
    this.parent = parent;
  }

  // Update world matrix of this node and all its children.
  updateWorldMatrix(parentWorldMatrix) {
    if (parentWorldMatrix) {
      mat4.multiply(this.worldMatrix, parentWorldMatrix, this.localMatrix);
    } else {
      mat4.copy(this.worldMatrix, this.localMatrix);
    }

    const worldMatrix = this.worldMatrix;
    this.children.forEach((child) => {
      child.updateWorldMatrix(worldMatrix);
    });
  }

  // local transformations for objects.
  translate(v) {
    mat4.translate(this.localMatrix, this.localMatrix, v);
  }

  rotate(rad, axis) {
    mat4.rotate(this.localMatrix, this.localMatrix, rad, axis);
  }

  scale(v) {
    mat4.scale(this.localMatrix, this.localMatrix, v);
  }
}

// For mesh with solid color.
class MeshNode extends Node {
  constructor(meshInfo) {
    super();
    this.meshInfo = meshInfo;
    this.shininess = 1.0;
    this.specularStrength = 0.0;
    this.emissive = 0.0;
    this.twoSided = 0.0;
  }

  draw(gl, projectionViewMatrix, shadowProgramInfo) {
    const program = shadowProgramInfo ? shadowProgramInfo.program : this.meshInfo.program;
    const locs = shadowProgramInfo ? shadowProgramInfo.locs : this.meshInfo.locs;
    gl.useProgram(program);

    gl.enableVertexAttribArray(locs.pos);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.meshInfo.buffer);
    gl.vertexAttribPointer(locs.pos, 4, gl.FLOAT, false, 0, 0);

    const mvpMatrix = mat4.multiply(mat4.create(), projectionViewMatrix, this.worldMatrix);
    gl.uniformMatrix4fv(locs.matrix, false, mvpMatrix);

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
        gl.uniform1f(locs.shininess, this.shininess);
      }
      if (locs.specularStrength) {
        gl.uniform1f(locs.specularStrength, this.specularStrength);
      }
      if (locs.emissive) {
        gl.uniform1f(locs.emissive, this.emissive);
      }
      if (locs.twoSided) {
        gl.uniform1f(locs.twoSided, this.twoSided);
      }

      gl.uniform4fv(locs.color, this.meshInfo.color);
    }

    gl.drawArrays(gl.TRIANGLES, 0, this.meshInfo.count);
  }
}

// For mesh with texture.
class TexturedMeshNode extends Node {
  constructor(meshInfo) {
    super();
    this.meshInfo = meshInfo; // { program, locs, posBuffer, uvBuffer, normalBuffer, texture, count }
    this.shininess = 1.0;
    this.specularStrength = 0.0;
    this.emissive = 0.0;
    this.twoSided = 0.0;
  }

  draw(gl, projectionViewMatrix, shadowProgramInfo) {
    const program = shadowProgramInfo ? shadowProgramInfo.program : this.meshInfo.program;
    const locs = shadowProgramInfo ? shadowProgramInfo.locs : this.meshInfo.locs;
    gl.useProgram(program);

    // Positions
    gl.enableVertexAttribArray(locs.pos);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.meshInfo.posBuffer);
    gl.vertexAttribPointer(locs.pos, 4, gl.FLOAT, false, 0, 0);

    if (!shadowProgramInfo) {
      // UVs
      gl.enableVertexAttribArray(locs.uv);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.meshInfo.uvBuffer);
      gl.vertexAttribPointer(locs.uv, 2, gl.FLOAT, false, 0, 0);

      // Normals
      if (locs.normal !== undefined && locs.normal !== -1 && this.meshInfo.normalBuffer) {
        gl.enableVertexAttribArray(locs.normal);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.meshInfo.normalBuffer);
        gl.vertexAttribPointer(locs.normal, 3, gl.FLOAT, false, 0, 0);
      }

      // Texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.meshInfo.texture);
      gl.uniform1i(locs.tex, 0);

      if (locs.uvScale) {
        gl.uniform2fv(locs.uvScale, [1.0, 1.0]);
      }
      if (locs.uvOffset) {
        gl.uniform2fv(locs.uvOffset, [0.0, 0.0]);
      }
    }

    const mvpMatrix = mat4.multiply(mat4.create(), projectionViewMatrix, this.worldMatrix);
    gl.uniformMatrix4fv(locs.matrix, false, mvpMatrix);

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
        gl.uniform1f(locs.shininess, this.shininess);
      }
      if (locs.specularStrength) {
        gl.uniform1f(locs.specularStrength, this.specularStrength);
      }
      if (locs.emissive) {
        gl.uniform1f(locs.emissive, this.emissive);
      }
      if (locs.twoSided) {
        gl.uniform1f(locs.twoSided, this.twoSided);
      }
    }

    gl.drawArrays(gl.TRIANGLES, 0, this.meshInfo.count);
  }
}

class Cube extends MeshNode {
  constructor(gl, program, locs, color = [0.8, 0.7, 0.5, 1.0]) {
    super({ program, locs, color });
    this.program = program;
    this.locs = locs;
    this.color = color;
    this.emissive = 0.0;
    this.twoSided = 0.0;

    const vertices = new Float32Array([
      // Front
      -0.5, -0.5,  0.5, 1,  0, 0,  0, 0, 1,
       0.5, -0.5,  0.5, 1,  1, 0,  0, 0, 1,
       0.5,  0.5,  0.5, 1,  1, 1,  0, 0, 1,
      -0.5,  0.5,  0.5, 1,  0, 1,  0, 0, 1,
      // Back
      -0.5, -0.5, -0.5, 1,  0, 0,  0, 0, -1,
      -0.5,  0.5, -0.5, 1,  0, 1,  0, 0, -1,
       0.5,  0.5, -0.5, 1,  1, 1,  0, 0, -1,
       0.5, -0.5, -0.5, 1,  1, 0,  0, 0, -1,
      // Top
      -0.5,  0.5, -0.5, 1,  0, 0,  0, 1, 0,
      -0.5,  0.5,  0.5, 1,  0, 1,  0, 1, 0,
       0.5,  0.5,  0.5, 1,  1, 1,  0, 1, 0,
       0.5,  0.5, -0.5, 1,  1, 0,  0, 1, 0,
      // Bottom
      -0.5, -0.5, -0.5, 1,  0, 0,  0, -1, 0,
       0.5, -0.5, -0.5, 1,  1, 0,  0, -1, 0,
       0.5, -0.5,  0.5, 1,  1, 1,  0, -1, 0,
      -0.5, -0.5,  0.5, 1,  0, 1,  0, -1, 0,
      // Right
       0.5, -0.5, -0.5, 1,  0, 0,  1, 0, 0,
       0.5,  0.5, -0.5, 1,  0, 1,  1, 0, 0,
       0.5,  0.5,  0.5, 1,  1, 1,  1, 0, 0,
       0.5, -0.5,  0.5, 1,  1, 0,  1, 0, 0,
      // Left
      -0.5, -0.5, -0.5, 1,  0, 0, -1, 0, 0,
      -0.5, -0.5,  0.5, 1,  1, 0, -1, 0, 0,
      -0.5,  0.5,  0.5, 1,  1, 1, -1, 0, 0,
      -0.5,  0.5, -0.5, 1,  0, 1, -1, 0, 0,
    ]);

    const indices = new Uint16Array([
      0, 1, 2, 0, 2, 3,
      4, 5, 6, 4, 6, 7,
      8, 9, 10, 8, 10, 11,
      12, 13, 14, 12, 14, 15,
      16, 17, 18, 16, 18, 19,
      20, 21, 22, 20, 22, 23,
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
    const program = shadowProgramInfo ? shadowProgramInfo.program : this.program;
    const locs = shadowProgramInfo ? shadowProgramInfo.locs : this.locs;

    if (!program) return;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vbuf);
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
      if (locs.worldMatrix) gl.uniformMatrix4fv(locs.worldMatrix, false, this.worldMatrix);
      if (locs.worldInverseTranspose) {
        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, this.worldMatrix);
        mat4.transpose(normalMatrix, normalMatrix);
        gl.uniformMatrix4fv(locs.worldInverseTranspose, false, normalMatrix);
      }
      if (locs.shininess) gl.uniform1f(locs.shininess, this.shininess !== undefined ? this.shininess : 1.0);
      if (locs.specularStrength) gl.uniform1f(locs.specularStrength, this.specularStrength !== undefined ? this.specularStrength : 0.0);
      if (locs.emissive) gl.uniform1f(locs.emissive, this.emissive !== undefined ? this.emissive : 0.0);
      if (locs.twoSided) gl.uniform1f(locs.twoSided, this.twoSided !== undefined ? this.twoSided : 0.0);
      if (locs.color) gl.uniform4fv(locs.color, this.color);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.ibuf);
    gl.drawElements(gl.TRIANGLES, this.mesh.count, gl.UNSIGNED_SHORT, 0);
  }
}

function createSphereGeometry(gl, radius, latitudeBands, longitudeBands) {
  const vertexData = [];
  const indexData = [];

  for (let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
    const theta = latNumber * Math.PI / latitudeBands;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
      const phi = longNumber * 2 * Math.PI / longitudeBands;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;
      const u = 1 - (longNumber / longitudeBands);
      const v = 1 - (latNumber / latitudeBands);

      vertexData.push(x * radius, y * radius, z * radius, 1.0, u, v, x, y, z);
    }
  }

  for (let latNumber = 0; latNumber < latitudeBands; latNumber++) {
    for (let longNumber = 0; longNumber < longitudeBands; longNumber++) {
      const first = (latNumber * (longitudeBands + 1)) + longNumber;
      const second = first + longitudeBands + 1;
      indexData.push(first, second, first + 1);
      indexData.push(second, second + 1, first + 1);
    }
  }

  const vbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

  const ibuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);

  return { vbuf, ibuf, count: indexData.length };
}

class Sphere extends Node {
  constructor(gl, program, locs, radius, latBands = 16, longBands = 16, color = [0.4, 0.25, 0.15, 1.0]) {
    super();
    this.program = program;
    this.locs = locs;
    this.color = color;
    this.mesh = createSphereGeometry(gl, radius, latBands, longBands);
    this.shininess = 1.0;
    this.specularStrength = 0.0;
    this.emissive = 0.0;
    this.twoSided = 0.0;
  }

  draw(gl, viewProjection, texture, shadowProgramInfo) {
    if (texture && typeof texture === 'object' && texture.program && texture.locs) {
      shadowProgramInfo = texture;
      texture = null;
    }
    const program = shadowProgramInfo ? shadowProgramInfo.program : this.program;
    const locs = shadowProgramInfo ? shadowProgramInfo.locs : this.locs;
    if (!program) return;
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vbuf);
    gl.vertexAttribPointer(locs.pos, 4, gl.FLOAT, false, 36, 0);
    gl.enableVertexAttribArray(locs.pos);

    if (!shadowProgramInfo) {
      if (locs.uv !== undefined && locs.uv !== -1) {
        gl.vertexAttribPointer(locs.uv, 2, gl.FLOAT, false, 36, 16);
        gl.enableVertexAttribArray(locs.uv);
      }
      if (locs.normal !== undefined && locs.normal !== -1) {
        gl.vertexAttribPointer(locs.normal, 3, gl.FLOAT, false, 36, 24);
        gl.enableVertexAttribArray(locs.normal);
      }
    }

    const mvp = mat4.multiply(mat4.create(), viewProjection, this.worldMatrix);
    gl.uniformMatrix4fv(locs.matrix, false, mvp);

    if (!shadowProgramInfo) {
      if (locs.worldMatrix) gl.uniformMatrix4fv(locs.worldMatrix, false, this.worldMatrix);
      if (locs.worldInverseTranspose) {
        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, this.worldMatrix);
        mat4.transpose(normalMatrix, normalMatrix);
        gl.uniformMatrix4fv(locs.worldInverseTranspose, false, normalMatrix);
      }
      if (locs.shininess) gl.uniform1f(locs.shininess, this.shininess !== undefined ? this.shininess : 1.0);
      if (locs.specularStrength) gl.uniform1f(locs.specularStrength, this.specularStrength !== undefined ? this.specularStrength : 0.0);
      if (locs.emissive) gl.uniform1f(locs.emissive, this.emissive !== undefined ? this.emissive : 0.0);
      if (locs.twoSided) gl.uniform1f(locs.twoSided, this.twoSided !== undefined ? this.twoSided : 0.0);
      if (locs.tex && texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(locs.tex, 0);
        if (locs.uvScale) gl.uniform2fv(locs.uvScale, [1.0, 1.0]);
        if (locs.uvOffset) gl.uniform2fv(locs.uvOffset, [0.0, 0.0]);
      }
      if (locs.color) gl.uniform4fv(locs.color, this.color);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.ibuf);
    gl.drawElements(gl.TRIANGLES, this.mesh.count, gl.UNSIGNED_SHORT, 0);
  }
}

function createCylinderGeometry(gl, radiusTop, radiusBottom, height, radialSegments) {
  const vertexData = [];
  const indexData = [];
  const drdy = (radiusTop - radiusBottom) / height;

  for (let i = 0; i <= radialSegments; i++) {
    const angle = (i / radialSegments) * 2 * Math.PI;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const u = i / radialSegments;
    const len = Math.sqrt(cos * cos + drdy * drdy + sin * sin);
    const nx = cos / len;
    const ny = -drdy / len;
    const nz = sin / len;

    vertexData.push(cos * radiusTop, height / 2, sin * radiusTop, 1.0, u, 1.0, nx, ny, nz);
    vertexData.push(cos * radiusBottom, -height / 2, sin * radiusBottom, 1.0, u, 0.0, nx, ny, nz);
  }

  for (let i = 0; i < radialSegments; i++) {
    const idxTopCurrent = i * 2;
    const idxBotCurrent = i * 2 + 1;
    const idxTopNext = (i + 1) * 2;
    const idxBotNext = (i + 1) * 2 + 1;
    indexData.push(idxTopCurrent, idxBotCurrent, idxBotNext);
    indexData.push(idxTopCurrent, idxBotNext, idxTopNext);
  }

  const capStartIdx = vertexData.length / 9;
  vertexData.push(0, height / 2, 0, 1.0, 0.5, 0.5, 0, 1, 0);
  for (let i = 0; i <= radialSegments; i++) {
    const angle = (i / radialSegments) * 2 * Math.PI;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    vertexData.push(cos * radiusTop, height / 2, sin * radiusTop, 1.0, (cos + 1) / 2, (sin + 1) / 2, 0, 1, 0);
  }
  for (let i = 0; i < radialSegments; i++) {
    indexData.push(capStartIdx, capStartIdx + 1 + i, capStartIdx + 2 + i);
  }

  const botCapStartIdx = vertexData.length / 9;
  vertexData.push(0, -height / 2, 0, 1.0, 0.5, 0.5, 0, -1, 0);
  for (let i = 0; i <= radialSegments; i++) {
    const angle = (i / radialSegments) * 2 * Math.PI;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    vertexData.push(cos * radiusBottom, -height / 2, sin * radiusBottom, 1.0, (cos + 1) / 2, (sin + 1) / 2, 0, -1, 0);
  }
  for (let i = 0; i < radialSegments; i++) {
    indexData.push(botCapStartIdx, botCapStartIdx + 2 + i, botCapStartIdx + 1 + i);
  }

  const vbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

  const ibuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);

  return { vbuf, ibuf, count: indexData.length };
}

class Cylinder extends Node {
  constructor(gl, program, locs, radiusTop, radiusBottom, height, radialSegments = 16, color = [0.8, 0.7, 0.5, 1.0]) {
    super();
    this.program = program;
    this.locs = locs;
    this.color = color;
    this.mesh = createCylinderGeometry(gl, radiusTop, radiusBottom, height, radialSegments);
    this.shininess = 1.0;
    this.specularStrength = 0.0;
    this.emissive = 0.0;
    this.twoSided = 0.0;
  }

  draw(gl, viewProjection, texture, shadowProgramInfo) {
    if (texture && typeof texture === 'object' && texture.program && texture.locs) {
      shadowProgramInfo = texture;
      texture = null;
    }
    const program = shadowProgramInfo ? shadowProgramInfo.program : this.program;
    const locs = shadowProgramInfo ? shadowProgramInfo.locs : this.locs;
    if (!program) return;
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vbuf);
    gl.vertexAttribPointer(locs.pos, 4, gl.FLOAT, false, 36, 0);
    gl.enableVertexAttribArray(locs.pos);

    if (!shadowProgramInfo) {
      if (locs.uv !== undefined && locs.uv !== -1) {
        gl.vertexAttribPointer(locs.uv, 2, gl.FLOAT, false, 36, 16);
        gl.enableVertexAttribArray(locs.uv);
      }
      if (locs.normal !== undefined && locs.normal !== -1) {
        gl.vertexAttribPointer(locs.normal, 3, gl.FLOAT, false, 36, 24);
        gl.enableVertexAttribArray(locs.normal);
      }
    }

    const mvp = mat4.multiply(mat4.create(), viewProjection, this.worldMatrix);
    gl.uniformMatrix4fv(locs.matrix, false, mvp);

    if (!shadowProgramInfo) {
      if (locs.worldMatrix) gl.uniformMatrix4fv(locs.worldMatrix, false, this.worldMatrix);
      if (locs.worldInverseTranspose) {
        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, this.worldMatrix);
        mat4.transpose(normalMatrix, normalMatrix);
        gl.uniformMatrix4fv(locs.worldInverseTranspose, false, normalMatrix);
      }
      if (locs.shininess) gl.uniform1f(locs.shininess, this.shininess !== undefined ? this.shininess : 1.0);
      if (locs.specularStrength) gl.uniform1f(locs.specularStrength, this.specularStrength !== undefined ? this.specularStrength : 0.0);
      if (locs.emissive) gl.uniform1f(locs.emissive, this.emissive !== undefined ? this.emissive : 0.0);
      if (locs.twoSided) gl.uniform1f(locs.twoSided, this.twoSided !== undefined ? this.twoSided : 0.0);
      if (locs.tex && texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(locs.tex, 0);
        if (locs.uvScale) gl.uniform2fv(locs.uvScale, this.uvScale || [1.0, 1.0]);
        if (locs.uvOffset) gl.uniform2fv(locs.uvOffset, this.uvOffset || [0.0, 0.0]);
      }
      if (locs.color) gl.uniform4fv(locs.color, this.color);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.ibuf);
    gl.drawElements(gl.TRIANGLES, this.mesh.count, gl.UNSIGNED_SHORT, 0);
  }
}

function createHollowCylinderGeometry(gl, radiusTop, radiusBottom, height, radialSegments) {
  const vertexData = [];
  const indexData = [];
  const drdy = (radiusTop - radiusBottom) / height;

  for (let i = 0; i <= radialSegments; i++) {
    const angle = (i / radialSegments) * 2 * Math.PI;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const u = i / radialSegments;
    const len = Math.sqrt(cos * cos + drdy * drdy + sin * sin);
    const nx = cos / len;
    const ny = -drdy / len;
    const nz = sin / len;

    vertexData.push(cos * radiusTop, height / 2, sin * radiusTop, 1.0, u, 1.0, nx, ny, nz);
    vertexData.push(cos * radiusBottom, -height / 2, sin * radiusBottom, 1.0, u, 0.0, nx, ny, nz);
  }

  for (let i = 0; i < radialSegments; i++) {
    const idxTopCurrent = i * 2;
    const idxBotCurrent = i * 2 + 1;
    const idxTopNext = (i + 1) * 2;
    const idxBotNext = (i + 1) * 2 + 1;

    indexData.push(idxTopCurrent, idxBotCurrent, idxBotNext);
    indexData.push(idxTopCurrent, idxBotNext, idxTopNext);
    indexData.push(idxTopCurrent, idxBotNext, idxBotCurrent);
    indexData.push(idxTopCurrent, idxTopNext, idxBotNext);
  }

  const vbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

  const ibuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);

  return { vbuf, ibuf, count: indexData.length };
}

class HollowCylinder extends Node {
  constructor(gl, program, locs, radiusTop, radiusBottom, height, radialSegments = 16, color = [0.8, 0.7, 0.5, 1.0]) {
    super();
    this.program = program;
    this.locs = locs;
    this.color = color;
    this.mesh = createHollowCylinderGeometry(gl, radiusTop, radiusBottom, height, radialSegments);
    this.shininess = 1.0;
    this.specularStrength = 0.0;
    this.emissive = 0.0;
    this.twoSided = 0.0;
  }

  draw(gl, viewProjection, texture, shadowProgramInfo) {
    if (texture && typeof texture === 'object' && texture.program && texture.locs) {
      shadowProgramInfo = texture;
      texture = null;
    }
    const program = shadowProgramInfo ? shadowProgramInfo.program : this.program;
    const locs = shadowProgramInfo ? shadowProgramInfo.locs : this.locs;
    if (!program) return;
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vbuf);
    gl.vertexAttribPointer(locs.pos, 4, gl.FLOAT, false, 36, 0);
    gl.enableVertexAttribArray(locs.pos);

    if (!shadowProgramInfo) {
      if (locs.uv !== undefined && locs.uv !== -1) {
        gl.vertexAttribPointer(locs.uv, 2, gl.FLOAT, false, 36, 16);
        gl.enableVertexAttribArray(locs.uv);
      }
      if (locs.normal !== undefined && locs.normal !== -1) {
        gl.vertexAttribPointer(locs.normal, 3, gl.FLOAT, false, 36, 24);
        gl.enableVertexAttribArray(locs.normal);
      }
    }

    const mvp = mat4.multiply(mat4.create(), viewProjection, this.worldMatrix);
    gl.uniformMatrix4fv(locs.matrix, false, mvp);

    if (!shadowProgramInfo) {
      if (locs.worldMatrix) gl.uniformMatrix4fv(locs.worldMatrix, false, this.worldMatrix);
      if (locs.worldInverseTranspose) {
        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, this.worldMatrix);
        mat4.transpose(normalMatrix, normalMatrix);
        gl.uniformMatrix4fv(locs.worldInverseTranspose, false, normalMatrix);
      }
      if (locs.shininess) gl.uniform1f(locs.shininess, this.shininess !== undefined ? this.shininess : 1.0);
      if (locs.specularStrength) gl.uniform1f(locs.specularStrength, this.specularStrength !== undefined ? this.specularStrength : 0.0);
      if (locs.emissive) gl.uniform1f(locs.emissive, this.emissive !== undefined ? this.emissive : 0.0);
      if (locs.twoSided) gl.uniform1f(locs.twoSided, this.twoSided !== undefined ? this.twoSided : 0.0);
      if (locs.tex && texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(locs.tex, 0);
        if (locs.uvScale) gl.uniform2fv(locs.uvScale, this.uvScale || [1.0, 1.0]);
        if (locs.uvOffset) gl.uniform2fv(locs.uvOffset, this.uvOffset || [0.0, 0.0]);
      }
      if (locs.color) gl.uniform4fv(locs.color, this.color);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.ibuf);
    gl.drawElements(gl.TRIANGLES, this.mesh.count, gl.UNSIGNED_SHORT, 0);
  }
}

function computeAABBBounds(position, rotation, halfWidth, halfDepth, height, houseElevation) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const corners = [
    [-halfWidth, 0, -halfDepth],
    [halfWidth, 0, -halfDepth],
    [-halfWidth, 0, halfDepth],
    [halfWidth, 0, halfDepth],
    [-halfWidth, height, -halfDepth],
    [halfWidth, height, -halfDepth],
    [-halfWidth, height, halfDepth],
    [halfWidth, height, halfDepth]
  ];
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (const c of corners) {
    const rx = c[0] * cos + c[2] * sin;
    const rz = -c[0] * sin + c[2] * cos;
    const wx = rx + position[0];
    const wy = c[1] + position[1] + houseElevation;
    const wz = rz + position[2];
    if (wx < minX) minX = wx;
    if (wx > maxX) maxX = wx;
    if (wy < minY) minY = wy;
    if (wy > maxY) maxY = wy;
    if (wz < minZ) minZ = wz;
    if (wz > maxZ) maxZ = wz;
  }
  return { minX, maxX, minY, maxY, minZ, maxZ };
}

