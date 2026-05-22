class GrandfatherClock extends Node {
  constructor(gl, solidRes) {
    super();
    this.parts = [];
    this.time = 0;

    const brassColor = [0.75, 0.65, 0.25, 1.0];
    const clockFaceColor = [0.95, 0.95, 0.9, 1.0];
    const handsColor = [0.1, 0.1, 0.1, 1.0];
    const woodColor = [0.65, 0.45, 0.28, 1.0];

    // 1. Base (bottom section) - Y = 0 to 0.5, height = 0.5, center at 0.25
    const base = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    base.setParent(this);
    base.translate([0, 0.25, 0]);
    base.scale([0.65, 0.5, 0.45]);
    this.base = base;

    // 2. Waist (middle section) - Y = 0.5 to 1.7, height = 1.2, center at 1.1
    // We make it hollow by building it out of thin panels: back, left, right, and front borders (left, right, top, bottom)
    const waistBack = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    waistBack.setParent(this);
    waistBack.translate([0, 1.1, -0.165]);
    waistBack.scale([0.5, 1.2, 0.02]);
    this.waistBack = waistBack;

    const waistLeft = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    waistLeft.setParent(this);
    waistLeft.translate([-0.24, 1.1, 0]);
    waistLeft.scale([0.02, 1.2, 0.35]);
    this.waistLeft = waistLeft;

    const waistRight = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    waistRight.setParent(this);
    waistRight.translate([0.24, 1.1, 0]);
    waistRight.scale([0.02, 1.2, 0.35]);
    this.waistRight = waistRight;

    const frontLeft = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    frontLeft.setParent(this);
    frontLeft.translate([-0.21, 1.1, 0.165]);
    frontLeft.scale([0.08, 1.2, 0.02]);
    this.frontLeft = frontLeft;

    const frontRight = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    frontRight.setParent(this);
    frontRight.translate([0.21, 1.1, 0.165]);
    frontRight.scale([0.08, 1.2, 0.02]);
    this.frontRight = frontRight;

    const frontTop = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    frontTop.setParent(this);
    frontTop.translate([0, 1.625, 0.165]);
    frontTop.scale([0.5, 0.15, 0.02]);
    this.frontTop = frontTop;

    const frontBottom = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    frontBottom.setParent(this);
    frontBottom.translate([0, 0.575, 0.165]);
    frontBottom.scale([0.5, 0.15, 0.02]);
    this.frontBottom = frontBottom;

    // Waist glass window cutout (overlayed glass pane, semi-transparent blue glass)
    const windowGlass = new Wall(gl, solidRes.program, solidRes.locs, [0.1, 0.15, 0.2, 0.5]);
    windowGlass.setParent(this);
    windowGlass.translate([0, 1.1, 0.18]);
    windowGlass.scale([0.34, 0.9, 0.01]);
    this.windowGlass = windowGlass;

    // Pendulum Swing Parent Node (acts as pivot at Y = 1.5)
    const pendulumNode = new Node();
    pendulumNode.setParent(this);
    this.pendulumNode = pendulumNode;

    // Pendulum (inside the waist behind the glass)
    // Shaft: local height = 0.8, centered at local Y = -0.4
    const pendulumShaft = new Cylinder(gl, solidRes.program, solidRes.locs, 0.01, 0.01, 0.8, 8, brassColor);
    pendulumShaft.setParent(pendulumNode);
    pendulumShaft.translate([0, -0.4, 0]);
    this.parts.push(pendulumShaft);

    // Bob: local disc at the bottom of the shaft (local Y = -0.8)
    const pendulumBob = new Cylinder(gl, solidRes.program, solidRes.locs, 0.1, 0.1, 0.02, 16, brassColor);
    pendulumBob.setParent(pendulumNode);
    pendulumBob.translate([0, -0.8, 0.01]);
    pendulumBob.rotate(Math.PI / 2, [1, 0, 0]); // face forward
    this.parts.push(pendulumBob);

    // 3. Hood (top head section) - Y = 1.7 to 2.2, height = 0.5, center at 1.95
    const hood = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    hood.setParent(this);
    hood.translate([0, 1.95, 0]);
    hood.scale([0.6, 0.5, 0.4]);
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
    const crown = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    crown.setParent(this);
    crown.translate([0, 2.22, 0]);
    crown.scale([0.5, 0.04, 0.35]);
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

  update(deltaTime) {
    this.time += deltaTime;
    // Swing back and forth with speed 3.0 rad/s and max amplitude of 0.12 radians
    const angle = 0.12 * Math.sin(this.time * 3.0);
    if (this.pendulumNode) {
      this.pendulumNode.localMatrix = mat4.create();
      mat4.translate(this.pendulumNode.localMatrix, this.pendulumNode.localMatrix, [0, 1.5, 0.05]);
      mat4.rotate(this.pendulumNode.localMatrix, this.pendulumNode.localMatrix, angle, [0, 0, 1]);
    }
  }

  draw(gl, viewProjection) {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);

    // Draw wood solid segments
    this.base.draw(gl, viewProjection);
    this.waistBack.draw(gl, viewProjection);
    this.waistLeft.draw(gl, viewProjection);
    this.waistRight.draw(gl, viewProjection);
    this.frontLeft.draw(gl, viewProjection);
    this.frontRight.draw(gl, viewProjection);
    this.frontTop.draw(gl, viewProjection);
    this.frontBottom.draw(gl, viewProjection);
    this.hood.draw(gl, viewProjection);
    this.crown.draw(gl, viewProjection);

    // Draw solid components
    this.parts.forEach(part => part.draw(gl, viewProjection));

    // Draw transparent glass window with alpha blending
    this.windowGlass.draw(gl, viewProjection);
  }
}
