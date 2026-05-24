class SmallTable extends Node {
  constructor(gl, solidRes) {
    super();
    this.parts = [];
    const woodColor = [0.4, 0.25, 0.15, 1.0];

    // Legs
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

    // Stretchers
    const frontBar = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    frontBar.setParent(this);
    frontBar.translate([0, 0.1, 0.2]);
    frontBar.scale([0.4, 0.03, 0.03]);
    this.parts.push(frontBar);

    const backBar = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    backBar.setParent(this);
    backBar.translate([0, 0.1, -0.2]);
    backBar.scale([0.4, 0.03, 0.03]);
    this.parts.push(backBar);

    const leftBar = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    leftBar.setParent(this);
    leftBar.translate([-0.2, 0.1, 0]);
    leftBar.scale([0.03, 0.03, 0.4]);
    this.parts.push(leftBar);

    const rightBar = new Cube(gl, solidRes.program, solidRes.locs, woodColor);
    rightBar.setParent(this);
    rightBar.translate([0.2, 0.1, 0]);
    rightBar.scale([0.03, 0.03, 0.4]);
    this.parts.push(rightBar);

    // Tabletop
    const top = new Cylinder(gl, solidRes.program, solidRes.locs, 0.35, 0.35, 0.05, 16, woodColor);
    top.setParent(this);
    top.translate([0, 0.465, 0]);
    this.parts.push(top);

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
    return computeAABBBounds(this.position, this.rotation, 0.35 * 1.8, 0.35 * 1.8, 0.5 * 1.8, houseElevation);
  }

  draw(gl, viewProjection, shadowProgramInfo) {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);
    this.parts.forEach(part => part.draw(gl, viewProjection, shadowProgramInfo));
  }
}
