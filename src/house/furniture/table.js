class SmallTable extends Node {
  constructor(gl, solidRes) {
    super();
    this.parts = [];
    const woodColor = [0.4, 0.25, 0.15, 1.0];

    // Legs: 4 traditional legs sitting from Y = 0 to Y = 0.44 (center Y = 0.22)
    const legPositions = [
      [-0.2, 0.22, 0.2],
      [0.2, 0.22, 0.2],
      [-0.2, 0.22, -0.2],
      [0.2, 0.22, -0.2]
    ];
    legPositions.forEach(pos => {
      const leg = new Cylinder(gl, solidRes.program, solidRes.locs, 0.025, 0.025, 0.44, 8, woodColor);
      leg.setParent(this);
      leg.translate(pos);
      this.parts.push(leg);
    });

    // Horizontal bars (stretchers) connecting each leg at Y = 0.1
    // Front bar (X axis)
    const frontBar = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    frontBar.setParent(this);
    frontBar.translate([0, 0.1, 0.2]);
    frontBar.scale([0.4, 0.03, 0.03]);
    this.parts.push(frontBar);

    // Back bar (X axis)
    const backBar = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    backBar.setParent(this);
    backBar.translate([0, 0.1, -0.2]);
    backBar.scale([0.4, 0.03, 0.03]);
    this.parts.push(backBar);

    // Left bar (Z axis)
    const leftBar = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    leftBar.setParent(this);
    leftBar.translate([-0.2, 0.1, 0]);
    leftBar.scale([0.03, 0.03, 0.4]);
    this.parts.push(leftBar);

    // Right bar (Z axis)
    const rightBar = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    rightBar.setParent(this);
    rightBar.translate([0.2, 0.1, 0]);
    rightBar.scale([0.03, 0.03, 0.4]);
    this.parts.push(rightBar);

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
