class Window extends Node {
  constructor(gl, solidRes, texRes) {
    super();
    this.solidRes = solidRes;
    this.texRes = texRes;

    // Window dimensions (standard 3x3 opening)
    this.width = 3.0;
    this.height = 3.0;
    this.thickness = 0.2;

    this.position = [0, 0, 0];
    this.rotationY = 0;

    this.solidMeshes = [];
    this.transparentMeshes = [];

    this.buildVisuals(gl);
  }

  setTransform(pos, rotY) {
    this.position = pos;
    this.rotationY = rotY;
    this.localMatrix = mat4.create();
    mat4.translate(this.localMatrix, this.localMatrix, pos);
    mat4.rotate(this.localMatrix, this.localMatrix, rotY, [0, 1, 0]);
  }

  buildVisuals(gl) {
    const w = this.width;
    const h = this.height;
    const t = this.thickness;

    // Wooden frame color: light brown
    const frameColor = [0.65, 0.45, 0.28, 1.0];
    const frameThickness = 0.22; // slightly thicker than 0.2 wall to avoid z-fighting
    const border = 0.1; // border thickness of the frame

    // --- Outer Frame ---
    // Left border
    const leftFrame = new Wall(gl, this.solidRes.program, this.solidRes.locs, frameColor);
    leftFrame.setParent(this);
    leftFrame.translate([-w / 2 + border / 2, 0, 0]);
    leftFrame.scale([border, h, frameThickness]);
    this.solidMeshes.push(leftFrame);

    // Right border
    const rightFrame = new Wall(gl, this.solidRes.program, this.solidRes.locs, frameColor);
    rightFrame.setParent(this);
    rightFrame.translate([w / 2 - border / 2, 0, 0]);
    rightFrame.scale([border, h, frameThickness]);
    this.solidMeshes.push(rightFrame);

    // Top border
    const topFrame = new Wall(gl, this.solidRes.program, this.solidRes.locs, frameColor);
    topFrame.setParent(this);
    topFrame.translate([0, h / 2 - border / 2, 0]);
    topFrame.scale([w - 2 * border, border, frameThickness]);
    this.solidMeshes.push(topFrame);

    // Bottom border
    const bottomFrame = new Wall(gl, this.solidRes.program, this.solidRes.locs, frameColor);
    bottomFrame.setParent(this);
    bottomFrame.translate([0, -h / 2 + border / 2, 0]);
    bottomFrame.scale([w - 2 * border, border, frameThickness]);
    this.solidMeshes.push(bottomFrame);

    // --- Cross Pattern Muntins (Horizontal & Vertical) ---
    const dividerW = 0.06;
    const dividerD = 0.05;

    // Vertical divider
    const vertDivider = new Wall(gl, this.solidRes.program, this.solidRes.locs, frameColor);
    vertDivider.setParent(this);
    vertDivider.translate([0, 0, 0]);
    vertDivider.scale([dividerW, h - 2 * border, dividerD]);
    this.solidMeshes.push(vertDivider);

    // Horizontal divider
    const horizDivider = new Wall(gl, this.solidRes.program, this.solidRes.locs, frameColor);
    horizDivider.setParent(this);
    horizDivider.translate([0, 0, 0]);
    horizDivider.scale([w - 2 * border, dividerW, dividerD]);
    this.solidMeshes.push(horizDivider);

    // --- Bottom Ledge (Inside only!) ---
    // Sits at the bottom of the window, extends inside (local -Z)
    // Ledge width is slightly wider than opening (3.2 units)
    // Ledge height is 0.08 units
    // Ledge depth is 0.5 units
    // Shifted towards negative Z so it projects inward.
    // Center Z position: -0.15 (wall is from -0.1 to 0.1, so it projects from 0.1 to -0.4)
    const ledgeW = 3.2;
    const ledgeH = 0.08;
    const ledgeD = 0.5;
    const ledgeZ = -0.15;
    const ledgeY = -h / 2 + border + ledgeH / 2; // Sitting just on top of the bottom frame rail

    const ledge = new Wall(gl, this.solidRes.program, this.solidRes.locs, frameColor);
    ledge.setParent(this);
    ledge.translate([0, ledgeY, ledgeZ]);
    ledge.scale([ledgeW, ledgeH, ledgeD]);
    this.solidMeshes.push(ledge);

    // --- Glass Pane ---
    // Semi-transparent blue glass
    const glassColor = [0.65, 0.85, 0.95, 0.20];
    const glass = new Wall(gl, this.solidRes.program, this.solidRes.locs, glassColor);
    glass.setParent(this);
    glass.translate([0, 0, 0]);
    // Sized to fit exactly inside the frame
    glass.scale([w - 2 * border, h - 2 * border, 0.02]);
    this.transparentMeshes.push(glass);

    // Apply materials
    this.solidMeshes.forEach(mesh => {
      mesh.shininess = 20.0;
      mesh.specularStrength = 0.3;
    });
    this.transparentMeshes.forEach(mesh => {
      mesh.shininess = 50.0;
      mesh.specularStrength = 0.8;
      mesh.twoSided = 1.0;
    });
  }

  draw(gl, viewProjection, pass = 'all') {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);

    if (pass === 'all' || pass === 'opaque') {
      this.solidMeshes.forEach(mesh => {
        mesh.draw(gl, viewProjection);
      });
    }

    if (pass === 'all' || pass === 'transparent') {
      this.transparentMeshes.forEach(mesh => {
        mesh.draw(gl, viewProjection);
      });
    }
  }
}
