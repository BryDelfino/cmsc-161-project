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

    // Pole: brass rod, Y = 0.04 to 1.64, height = 1.6, center at 0.84
    const pole = new Cylinder(gl, solidRes.program, solidRes.locs, 0.02, 0.02, 1.6, 12, brassColor);
    pole.setParent(this);
    pole.translate([0, 0.84, 0]);
    this.parts.push(pole);

    // Shade: Y = 1.64 to 2.04, height = 0.4, center at 1.84
    // Top radius = 0.18, Bottom radius = 0.28 (gives it a nice cone slant)
    const shade = new Cylinder(gl, solidRes.program, solidRes.locs, 0.18, 0.28, 0.4, 16, shadeColor);
    shade.setParent(this);
    shade.translate([0, 1.84, 0]);
    this.parts.push(shade);

    // Light bulb: inside shade, center at Y = 1.74
    // Sphere class is loaded globally from stairs.js
    const bulb = new Sphere(gl, solidRes.program, solidRes.locs, 0.06, 12, 12, bulbColor);
    bulb.setParent(this);
    bulb.translate([0, 1.74, 0]);
    this.parts.push(bulb);

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
    // Total bounding box of the Lamp base (scaled by 1.8)
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
