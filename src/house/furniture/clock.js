class GrandfatherClock extends Node {
  constructor(gl, solidRes) {
    super();
    this.parts = [];
    this.time = 0;

    const brassColor = [0.75, 0.65, 0.25, 1.0];
    const clockFaceColor = [0.95, 0.95, 0.9, 1.0];
    const handsColor = [0.1, 0.1, 0.1, 1.0];
    const woodColor = [0.65, 0.45, 0.28, 1.0];

    // Base
    const base = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    base.setParent(this);
    base.translate([0, 0.25, 0]);
    base.scale([0.65, 0.5, 0.45]);
    base.shininess = 20.0;
    base.specularStrength = 0.3;
    this.base = base;

    // Waist
    const waistBack = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    waistBack.setParent(this);
    waistBack.translate([0, 1.1, -0.165]);
    waistBack.scale([0.5, 1.2, 0.02]);
    waistBack.shininess = 20.0;
    waistBack.specularStrength = 0.3;
    this.waistBack = waistBack;

    const waistLeft = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    waistLeft.setParent(this);
    waistLeft.translate([-0.24, 1.1, 0]);
    waistLeft.scale([0.02, 1.2, 0.35]);
    waistLeft.shininess = 20.0;
    waistLeft.specularStrength = 0.3;
    this.waistLeft = waistLeft;

    const waistRight = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    waistRight.setParent(this);
    waistRight.translate([0.24, 1.1, 0]);
    waistRight.scale([0.02, 1.2, 0.35]);
    waistRight.shininess = 20.0;
    waistRight.specularStrength = 0.3;
    this.waistRight = waistRight;

    const frontLeft = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    frontLeft.setParent(this);
    frontLeft.translate([-0.21, 1.1, 0.165]);
    frontLeft.scale([0.08, 1.2, 0.02]);
    frontLeft.shininess = 20.0;
    frontLeft.specularStrength = 0.3;
    this.frontLeft = frontLeft;

    const frontRight = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    frontRight.setParent(this);
    frontRight.translate([0.21, 1.1, 0.165]);
    frontRight.scale([0.08, 1.2, 0.02]);
    frontRight.shininess = 20.0;
    frontRight.specularStrength = 0.3;
    this.frontRight = frontRight;

    const frontTop = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    frontTop.setParent(this);
    frontTop.translate([0, 1.625, 0.165]);
    frontTop.scale([0.5, 0.15, 0.02]);
    frontTop.shininess = 20.0;
    frontTop.specularStrength = 0.3;
    this.frontTop = frontTop;

    const frontBottom = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    frontBottom.setParent(this);
    frontBottom.translate([0, 0.575, 0.165]);
    frontBottom.scale([0.5, 0.15, 0.02]);
    frontBottom.shininess = 20.0;
    frontBottom.specularStrength = 0.3;
    this.frontBottom = frontBottom;

    // Glass window
    const windowGlass = new Cube(gl, solidRes.program, solidRes.locs, [0.1, 0.15, 0.2, 0.2]);
    windowGlass.setParent(this);
    windowGlass.translate([0, 1.1, 0.18]);
    windowGlass.scale([0.34, 0.9, 0.01]);
    windowGlass.shininess = 50.0;
    windowGlass.specularStrength = 0.8;
    this.windowGlass = windowGlass;

    // Pendulum Swing Node
    const pendulumNode = new Node();
    pendulumNode.setParent(this);
    this.pendulumNode = pendulumNode;

    // Pendulum Shaft
    const pendulumShaft = new Cylinder(gl, solidRes.program, solidRes.locs, 0.01, 0.01, 0.8, 8, brassColor);
    pendulumShaft.setParent(pendulumNode);
    pendulumShaft.translate([0, -0.4, 0]);
    pendulumShaft.shininess = 80.0;
    pendulumShaft.specularStrength = 1.0;
    this.parts.push(pendulumShaft);

    // Pendulum Bob
    const pendulumBob = new Cylinder(gl, solidRes.program, solidRes.locs, 0.1, 0.1, 0.02, 16, brassColor);
    pendulumBob.setParent(pendulumNode);
    pendulumBob.translate([0, -0.8, 0.01]);
    pendulumBob.rotate(Math.PI / 2, [1, 0, 0]);
    pendulumBob.shininess = 80.0;
    pendulumBob.specularStrength = 1.0;
    this.parts.push(pendulumBob);

    // Hood
    const hood = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    hood.setParent(this);
    hood.translate([0, 1.95, 0]);
    hood.scale([0.6, 0.5, 0.4]);
    hood.shininess = 20.0;
    hood.specularStrength = 0.3;
    this.hood = hood;

    // Clock Face
    const face = new Cylinder(gl, solidRes.program, solidRes.locs, 0.18, 0.18, 0.02, 16, clockFaceColor);
    face.setParent(this);
    face.translate([0, 1.95, 0.21]);
    face.rotate(Math.PI / 2, [1, 0, 0]);
    face.shininess = 80.0;
    face.specularStrength = 1.0;
    this.parts.push(face);

    // Hands
    const hourHand = new Cube(gl, solidRes.program, solidRes.locs, handsColor);
    hourHand.setParent(this);
    hourHand.translate([0.00, 1.91, 0.225]);
    hourHand.rotate(Math.PI, [0, 0, 1]);
    hourHand.scale([0.015, 0.09, 0.005]);
    this.parts.push(hourHand);

    const minuteHand = new Cube(gl, solidRes.program, solidRes.locs, handsColor);
    minuteHand.setParent(this);
    minuteHand.translate([0.0, 2.02, 0.225]);
    minuteHand.scale([0.01, 0.14, 0.005]);
    this.parts.push(minuteHand);

    // Crown
    const crown = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    crown.setParent(this);
    crown.translate([0, 2.22, 0]);
    crown.scale([0.5, 0.04, 0.35]);
    crown.shininess = 20.0;
    crown.specularStrength = 0.3;
    this.crown = crown;

    // Finial finial
    const finial = new Sphere(gl, solidRes.program, solidRes.locs, 0.06, 12, 12, brassColor);
    finial.setParent(this);
    finial.translate([0, 2.3, 0]);
    finial.shininess = 80.0;
    finial.specularStrength = 1.0;
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
    return computeAABBBounds(this.position, this.rotation, 0.325 * 2.5, 0.225 * 2.5, 2.36 * 2.5, houseElevation);
  }

  update(deltaTime) {
    this.time += deltaTime;
    const angle = 0.12 * Math.sin(this.time * 3.0);
    if (this.pendulumNode) {
      this.pendulumNode.localMatrix = mat4.create();
      mat4.translate(this.pendulumNode.localMatrix, this.pendulumNode.localMatrix, [0, 1.5, 0.05]);
      mat4.rotate(this.pendulumNode.localMatrix, this.pendulumNode.localMatrix, angle, [0, 0, 1]);
    }
  }

  draw(gl, viewProjection, shadowProgramInfo) {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);

    this.base.draw(gl, viewProjection, shadowProgramInfo);
    this.waistBack.draw(gl, viewProjection, shadowProgramInfo);
    this.waistLeft.draw(gl, viewProjection, shadowProgramInfo);
    this.waistRight.draw(gl, viewProjection, shadowProgramInfo);
    this.frontLeft.draw(gl, viewProjection, shadowProgramInfo);
    this.frontRight.draw(gl, viewProjection, shadowProgramInfo);
    this.frontTop.draw(gl, viewProjection, shadowProgramInfo);
    this.frontBottom.draw(gl, viewProjection, shadowProgramInfo);
    this.hood.draw(gl, viewProjection, shadowProgramInfo);
    this.crown.draw(gl, viewProjection, shadowProgramInfo);

    this.parts.forEach(part => part.draw(gl, viewProjection, shadowProgramInfo));
    this.windowGlass.draw(gl, viewProjection, shadowProgramInfo);
  }
}
