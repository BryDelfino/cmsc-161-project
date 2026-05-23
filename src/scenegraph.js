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
