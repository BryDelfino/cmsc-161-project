class SmallTable extends Node {
  constructor(gl, solidRes) {
    super();
    this.parts = [];
    const woodColor = [0.4, 0.25, 0.15, 1.0];

    // Feet: cross feet at the bottom (Y = 0 to 0.04, center at 0.02)
    const foot1 = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    foot1.setParent(this);
    foot1.translate([0, 0.02, 0]);
    foot1.scale([0.5, 0.04, 0.1]);
    this.parts.push(foot1);

    const foot2 = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    foot2.setParent(this);
    foot2.translate([0, 0.02, 0]);
    foot2.scale([0.1, 0.04, 0.5]);
    this.parts.push(foot2);

    // Pedestal pillar post: Y = 0.04 to 0.44, height = 0.4, center at 0.24
    const pillar = new Cylinder(gl, solidRes.program, solidRes.locs, 0.05, 0.05, 0.4, 12, woodColor);
    pillar.setParent(this);
    pillar.translate([0, 0.24, 0]);
    this.parts.push(pillar);

    // Tabletop: round table top, Y = 0.44 to 0.49, height = 0.05, center at 0.465
    const top = new Cylinder(gl, solidRes.program, solidRes.locs, 0.35, 0.35, 0.05, 16, woodColor);
    top.setParent(this);
    top.translate([0, 0.465, 0]);
    this.parts.push(top);

    this.scale([1.8, 1.8, 1.8]);
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
    // Total bounding box of the Table (scaled by 1.8)
    const halfWidth = 0.35 * 1.8;
    const halfDepth = 0.35 * 1.8;
    const height = 0.5 * 1.8;

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
