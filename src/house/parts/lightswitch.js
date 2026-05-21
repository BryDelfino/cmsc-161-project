class Lightswitch extends Node {
  constructor(gl, solidRes, initialOn = true) {
    super();
    this.solidRes = solidRes;
    this.isOn = initialOn;

    // Outer dimensions
    this.width = 0.22;
    this.height = 0.35;
    this.thickness = 0.03;

    // Interaction reach and transform parameters
    this.position = [0, 0, 0];
    this.rotationY = 0;

    // Rocker switch tilt angle (radians)
    this.currentAngle = initialOn ? 0.25 : -0.25;
    this.targetAngle = initialOn ? 0.25 : -0.25;

    this.solidMeshes = [];
    this.rockerMesh = null;
    this.ledMesh = null;

    this.buildVisuals(gl);
  }

  setTransform(pos, rotY) {
    this.position = pos;
    this.rotationY = rotY;
    this.localMatrix = mat4.create();
    mat4.translate(this.localMatrix, this.localMatrix, pos);
    mat4.rotate(this.localMatrix, this.localMatrix, rotY, [0, 1, 0]);
  }

  toggle() {
    this.isOn = !this.isOn;
    this.targetAngle = this.isOn ? 0.25 : -0.25;
    console.log("Lightswitch toggled:", this.isOn ? "ON" : "OFF");
  }

  update(deltaTime) {
    // Smoothly animate the rocker switch click tilt
    const tiltSpeed = 15.0; // Fast and snappy click transition (rad/sec)
    if (this.currentAngle < this.targetAngle) {
      this.currentAngle = Math.min(this.targetAngle, this.currentAngle + tiltSpeed * deltaTime);
    } else if (this.currentAngle > this.targetAngle) {
      this.currentAngle = Math.max(this.targetAngle, this.currentAngle - tiltSpeed * deltaTime);
    }

    // Apply rotation around the rocker's local X-axis
    if (this.rockerMesh) {
      this.rockerMesh.localMatrix = mat4.create();
      // Translate to sit on front face, rotate by tilt angle, then scale
      mat4.translate(this.rockerMesh.localMatrix, this.rockerMesh.localMatrix, [0, 0, this.thickness / 2]);
      mat4.rotateX(this.rockerMesh.localMatrix, this.rockerMesh.localMatrix, this.currentAngle);
      mat4.scale(this.rockerMesh.localMatrix, this.rockerMesh.localMatrix, [0.06, 0.12, 0.03]);
    }

    // Update LED color depending on ON/OFF state
    if (this.ledMesh) {
      this.ledMesh.color = this.isOn ? [0.2, 0.9, 0.2, 1.0] : [0.9, 0.2, 0.2, 1.0];
    }
  }

  buildVisuals(gl) {
    const w = this.width;
    const h = this.height;
    const t = this.thickness;

    // 1. Backplate: Brushed metal color
    const plate = new Wall(gl, this.solidRes.program, this.solidRes.locs, [0.8, 0.8, 0.8, 1.0]);
    plate.setParent(this);
    plate.scale([w, h, t]);
    this.solidMeshes.push(plate);

    // Inner dark grey border insert for visual depth
    const border = new Wall(gl, this.solidRes.program, this.solidRes.locs, [0.35, 0.35, 0.35, 1.0]);
    border.setParent(this);
    border.translate([0, 0, t / 2 + 0.001]);
    border.scale([w - 0.03, h - 0.03, 0.005]);
    this.solidMeshes.push(border);

    // 2. Rocker Switch Button (animates via localMatrix in update)
    this.rockerMesh = new Wall(gl, this.solidRes.program, this.solidRes.locs, [0.95, 0.95, 0.95, 1.0]);
    this.rockerMesh.setParent(this);
    // Initial placement on the front surface
    this.rockerMesh.translate([0, 0, t / 2]);
    this.rockerMesh.scale([0.06, 0.12, 0.03]);
    this.solidMeshes.push(this.rockerMesh);

    // 3. Status LED (glowing sphere near the top edge)
    const ledColor = this.isOn ? [0.2, 0.9, 0.2, 1.0] : [0.9, 0.2, 0.2, 1.0];
    this.ledMesh = new Sphere(gl, this.solidRes.program, this.solidRes.locs, 0.015, 8, 8, ledColor);
    this.ledMesh.setParent(this);
    this.ledMesh.translate([0, 0.1, t / 2 + 0.01]);
  }

  draw(gl, viewProjection) {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);

    // Draw plate, border, rocker, etc.
    this.solidMeshes.forEach(mesh => {
      mesh.draw(gl, viewProjection);
    });

    // Draw status LED
    if (this.ledMesh) {
      this.ledMesh.draw(gl, viewProjection);
    }
  }
}
