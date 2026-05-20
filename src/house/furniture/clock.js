class GrandfatherClock extends Node {
  constructor(gl, solidRes, texRes, woodTexture) {
    super();
    this.parts = [];

    const brassColor = [0.75, 0.65, 0.25, 1.0];
    const clockFaceColor = [0.95, 0.95, 0.9, 1.0];
    const handsColor = [0.1, 0.1, 0.1, 1.0];

    // 1. Base (bottom section) - Y = 0 to 0.5, height = 0.5, center at 0.25
    const base = new Wall(gl, texRes.program, texRes.locs);
    base.setParent(this);
    base.translate([0, 0.25, 0]);
    base.scale([0.65, 0.5, 0.45]);
    base.uvScale = [0.65, 0.5];
    this.base = base;

    // 2. Waist (middle section) - Y = 0.5 to 1.7, height = 1.2, center at 1.1
    const waist = new Wall(gl, texRes.program, texRes.locs);
    waist.setParent(this);
    waist.translate([0, 1.1, 0]);
    waist.scale([0.5, 1.2, 0.35]);
    waist.uvScale = [0.5, 1.2];
    this.waist = waist;

    // Waist glass window cutout (overlayed black/blue glass pane, semi-transparent)
    const windowGlass = new Wall(gl, solidRes.program, solidRes.locs, [0.1, 0.15, 0.2, 0.5]); // semi-transparent blue glass
    windowGlass.setParent(this);
    windowGlass.translate([0, 1.1, 0.18]);
    windowGlass.scale([0.34, 0.9, 0.01]);
    this.windowGlass = windowGlass;

    // Pendulum (inside the waist behind the glass)
    const pendulumShaft = new Cylinder(gl, solidRes.program, solidRes.locs, 0.01, 0.01, 0.8, 8, brassColor);
    pendulumShaft.setParent(this);
    pendulumShaft.translate([0, 1.1, 0.05]);
    this.parts.push(pendulumShaft);

    const pendulumBob = new Cylinder(gl, solidRes.program, solidRes.locs, 0.1, 0.1, 0.02, 16, brassColor);
    pendulumBob.setParent(this);
    pendulumBob.translate([0, 0.75, 0.06]);
    pendulumBob.rotate(Math.PI / 2, [1, 0, 0]); // face forward
    this.parts.push(pendulumBob);

    // 3. Hood (top head section) - Y = 1.7 to 2.2, height = 0.5, center at 1.95
    const hood = new Wall(gl, texRes.program, texRes.locs);
    hood.setParent(this);
    hood.translate([0, 1.95, 0]);
    hood.scale([0.6, 0.5, 0.4]);
    hood.uvScale = [0.6, 0.5];
    this.hood = hood;

    // Clock Face: circular dial, Y = 1.95, center at 1.95
    const face = new Cylinder(gl, solidRes.program, solidRes.locs, 0.18, 0.18, 0.02, 16, clockFaceColor);
    face.setParent(this);
    face.translate([0, 1.95, 0.21]);
    face.rotate(Math.PI / 2, [1, 0, 0]);
    this.parts.push(face);

    // Clock Hands (Hour, Minute)
    const hourHand = new Wall(gl, solidRes.program, solidRes.locs, handsColor);
    hourHand.setParent(this);
    hourHand.translate([0.00, 1.91, 0.225]);
    hourHand.rotate(Math.PI, [0, 0, 1]);
    hourHand.scale([0.015, 0.09, 0.005]);
    this.parts.push(hourHand);

    const minuteHand = new Wall(gl, solidRes.program, solidRes.locs, handsColor);
    minuteHand.setParent(this);
    minuteHand.translate([0.0, 2.02, 0.225]);
    minuteHand.scale([0.01, 0.14, 0.005]);
    this.parts.push(minuteHand);

    // Decorative crown / finial on top of hood - Y = 2.2 to 2.24, height = 0.04, center at 2.22
    const crown = new Wall(gl, texRes.program, texRes.locs);
    crown.setParent(this);
    crown.translate([0, 2.22, 0]);
    crown.scale([0.5, 0.04, 0.35]);
    crown.uvScale = [0.5, 0.04];
    this.crown = crown;

    // Sphere on top: Y = 2.24 + 0.06 = 2.3
    const finial = new Sphere(gl, solidRes.program, solidRes.locs, 0.06, 12, 12, brassColor);
    finial.setParent(this);
    finial.translate([0, 2.3, 0]);
    this.parts.push(finial);

    this.scale([2.5, 2.5, 2.5]);
  }

  setTransform(pos, rotY) {
    this.position = pos;
    this.rotation = rotY;
    this.localMatrix = mat4.create();
    mat4.translate(this.localMatrix, this.localMatrix, pos);
    mat4.rotate(this.localMatrix, this.localMatrix, rotY, [0, 1, 0]);
    mat4.scale(this.localMatrix, this.localMatrix, [2.5, 2.5, 2.5]);
  }

  getCollisionBounds(houseElevation) {
    // Total bounding box of the Grandfather Clock (scaled by 2.5)
    const halfWidth = 0.325 * 2.5;
    const halfDepth = 0.225 * 2.5;
    const height = 2.36 * 2.5;

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

  draw(gl, viewProjection, woodTexture) {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);

    // Draw wood textured segments
    this.base.draw(gl, viewProjection, woodTexture);
    this.waist.draw(gl, viewProjection, woodTexture);
    this.hood.draw(gl, viewProjection, woodTexture);
    this.crown.draw(gl, viewProjection, woodTexture);

    // Draw solid components
    this.parts.forEach(part => part.draw(gl, viewProjection));

    // Draw transparent glass window with alpha blending
    this.windowGlass.draw(gl, viewProjection);
  }
}
