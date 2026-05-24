class RockingChair extends Node {
  constructor(gl, solidRes, woodColor = [0.65, 0.45, 0.28, 1.0]) {
    super();
    this.woodColor = woodColor;
    this.parts = [];

    const rockerXOffsets = [-0.35, 0.35];
    rockerXOffsets.forEach(xOffset => {
      const mid = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
      mid.setParent(this);
      mid.translate([xOffset, 0.015, 0]);
      mid.scale([0.06, 0.03, 0.6]);
      this.parts.push(mid);

      const front = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
      front.setParent(this);
      front.translate([xOffset, 0.045, 0.42]);
      front.rotate(0.15, [1, 0, 0]);
      front.scale([0.06, 0.03, 0.3]);
      this.parts.push(front);

      const back = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
      back.setParent(this);
      back.translate([xOffset, 0.045, -0.42]);
      back.rotate(-0.15, [1, 0, 0]);
      back.scale([0.06, 0.03, 0.3]);
      this.parts.push(back);
    });

    const legPositions = [
      [-0.35, 0.23, 0.3],
      [0.35, 0.23, 0.3],
      [-0.35, 0.23, -0.3],
      [0.35, 0.23, -0.3]
    ];
    legPositions.forEach(pos => {
      const leg = new Cylinder(gl, solidRes.program, solidRes.locs, 0.03, 0.03, 0.4, 8, woodColor);
      leg.setParent(this);
      leg.translate(pos);
      this.parts.push(leg);
    });

    const seat = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    seat.setParent(this);
    seat.translate([0, 0.46, 0]);
    seat.scale([0.9, 0.06, 0.9]);
    this.parts.push(seat);

    const topRail = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    topRail.setParent(this);
    topRail.translate([0, 1.19, -0.4]);
    topRail.scale([0.9, 0.06, 0.06]);
    this.parts.push(topRail);

    const leftPost = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    leftPost.setParent(this);
    leftPost.translate([-0.42, 0.825, -0.4]);
    leftPost.scale([0.04, 0.73, 0.04]);
    this.parts.push(leftPost);

    const rightPost = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    rightPost.setParent(this);
    rightPost.translate([0.42, 0.825, -0.4]);
    rightPost.scale([0.04, 0.73, 0.04]);
    this.parts.push(rightPost);

    const horizBar = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    horizBar.setParent(this);
    horizBar.translate([0, 1.06, -0.4]);
    horizBar.scale([0.80, 0.5, 0.03]);
    this.parts.push(horizBar);

    const armLeft = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    armLeft.setParent(this);
    armLeft.translate([-0.42, 0.76, 0.025]);
    armLeft.scale([0.06, 0.04, 0.85]);
    this.parts.push(armLeft);

    const armRight = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    armRight.setParent(this);
    armRight.translate([0.42, 0.76, 0.025]);
    armRight.scale([0.06, 0.04, 0.85]);
    this.parts.push(armRight);

    const supportLeft = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    supportLeft.setParent(this);
    supportLeft.translate([-0.42, 0.61, 0.35]);
    supportLeft.scale([0.04, 0.3, 0.04]);
    this.parts.push(supportLeft);

    const supportRight = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    supportRight.setParent(this);
    supportRight.translate([0.42, 0.61, 0.35]);
    supportRight.scale([0.04, 0.3, 0.04]);
    this.parts.push(supportRight);

    this.parts.forEach(part => {
      part.shininess = 20.0;
      part.specularStrength = 0.3;
    });

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
    return computeAABBBounds(this.position, this.rotation, 0.48 * 1.8, 0.58 * 1.8, 1.25 * 1.8, houseElevation);
  }

  draw(gl, viewProjection, shadowProgramInfo) {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);
    this.parts.forEach(part => part.draw(gl, viewProjection, shadowProgramInfo));
  }
}

class RedCouch extends Node {
  constructor(gl, solidRes) {
    super();
    this.parts = [];

    const redColor = [0.8, 0.12, 0.12, 1.0];
    const woodColor = [0.3, 0.18, 0.08, 1.0];

    const legCoords = [
      [-0.38, 0.1, 0.35],
      [0.38, 0.1, 0.35],
      [-0.38, 0.1, -0.35],
      [0.38, 0.1, -0.35]
    ];
    legCoords.forEach(coord => {
      const leg = new Cylinder(gl, solidRes.program, solidRes.locs, 0.04, 0.04, 0.2, 8, woodColor);
      leg.setParent(this);
      leg.translate(coord);
      leg.shininess = 20.0;
      leg.specularStrength = 0.3;
      this.parts.push(leg);
    });

    // Seat cushion
    const seat = new Cube(gl, solidRes.program, solidRes.locs, redColor);
    seat.setParent(this);
    seat.translate([0, 0.375, 0]);
    seat.scale([0.8, 0.35, 0.8]);
    this.parts.push(seat);

    // Left armrest
    const armLeft = new Cube(gl, solidRes.program, solidRes.locs, redColor);
    armLeft.setParent(this);
    armLeft.translate([-0.46, 0.45, 0.02]);
    armLeft.scale([0.16, 0.5, 0.8]);
    this.parts.push(armLeft);

    // Right armrest
    const armRight = new Cube(gl, solidRes.program, solidRes.locs, redColor);
    armRight.setParent(this);
    armRight.translate([0.46, 0.45, 0.02]);
    armRight.scale([0.16, 0.5, 0.8]);
    this.parts.push(armRight);

    // Armrest fabric protectors
    const whiteColor = [1.0, 1.0, 1.0, 1.0];

    const patchLeft = new Cube(gl, solidRes.program, solidRes.locs, whiteColor);
    patchLeft.setParent(this);
    patchLeft.translate([-0.46, 0.701, 0.05]);
    patchLeft.scale([0.162, 0.02, 0.3]);
    this.parts.push(patchLeft);

    const patchRight = new Cube(gl, solidRes.program, solidRes.locs, whiteColor);
    patchRight.setParent(this);
    patchRight.translate([0.46, 0.701, 0.05]);
    patchRight.scale([0.162, 0.02, 0.3]);
    this.parts.push(patchRight);

    // Backrest
    const back = new Cube(gl, solidRes.program, solidRes.locs, redColor);
    back.setParent(this);
    back.translate([0, 0.75, -0.32]);
    back.scale([0.8, 1.1, 0.22]);
    this.parts.push(back);

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
    return computeAABBBounds(this.position, this.rotation, 0.54 * 1.8, 0.45 * 1.8, 1.3 * 1.8, houseElevation);
  }

  draw(gl, viewProjection, shadowProgramInfo) {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);
    this.parts.forEach(part => part.draw(gl, viewProjection, shadowProgramInfo));
  }
}
