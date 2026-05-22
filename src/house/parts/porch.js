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
      -0.5, -0.5, 0.5, 1, 0, 0,
      0.5, -0.5, 0.5, 1, 0, 1,
      0.5, 0.5, 0.5, 1, 1, 1,
      -0.5, 0.5, 0.5, 1, 1, 0,

      // Back face
      -0.5, -0.5, -0.5, 1, 0, 0,
      -0.5, 0.5, -0.5, 1, 1, 0,
      0.5, 0.5, -0.5, 1, 1, 1,
      0.5, -0.5, -0.5, 1, 0, 1,

      // Top face
      -0.5, 0.5, -0.5, 1, 0, 0,
      -0.5, 0.5, 0.5, 1, 0, 1,
      0.5, 0.5, 0.5, 1, 1, 1,
      0.5, 0.5, -0.5, 1, 1, 0,

      // Bottom face
      -0.5, -0.5, -0.5, 1, 0, 0,
      0.5, -0.5, -0.5, 1, 1, 0,
      0.5, -0.5, 0.5, 1, 1, 1,
      -0.5, -0.5, 0.5, 1, 0, 1,

      // Right face
      0.5, -0.5, -0.5, 1, 0, 0,
      0.5, 0.5, -0.5, 1, 1, 0,
      0.5, 0.5, 0.5, 1, 1, 1,
      0.5, -0.5, 0.5, 1, 0, 1,

      // Left face
      -0.5, -0.5, -0.5, 1, 0, 0,
      -0.5, -0.5, 0.5, 1, 0, 1,
      -0.5, 0.5, 0.5, 1, 1, 1,
      -0.5, 0.5, -0.5, 1, 1, 0,
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
    gl.vertexAttribPointer(this.locs.pos, 4, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(this.locs.pos);

    if (this.locs.uv !== undefined && this.locs.uv !== -1) {
      gl.vertexAttribPointer(this.locs.uv, 2, gl.FLOAT, false, 24, 16);
      gl.enableVertexAttribArray(this.locs.uv);
    }

    const mvp = mat4.multiply(mat4.create(), viewProjection, this.worldMatrix);
    gl.uniformMatrix4fv(this.locs.matrix, false, mvp);

    if (this.locs.worldMatrix) {
      gl.uniformMatrix4fv(this.locs.worldMatrix, false, this.worldMatrix);
    }
    if (this.locs.shininess) {
      gl.uniform1f(this.locs.shininess, this.shininess !== undefined ? this.shininess : 1.0);
    }
    if (this.locs.specularStrength) {
      gl.uniform1f(this.locs.specularStrength, this.specularStrength !== undefined ? this.specularStrength : 0.0);
    }
    if (this.locs.emissive) {
      gl.uniform1f(this.locs.emissive, this.emissive !== undefined ? this.emissive : 0.0);
    }
    if (this.locs.twoSided) {
      gl.uniform1f(this.locs.twoSided, this.twoSided !== undefined ? this.twoSided : 0.0);
    }

    if (this.locs.tex && texture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(this.locs.tex, 0);

      if (this.locs.uvScale) {
        gl.uniform2fv(this.locs.uvScale, this.uvScale || [1.0, 1.0]);
      }
      if (this.locs.uvOffset) {
        gl.uniform2fv(this.locs.uvOffset, this.uvOffset || [0.0, 0.0]);
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
    this.outsideTexture = outsideTexture; // Now using the house outside face texture!

    // --- 1. PORCH DECK PLATFORM (Wood Plank Textured - 90 deg flipped) ---
    // The deck sits at Y = -2.0 (local house floor height), centered at X = 0, Z = 13.0
    // Width is exactly 26.0 units to extend to the very edge of the front walls!
    this.deckWidth = 20.2;
    this.deckDepth = 4.0;
    this.deckThickness = 0.2;

    this.deck = new Wall(gl, texRes.program, texRes.locs);
    this.deck.setParent(this);
    this.deck.shininess = 20.0;
    this.deck.specularStrength = 0.3;

    // We rotate the deck 90 degrees around the Y-axis to spin the wood texture,
    // and swap the X and Z scales so it retains its correct global 26x4 shape!
    this.deck.localMatrix = mat4.create();
    mat4.translate(this.deck.localMatrix, this.deck.localMatrix, [0, -2.0 - this.deckThickness / 2, 13.0 + this.deckDepth / 2]);
    mat4.rotateY(this.deck.localMatrix, this.deck.localMatrix, Math.PI / 2);
    mat4.scale(this.deck.localMatrix, this.deck.localMatrix, [this.deckDepth, this.deckThickness, this.deckWidth]);
    this.deck.uvScale = [this.deckDepth / 4.0, this.deckWidth / 4.0]; // Flipped & Stretched 2x larger!

    // --- 1b. PORCH FOUNDATION BASE (Anchors Deck to the Ground - Recessed Inward) ---
    // Recessed inward by 0.4 units on the left, right, and front edges to create an elegant,
    // high-end architectural shadow line reveal underneath the deck platform!
    const baseHeight = 1.3;
    this.foundation = new Wall(gl, texRes.program, texRes.locs);
    this.foundation.setParent(this);
    this.foundation.shininess = 20.0;
    this.foundation.specularStrength = 0.3;
    // Flush with house wall at Z = 13.0, extending 3.6 units out to Z = 16.6 (leaves 0.4 front overhang)
    this.foundation.translate([0, -2.0 - this.deckThickness - baseHeight / 2, 13.0 + 3.6 / 2]);
    this.foundation.scale([this.deckWidth - 0.8, baseHeight, this.deckDepth - 0.4]);
    this.foundation.uvScale = [(this.deckWidth - 0.8) / 4.0, baseHeight / 4.0];

    this.pillars = [];
    this.steps = [];

    // --- 2. PORCH ROOF CANOPY (Inclined/Sloped and 90 deg flipped) ---
    // The roof starts at Y = 5.1 at the house wall (Z = 13.0) and declines steeply to Y = 2.6 at the front edge (Z = 18.5)
    // Height drop of -2.5 over a longer depth of 5.5 units along the Z-axis!
    this.roofDepth = 5.5;
    const startY = 5.1;
    const endY = 2.6;
    const heightDrop = endY - startY; // -2.5
    // Positive angle rotates the front edge of the roof DOWNWARDS facing the ground
    const slopeAngle = -Math.atan2(heightDrop, this.roofDepth);
    const roofLength = Math.sqrt(this.roofDepth * this.roofDepth + heightDrop * heightDrop);

    this.roof = new Wall(gl, texRes.program, texRes.locs);
    this.roof.setParent(this);
    this.roof.shininess = 20.0;
    this.roof.specularStrength = 0.3;

    // Position it centered along the diagonal slope, sliding 0.25 units into the wall to close the gap completely.
    // We rotate it 90 degrees around Y to spin the texture 90 degrees, and swap X and Z scales!
    const midY = (startY + endY) / 2; // Y = 3.85
    const midZ = 12.75 + this.roofDepth / 2; // Z = 15.5

    this.roof.localMatrix = mat4.create();
    mat4.translate(this.roof.localMatrix, this.roof.localMatrix, [0, midY, midZ]);
    mat4.rotateX(this.roof.localMatrix, this.roof.localMatrix, slopeAngle);
    mat4.rotateY(this.roof.localMatrix, this.roof.localMatrix, Math.PI / 2);
    mat4.scale(this.roof.localMatrix, this.roof.localMatrix, [roofLength, 0.15, this.deckWidth]);
    this.roof.uvScale = [roofLength / 4.0, this.deckWidth / 4.0]; // Flipped & Stretched 2x larger!

    // --- 3. TWO VERTICAL PILLARS (Rotated Wood Grain Column Mesh) ---
    // Shifted inward from the extreme outer edges to create a beautifully cantilevered porch.
    const pillarHeight = 5.50;
    const pillarThickness = 0.40;
    const pillarPositions = [
      [-8.0, 16.0], // Inset Front-Left Column
      [8.0, 16.0],  // Inset Front-Right Column
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

    // --- 4. BUILD THE STEPS (Solid and gap-free side profile) ---
    this.steps = new Stairs(gl, texRes, 5.0, 1.5, 3, 0.5, 0.4);
    this.steps.setParent(this);
    this.steps.translate([0, 0, 17.0]);
  }

  draw(gl, viewProjection) {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);

    // Render all porch parts using the designated outside texture!
    this.deck.draw(gl, viewProjection, this.outsideTexture);
    this.foundation.draw(gl, viewProjection, this.outsideTexture); // Draw solid underpinning base!
    this.pillars.forEach(col => col.draw(gl, viewProjection, this.outsideTexture));
    this.roof.draw(gl, viewProjection, this.outsideTexture);
    this.steps.draw(gl, viewProjection, this.outsideTexture);
  }
}
