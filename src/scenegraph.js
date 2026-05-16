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
  }

  draw(gl, projectionViewMatrix) {
    const { program, locs, buffer, count, color } = this.meshInfo;
    gl.useProgram(program);

    gl.enableVertexAttribArray(locs.pos);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(locs.pos, 4, gl.FLOAT, false, 0, 0);

    const mvpMatrix = mat4.multiply(mat4.create(), projectionViewMatrix, this.worldMatrix);
    gl.uniformMatrix4fv(locs.matrix, false, mvpMatrix);
    gl.uniform4fv(locs.color, color);

    gl.drawArrays(gl.TRIANGLES, 0, count);
  }
}

// For mesh with texture.
class TexturedMeshNode extends Node {
  constructor(meshInfo) {
    super();
    this.meshInfo = meshInfo; // { program, locs, posBuffer, uvBuffer, texture, count }
  }

  draw(gl, projectionViewMatrix) {
    const { program, locs, posBuffer, uvBuffer, texture, count } = this.meshInfo;
    gl.useProgram(program);

    // Positions
    gl.enableVertexAttribArray(locs.pos);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.vertexAttribPointer(locs.pos, 4, gl.FLOAT, false, 0, 0);

    // UVs
    gl.enableVertexAttribArray(locs.uv);
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.vertexAttribPointer(locs.uv, 2, gl.FLOAT, false, 0, 0);

    // Texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(locs.tex, 0);

    const mvpMatrix = mat4.multiply(mat4.create(), projectionViewMatrix, this.worldMatrix);
    gl.uniformMatrix4fv(locs.matrix, false, mvpMatrix);

    gl.drawArrays(gl.TRIANGLES, 0, count);
  }
}
