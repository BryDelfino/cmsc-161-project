class Column extends MeshNode {
  constructor(gl, program, locs) {
    super({ program, locs });
    this.program = program;
    this.locs = locs;
    this.emissive = 0.0;
    this.twoSided = 0.0;

    // We swap/rotate the UV coordinates on the vertical faces (Front, Back, Right, Left)
    // to rotate the wood siding texture by exactly 90 degrees on all column sides!
    const vertices = new Float32Array([
      // Front face
      -0.5, -0.5, 0.5, 1, 0, 0,  0, 0, 1,
      0.5, -0.5, 0.5, 1, 0, 1,  0, 0, 1,
      0.5, 0.5, 0.5, 1, 1, 1,  0, 0, 1,
      -0.5, 0.5, 0.5, 1, 1, 0,  0, 0, 1,

      // Back face
      -0.5, -0.5, -0.5, 1, 0, 0,  0, 0, -1,
      -0.5, 0.5, -0.5, 1, 1, 0,  0, 0, -1,
      0.5, 0.5, -0.5, 1, 1, 1,  0, 0, -1,
      0.5, -0.5, -0.5, 1, 0, 1,  0, 0, -1,

      // Top face
      -0.5, 0.5, -0.5, 1, 0, 0,  0, 1, 0,
      -0.5, 0.5, 0.5, 1, 0, 1,  0, 1, 0,
      0.5, 0.5, 0.5, 1, 1, 1,  0, 1, 0,
      0.5, 0.5, -0.5, 1, 1, 0,  0, 1, 0,

      // Bottom face
      -0.5, -0.5, -0.5, 1, 0, 0,  0, -1, 0,
      0.5, -0.5, -0.5, 1, 1, 0,  0, -1, 0,
      0.5, -0.5, 0.5, 1, 1, 1,  0, -1, 0,
      -0.5, -0.5, 0.5, 1, 0, 1,  0, -1, 0,

      // Right face
      0.5, -0.5, -0.5, 1, 0, 0,  1, 0, 0,
      0.5, 0.5, -0.5, 1, 1, 0,  1, 0, 0,
      0.5, 0.5, 0.5, 1, 1, 1,  1, 0, 0,
      0.5, -0.5, 0.5, 1, 0, 1,  1, 0, 0,

      // Left face
      -0.5, -0.5, -0.5, 1, 0, 0, -1, 0, 0,
      -0.5, -0.5, 0.5, 1, 0, 1, -1, 0, 0,
      -0.5, 0.5, 0.5, 1, 1, 1, -1, 0, 0,
      -0.5, 0.5, -0.5, 1, 1, 0, -1, 0, 0,
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
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.ibuf);
    gl.drawElements(gl.TRIANGLES, this.mesh.count, gl.UNSIGNED_SHORT, 0);
  }
}

class Porch extends Node {
  constructor(gl, solidRes, texRes, outsideTexture) {
    super();
    this.gl = gl;
    this.solidRes = solidRes;
    this.texRes = texRes;
    this.outsideTexture = outsideTexture;

    this.deckWidth = 20.2;
    this.deckDepth = 4.0;
    this.deckThickness = 0.2;

    // Deck Platform
    this.deck = new Cube(gl, texRes.program, texRes.locs);
    this.deck.setParent(this);
    this.deck.shininess = 20.0;
    this.deck.specularStrength = 0.3;

    this.deck.localMatrix = mat4.create();
    mat4.translate(this.deck.localMatrix, this.deck.localMatrix, [0, -2.0 - this.deckThickness / 2, 13.0 + this.deckDepth / 2]);
    mat4.rotateY(this.deck.localMatrix, this.deck.localMatrix, Math.PI / 2);
    mat4.scale(this.deck.localMatrix, this.deck.localMatrix, [this.deckDepth, this.deckThickness, this.deckWidth]);
    this.deck.uvScale = [this.deckDepth / 4.0, this.deckWidth / 4.0];

    // Foundation Base
    const baseHeight = 1.3;
    this.foundation = new Cube(gl, texRes.program, texRes.locs);
    this.foundation.setParent(this);
    this.foundation.shininess = 20.0;
    this.foundation.specularStrength = 0.3;
    this.foundation.translate([0, -2.0 - this.deckThickness - baseHeight / 2, 13.0 + 3.6 / 2]);
    this.foundation.scale([this.deckWidth - 0.8, baseHeight, this.deckDepth - 0.4]);
    this.foundation.uvScale = [(this.deckWidth - 0.8) / 4.0, baseHeight / 4.0];

    this.pillars = [];
    this.steps = [];

    // Roof Canopy
    this.roofDepth = 5.5;
    const startY = 5.1;
    const endY = 2.6;
    const heightDrop = endY - startY;
    const slopeAngle = -Math.atan2(heightDrop, this.roofDepth);
    const roofLength = Math.sqrt(this.roofDepth * this.roofDepth + heightDrop * heightDrop);

    this.roof = new Cube(gl, texRes.program, texRes.locs);
    this.roof.setParent(this);
    this.roof.shininess = 20.0;
    this.roof.specularStrength = 0.3;

    const midY = (startY + endY) / 2;
    const midZ = 12.75 + this.roofDepth / 2;

    this.roof.localMatrix = mat4.create();
    mat4.translate(this.roof.localMatrix, this.roof.localMatrix, [0, midY, midZ]);
    mat4.rotateX(this.roof.localMatrix, this.roof.localMatrix, slopeAngle);
    mat4.rotateY(this.roof.localMatrix, this.roof.localMatrix, Math.PI / 2);
    mat4.scale(this.roof.localMatrix, this.roof.localMatrix, [roofLength, 0.15, this.deckWidth]);
    this.roof.uvScale = [roofLength / 4.0, this.deckWidth / 4.0];

    // Pillars
    const pillarHeight = 5.50;
    const pillarThickness = 0.40;
    const pillarPositions = [
      [-8.0, 16.0],
      [8.0, 16.0],
    ];

    pillarPositions.forEach(pos => {
      const col = new Column(gl, texRes.program, texRes.locs);
      col.setParent(this);
      col.shininess = 20.0;
      col.specularStrength = 0.3;
      col.translate([pos[0], -2.0 + pillarHeight / 2, pos[1]]);
      col.scale([pillarThickness, pillarHeight, pillarThickness]);
      col.uvScale = [pillarHeight / 4.0, pillarThickness / 2.0];
      this.pillars.push(col);
    });

    // Steps
    this.steps = new Stairs(gl, texRes, 5.0, 1.5, 3, 0.5, 0.4);
    this.steps.setParent(this);
    this.steps.translate([0, 0, 17.0]);
  }

  draw(gl, viewProjection, shadowProgramInfo) {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);

    // Render all porch parts using the designated outside texture!
    this.deck.draw(gl, viewProjection, this.outsideTexture, shadowProgramInfo);
    this.foundation.draw(gl, viewProjection, this.outsideTexture, shadowProgramInfo); // Draw solid underpinning base!
    this.pillars.forEach(col => col.draw(gl, viewProjection, this.outsideTexture, shadowProgramInfo));
    this.roof.draw(gl, viewProjection, this.outsideTexture, shadowProgramInfo);
    this.steps.draw(gl, viewProjection, this.outsideTexture, shadowProgramInfo);
  }
}
