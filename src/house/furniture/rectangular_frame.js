class RectangularPictureFrame extends Node {
  constructor(gl, solidRes) {
    super();
    this.gl = gl;
    this.solidRes = solidRes;
    this.meshes = [];

    const frameWidth = 3.5;
    const frameHeight = 1.8;
    const frameDepth = 0.15;
    const borderWidth = 0.15;

    const frameColor = [0.65, 0.45, 0.28, 1.0];
    const pictureColor = [169 / 255, 169 / 255, 169 / 255, 1.0];

    // Left border
    const leftBorder = new Cube(gl, solidRes.program, solidRes.locs, frameColor);
    leftBorder.setParent(this);
    leftBorder.translate([-frameWidth / 2 + borderWidth / 2, 0, frameDepth / 2]);
    leftBorder.scale([borderWidth, frameHeight, frameDepth]);
    this.meshes.push(leftBorder);

    // Right border
    const rightBorder = new Cube(gl, solidRes.program, solidRes.locs, frameColor);
    rightBorder.setParent(this);
    rightBorder.translate([frameWidth / 2 - borderWidth / 2, 0, frameDepth / 2]);
    rightBorder.scale([borderWidth, frameHeight, frameDepth]);
    this.meshes.push(rightBorder);

    // Top border
    const topBorder = new Cube(gl, solidRes.program, solidRes.locs, frameColor);
    topBorder.setParent(this);
    topBorder.translate([0, frameHeight / 2 - borderWidth / 2, frameDepth / 2]);
    topBorder.scale([frameWidth, borderWidth, frameDepth]);
    this.meshes.push(topBorder);

    // Bottom border
    const bottomBorder = new Cube(gl, solidRes.program, solidRes.locs, frameColor);
    bottomBorder.setParent(this);
    bottomBorder.translate([0, -frameHeight / 2 + borderWidth / 2, frameDepth / 2]);
    bottomBorder.scale([frameWidth, borderWidth, frameDepth]);
    this.meshes.push(bottomBorder);

    // Picture placeholder
    const pictureWidth = frameWidth - 2 * borderWidth;
    const pictureHeight = frameHeight - 2 * borderWidth;
    const picture = new Cube(gl, solidRes.program, solidRes.locs, pictureColor);
    picture.setParent(this);
    picture.translate([0, 0, frameDepth / 2 + 0.01]);
    picture.scale([pictureWidth, pictureHeight, 0.02]);
    this.meshes.push(picture);

    for (let i = 0; i < 4; i++) {
      this.meshes[i].shininess = 20.0;
      this.meshes[i].specularStrength = 0.3;
    }
  }

  setTransform(pos, rotY = 0) {
    this.localMatrix = mat4.create();
    mat4.translate(this.localMatrix, this.localMatrix, pos);
    mat4.rotate(this.localMatrix, this.localMatrix, rotY, [0, 1, 0]);
  }

  draw(gl, viewProjection, shadowProgramInfo) {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);
    this.meshes.forEach(mesh => {
      mesh.draw(gl, viewProjection, shadowProgramInfo);
    });
  }
}
