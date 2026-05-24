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
    const frameColor = [0.65, 0.45, 0.28, 1.0];
    const frameThickness = 0.22;
    const border = 0.1;

    // Outer Frame
    const leftFrame = new Cube(gl, this.solidRes.program, this.solidRes.locs, frameColor);
    leftFrame.setParent(this);
    leftFrame.translate([-w / 2 + border / 2, 0, 0]);
    leftFrame.scale([border, h, frameThickness]);
    this.solidMeshes.push(leftFrame);

    const rightFrame = new Cube(gl, this.solidRes.program, this.solidRes.locs, frameColor);
    rightFrame.setParent(this);
    rightFrame.translate([w / 2 - border / 2, 0, 0]);
    rightFrame.scale([border, h, frameThickness]);
    this.solidMeshes.push(rightFrame);

    const topFrame = new Cube(gl, this.solidRes.program, this.solidRes.locs, frameColor);
    topFrame.setParent(this);
    topFrame.translate([0, h / 2 - border / 2, 0]);
    topFrame.scale([w - 2 * border, border, frameThickness]);
    this.solidMeshes.push(topFrame);

    const bottomFrame = new Cube(gl, this.solidRes.program, this.solidRes.locs, frameColor);
    bottomFrame.setParent(this);
    bottomFrame.translate([0, -h / 2 + border / 2, 0]);
    bottomFrame.scale([w - 2 * border, border, frameThickness]);
    this.solidMeshes.push(bottomFrame);

    // Dividers
    const dividerW = 0.06;
    const dividerD = 0.05;

    const vertDivider = new Cube(gl, this.solidRes.program, this.solidRes.locs, frameColor);
    vertDivider.setParent(this);
    vertDivider.translate([0, 0, 0]);
    vertDivider.scale([dividerW, h - 2 * border, dividerD]);
    this.solidMeshes.push(vertDivider);

    const horizDivider = new Cube(gl, this.solidRes.program, this.solidRes.locs, frameColor);
    horizDivider.setParent(this);
    horizDivider.translate([0, 0, 0]);
    horizDivider.scale([w - 2 * border, dividerW, dividerD]);
    this.solidMeshes.push(horizDivider);

    // Ledge (projects inward)
    const ledgeW = 3.2;
    const ledgeH = 0.08;
    const ledgeD = 0.5;
    const ledgeZ = -0.15;
    const ledgeY = -h / 2 + border + ledgeH / 2;

    const ledge = new Cube(gl, this.solidRes.program, this.solidRes.locs, frameColor);
    ledge.setParent(this);
    ledge.translate([0, ledgeY, ledgeZ]);
    ledge.scale([ledgeW, ledgeH, ledgeD]);
    this.solidMeshes.push(ledge);

    // Glass Pane
    const glassColor = [0.65, 0.85, 0.95, 0.20];
    const glass = new Cube(gl, this.solidRes.program, this.solidRes.locs, glassColor);
    glass.setParent(this);
    glass.translate([0, 0, 0]);
    glass.scale([w - 2 * border, h - 2 * border, 0.02]);
    this.transparentMeshes.push(glass);

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

  draw(gl, viewProjection, pass = 'all', shadowProgramInfo) {
    if (pass && typeof pass === 'object') {
      shadowProgramInfo = pass;
      pass = 'all';
    }
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);

    if (pass === 'all' || pass === 'opaque') {
      this.solidMeshes.forEach(mesh => {
        mesh.draw(gl, viewProjection, null, shadowProgramInfo);
      });
    }

    if (pass === 'all' || pass === 'transparent') {
      this.transparentMeshes.forEach(mesh => {
        mesh.draw(gl, viewProjection, null, shadowProgramInfo);
      });
    }
  }
}
