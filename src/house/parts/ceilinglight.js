class CeilingLight extends Node {
  constructor(gl, solidRes, initialOn = true) {
    super();
    this.parts = [];
    this.isOn = initialOn;

    // Colors
    const brassColor = [0.75, 0.65, 0.25, 1.0];

    const canopy = new Cylinder(gl, solidRes.program, solidRes.locs, 0.2, 0.2, 0.06, 12, brassColor);
    canopy.setParent(this);
    canopy.translate([0, -0.03, 0]);
    this.parts.push(canopy);

    const socket = new Cylinder(gl, solidRes.program, solidRes.locs, 0.08, 0.08, 0.12, 10, brassColor);
    socket.setParent(this);
    socket.translate([0, -0.12, 0]);
    this.parts.push(socket);

    const bulbColor = initialOn ? [1.0, 0.98, 0.8, 1.0] : [0.9, 0.9, 0.85, 1.0];
    this.bulb = new Sphere(gl, solidRes.program, solidRes.locs, 0.14, 12, 12, bulbColor);
    this.bulb.emissive = initialOn ? 1.0 : 0.0;
    this.bulb.setParent(this);
    this.bulb.translate([0, -0.28, 0]);
    this.parts.push(this.bulb);
  }

  toggle() {
    this.isOn = !this.isOn;
    this.updateVisuals();
    console.log("Ceiling Light toggled:", this.isOn ? "ON" : "OFF");
  }

  updateVisuals() {
    if (this.bulb) {
      this.bulb.color = this.isOn ? [1.0, 0.98, 0.8, 1.0] : [0.9, 0.9, 0.85, 1.0];
      this.bulb.emissive = this.isOn ? 1.0 : 0.0;
    }
  }

  setTransform(pos) {
    this.localMatrix = mat4.create();
    mat4.translate(this.localMatrix, this.localMatrix, pos);
    mat4.scale(this.localMatrix, this.localMatrix, [1.8, 1.8, 1.8]);
  }

  draw(gl, viewProjection, shadowProgramInfo) {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);
    this.parts.forEach(part => part.draw(gl, viewProjection, shadowProgramInfo));
  }
}
