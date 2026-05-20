class Carpet extends Node {
  constructor(gl, solidRes, texRes, color = [0.85, 0.82, 0.75, 1.0]) {
    super();
    // Circular carpet: a flat Cylinder (radius 2.3, height = 0.02, centered at Y = 0.01)
    // Use texRes so the rug texture can be applied
    this.slab = new Cylinder(gl, texRes.program, texRes.locs, 2.3, 2.3, 0.001, 32, color);
    this.slab.setParent(this);
    this.slab.translate([0, 0.01, 0]);
    this.slab.uvScale = [1.0, 1.0]; // one full texture across the rug disc

    this.scale([1.8, 1.0, 1.8]);
  }

  setTransform(pos, rotY) {
    this.position = pos;
    this.rotation = rotY;
    this.localMatrix = mat4.create();
    mat4.translate(this.localMatrix, this.localMatrix, pos);
    mat4.rotate(this.localMatrix, this.localMatrix, rotY, [0, 1, 0]);
  }

  draw(gl, viewProjection, rugTexture) {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);
    this.slab.draw(gl, viewProjection, rugTexture);
  }
}
