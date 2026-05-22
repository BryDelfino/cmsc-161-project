function createHollowCylinderGeometry(gl, radiusTop, radiusBottom, height, radialSegments) {
  const vertexData = [];
  const indexData = [];

  // Generate side vertices
  for (let i = 0; i <= radialSegments; i++) {
    const angle = (i / radialSegments) * 2 * Math.PI;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const u = i / radialSegments;

    // Top vertex
    const xTop = cos * radiusTop;
    const zTop = sin * radiusTop;
    const yTop = height / 2;
    vertexData.push(xTop, yTop, zTop, 1.0, u, 1.0);

    // Bottom vertex
    const xBot = cos * radiusBottom;
    const zBot = sin * radiusBottom;
    const yBot = -height / 2;
    vertexData.push(xBot, yBot, zBot, 1.0, u, 0.0);
  }

  // Generate side indices (both winding directions to be double-sided)
  for (let i = 0; i < radialSegments; i++) {
    const next = i + 1;
    const idxTopCurrent = i * 2;
    const idxBotCurrent = i * 2 + 1;
    const idxTopNext = next * 2;
    const idxBotNext = next * 2 + 1;

    // Triangle 1: TopCurrent -> BotCurrent -> BotNext (outer)
    indexData.push(idxTopCurrent, idxBotCurrent, idxBotNext);
    // Triangle 2: TopCurrent -> BotNext -> TopNext (outer)
    indexData.push(idxTopCurrent, idxBotNext, idxTopNext);

    // Triangle 3: TopCurrent -> BotNext -> BotCurrent (inner)
    indexData.push(idxTopCurrent, idxBotNext, idxBotCurrent);
    // Triangle 4: TopCurrent -> TopNext -> BotNext (inner)
    indexData.push(idxTopCurrent, idxTopNext, idxBotNext);
  }

  const vbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

  const ibuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);

  return {
    vbuf: vbuf,
    ibuf: ibuf,
    count: indexData.length
  };
}

class HollowCylinder extends Node {
  constructor(gl, program, locs, radiusTop, radiusBottom, height, radialSegments = 16, color = [0.8, 0.7, 0.5, 1.0]) {
    super();
    this.program = program;
    this.locs = locs;
    this.color = color;
    this.mesh = createHollowCylinderGeometry(gl, radiusTop, radiusBottom, height, radialSegments);
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

    if (this.locs.tex && texture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(this.locs.tex, 0);

      if (this.locs.uvScale) {
        const uvs = this.uvScale || [1.0, 1.0];
        gl.uniform2fv(this.locs.uvScale, uvs);
      }
      if (this.locs.uvOffset) {
        const uvo = this.uvOffset || [0.0, 0.0];
        gl.uniform2fv(this.locs.uvOffset, uvo);
      }
    }

    if (this.locs.color) {
      gl.uniform4fv(this.locs.color, this.color);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.ibuf);
    gl.drawElements(gl.TRIANGLES, this.mesh.count, gl.UNSIGNED_SHORT, 0);
  }
}

class Lamp extends Node {
  constructor(gl, solidRes) {
    super();
    this.parts = [];

    // Colors
    const brassColor = [0.75, 0.65, 0.25, 1.0];
    const shadeColor = [0.96, 0.95, 0.88, 1.0];
    const bulbColor = [1.0, 0.95, 0.6, 1.0];

    // Base: flat cylinder, Y = 0 to 0.04, center at 0.02
    const base = new Cylinder(gl, solidRes.program, solidRes.locs, 0.2, 0.2, 0.04, 16, brassColor);
    base.setParent(this);
    base.translate([0, 0.02, 0]);
    this.parts.push(base);

    // Lower half of the stand: straight brass rod, Y = 0.04 to 0.84, height = 0.8, center at 0.44
    const lowerPole = new Cylinder(gl, solidRes.program, solidRes.locs, 0.02, 0.02, 0.8, 12, brassColor);
    lowerPole.setParent(this);
    lowerPole.translate([0, 0.44, 0]);
    this.parts.push(lowerPole);

    // Joint: brass sphere connecting the two halves of the stand
    const joint = new Sphere(gl, solidRes.program, solidRes.locs, 0.035, 12, 12, brassColor);
    joint.setParent(this);
    joint.translate([0, 0.84, 0]);
    this.parts.push(joint);

    // Upper half of the stand (angled)
    const upperArm = new Node();
    upperArm.setParent(this);
    upperArm.translate([0, 0.84, 0]);
    upperArm.rotate(0.6, [1, 0, 0]); // Angled forward

    // Upper pole cylinder, local height = 0.8, center Y = 0.4
    const upperPole = new Cylinder(gl, solidRes.program, solidRes.locs, 0.018, 0.018, 0.8, 12, brassColor);
    upperPole.setParent(upperArm);
    upperPole.translate([0, 0.4, 0]);
    this.parts.push(upperPole);

    // Shade: Hollow cylinder flaring outwards at the bottom opening
    // Top of the shade (narrow, radius = 0.18) meets the top of the upper pole (Y = 0.8).
    // Bottom of the shade (wide, radius = 0.28) is the opening.
    const shade = new HollowCylinder(gl, solidRes.program, solidRes.locs, 0.18, 0.28, 0.4, 16, shadeColor);
    shade.setParent(upperArm);
    shade.translate([0, 1.0, 0]);
    shade.rotate(-0.4, [1, 0, 0]); // Counter-rotated to hang more naturally pointing down
    this.parts.push(shade);
    this.shade = shade;

    // Dual light bulbs: side-by-side inside the hollow shade
    const bulb1 = new Sphere(gl, solidRes.program, solidRes.locs, 0.045, 12, 12, bulbColor);
    bulb1.setParent(shade);
    bulb1.translate([-0.07, -0.1, 0]);
    this.parts.push(bulb1);
    this.bulb1 = bulb1;

    const bulb2 = new Sphere(gl, solidRes.program, solidRes.locs, 0.045, 12, 12, bulbColor);
    bulb2.setParent(shade);
    bulb2.translate([0.07, -0.1, 0]);
    this.parts.push(bulb2);
    this.bulb2 = bulb2;

    this.isOn = true;
    this.scale([1.8, 1.8, 1.8]);
  }

  toggle() {
    this.isOn = !this.isOn;
    this.updateVisuals();
    console.log("Lamp toggled:", this.isOn ? "ON" : "OFF");
  }

  updateVisuals() {
    const activeBulbColor = [1.0, 0.95, 0.6, 1.0];
    const inactiveBulbColor = [0.3, 0.3, 0.25, 1.0];
    const activeShadeColor = [0.96, 0.95, 0.88, 1.0];
    const inactiveShadeColor = [0.5, 0.5, 0.45, 1.0];

    if (this.bulb1) {
      this.bulb1.color = this.isOn ? activeBulbColor : inactiveBulbColor;
    }
    if (this.bulb2) {
      this.bulb2.color = this.isOn ? activeBulbColor : inactiveBulbColor;
    }
    if (this.shade) {
      this.shade.color = this.isOn ? activeShadeColor : inactiveShadeColor;
    }
  }

  setTransform(pos, rotY) {
    this.position = pos;
    this.rotation = rotY;
    this.localMatrix = mat4.create();
    mat4.translate(this.localMatrix, this.localMatrix, pos);
    mat4.rotate(this.localMatrix, this.localMatrix, rotY, [0, 1, 0]);
    mat4.scale(this.localMatrix, this.localMatrix, [1.8, 1.8, 1.8]);
  }

  getCollisionBounds(houseElevation) {
    // Physics bounds remain centered around the base so the player can walk close to the stand
    const halfWidth = 0.15 * 1.8;
    const halfDepth = 0.15 * 1.8;
    const height = 2.05 * 1.8;

    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);

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
      const wx = rx + this.position[0];
      const wy = c[1] + this.position[1] + houseElevation;
      const wz = rz + this.position[2];

      if (wx < minX) minX = wx;
      if (wx > maxX) maxX = wx;
      if (wy < minY) minY = wy;
      if (wy > maxY) maxY = wy;
      if (wz < minZ) minZ = wz;
      if (wz > maxZ) maxZ = wz;
    }

    return { minX, maxX, minY, maxY, minZ, maxZ };
  }

  draw(gl, viewProjection) {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);
    this.parts.forEach(part => part.draw(gl, viewProjection));
  }
}
