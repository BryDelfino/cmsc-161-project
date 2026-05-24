class Lamp extends Node {
  constructor(gl, solidRes) {
    super();
    this.parts = [];

    const brassColor = [0.75, 0.65, 0.25, 1.0];
    const shadeColor = [0.96, 0.95, 0.88, 1.0];
    const bulbColor = [1.0, 0.95, 0.6, 1.0];

    // Base
    const base = new Cylinder(gl, solidRes.program, solidRes.locs, 0.2, 0.2, 0.04, 16, brassColor);
    base.setParent(this);
    base.shininess = 80.0;
    base.specularStrength = 1.0;
    base.translate([0, 0.02, 0]);
    this.parts.push(base);

    // Stand
    const lowerPole = new Cylinder(gl, solidRes.program, solidRes.locs, 0.02, 0.02, 0.8, 12, brassColor);
    lowerPole.setParent(this);
    lowerPole.shininess = 80.0;
    lowerPole.specularStrength = 1.0;
    lowerPole.translate([0, 0.44, 0]);
    this.parts.push(lowerPole);

    const joint = new Sphere(gl, solidRes.program, solidRes.locs, 0.035, 12, 12, brassColor);
    joint.setParent(this);
    joint.shininess = 80.0;
    joint.specularStrength = 1.0;
    joint.translate([0, 0.84, 0]);
    this.parts.push(joint);

    const upperArm = new Node();
    upperArm.setParent(this);
    upperArm.translate([0, 0.84, 0]);
    upperArm.rotate(0.6, [1, 0, 0]);

    const upperPole = new Cylinder(gl, solidRes.program, solidRes.locs, 0.018, 0.018, 0.8, 12, brassColor);
    upperPole.setParent(upperArm);
    upperPole.shininess = 80.0;
    upperPole.specularStrength = 1.0;
    upperPole.translate([0, 0.4, 0]);
    this.parts.push(upperPole);

    // Shade
    const shade = new HollowCylinder(gl, solidRes.program, solidRes.locs, 0.18, 0.28, 0.4, 16, shadeColor);
    shade.setParent(upperArm);
    shade.shininess = 1.0;
    shade.specularStrength = 0.0;
    shade.translate([0, 1.0, 0]);
    shade.rotate(-0.4, [1, 0, 0]);
    this.parts.push(shade);
    this.shade = shade;

    // Dual bulbs
    const bulb1 = new Sphere(gl, solidRes.program, solidRes.locs, 0.045, 12, 12, bulbColor);
    bulb1.setParent(shade);
    bulb1.shininess = 1.0;
    bulb1.specularStrength = 0.0;
    bulb1.translate([-0.07, -0.1, 0]);
    this.parts.push(bulb1);
    this.bulb1 = bulb1;

    const bulb2 = new Sphere(gl, solidRes.program, solidRes.locs, 0.045, 12, 12, bulbColor);
    bulb2.setParent(shade);
    bulb2.shininess = 1.0;
    bulb2.specularStrength = 0.0;
    bulb2.translate([0.07, -0.1, 0]);
    this.parts.push(bulb2);
    this.bulb2 = bulb2;

    this.isOn = true;
    this.scale([1.8, 1.8, 1.8]);
    this.updateVisuals();
  }

  toggle() {
    this.isOn = !this.isOn;
    this.updateVisuals();
    console.log("Lamp toggled:", this.isOn ? "ON" : "OFF");
  }

  updateVisuals() {
    const activeBulbColor = [1.0, 0.95, 0.6, 1.0];
    const inactiveBulbColor = [0.9, 0.9, 0.85, 1.0];
    const activeShadeColor = [0.96, 0.95, 0.88, 1.0];
    const inactiveShadeColor = [0.5, 0.5, 0.45, 1.0];

    if (this.bulb1) {
      this.bulb1.color = this.isOn ? activeBulbColor : inactiveBulbColor;
      this.bulb1.emissive = this.isOn ? 1.0 : 0.0;
    }
    if (this.bulb2) {
      this.bulb2.color = this.isOn ? activeBulbColor : inactiveBulbColor;
      this.bulb2.emissive = this.isOn ? 1.0 : 0.0;
    }
    if (this.shade) {
      this.shade.color = this.isOn ? activeShadeColor : inactiveShadeColor;
      this.shade.emissive = this.isOn ? 0.85 : 0.0;
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
    return computeAABBBounds(this.position, this.rotation, 0.15 * 1.8, 0.15 * 1.8, 2.05 * 1.8, houseElevation);
  }

  draw(gl, viewProjection, shadowProgramInfo) {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);
    this.parts.forEach(part => part.draw(gl, viewProjection, null, shadowProgramInfo));
  }
}
