class RockingChair extends Node {
  constructor(gl, solidRes, woodColor = [0.65, 0.45, 0.28, 1.0]) {
    super();
    this.woodColor = woodColor;
    this.parts = [];

    // Rockers (runners): Two curved runners at the bottom of the legs
    // For each side (Left and Right at xOffset = -0.35 and 0.35), we make a 3-segment rocker.
    // The bottom of the middle rocker segment is at Y = 0.
    // Middle runner segment Y = 0.015, height = 0.03
    // Front/Back segments tilted up.
    const rockerXOffsets = [-0.35, 0.35];
    rockerXOffsets.forEach(xOffset => {
      // Middle runner segment
      const mid = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
      mid.setParent(this);
      mid.translate([xOffset, 0.015, 0]);
      mid.scale([0.06, 0.03, 0.6]);
      this.parts.push(mid);

      // Front tilted runner segment
      const front = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
      front.setParent(this);
      front.translate([xOffset, 0.045, 0.42]);
      front.rotate(0.15, [1, 0, 0]); // tilt up
      front.scale([0.06, 0.03, 0.3]);
      this.parts.push(front);

      // Back tilted runner segment
      const back = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
      back.setParent(this);
      back.translate([xOffset, 0.045, -0.42]);
      back.rotate(-0.15, [1, 0, 0]); // tilt up
      back.scale([0.06, 0.03, 0.3]);
      this.parts.push(back);
    });

    // Legs: 4 thin vertical posts starting from the rockers to the seat
    // Legs height = 0.4, centered at Y = 0.03 + 0.2 = 0.23
    const legPositions = [
      [-0.35, 0.23, 0.3],
      [0.35, 0.23, 0.3],
      [-0.35, 0.23, -0.3],
      [0.35, 0.23, -0.3]
    ];
    legPositions.forEach(pos => {
      // Cylinder class is loaded globally from television.js
      const leg = new Cylinder(gl, solidRes.program, solidRes.locs, 0.03, 0.03, 0.4, 8, woodColor);
      leg.setParent(this);
      leg.translate(pos);
      this.parts.push(leg);
    });

    // Seat: sits on top of legs (Y = 0.43 to 0.49, center at 0.46)
    const seat = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    seat.setParent(this);
    seat.translate([0, 0.46, 0]);
    seat.scale([0.9, 0.06, 0.9]);
    this.parts.push(seat);

    // Backrest top rail: Y = 0.46 + 0.7 + 0.03 = 1.19
    const topRail = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    topRail.setParent(this);
    topRail.translate([0, 1.19, -0.4]);
    topRail.scale([0.9, 0.06, 0.06]);
    this.parts.push(topRail);

    // Backrest side frame posts: Y = 0.46 to 1.19, height = 0.73, center Y = 0.825
    const leftPost = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    leftPost.setParent(this);
    leftPost.translate([-0.42, 0.825, -0.4]);
    leftPost.scale([0.04, 0.73, 0.04]);
    this.parts.push(leftPost);

    const rightPost = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    rightPost.setParent(this);
    rightPost.translate([0.42, 0.825, -0.4]);
    rightPost.scale([0.04, 0.73, 0.04]);
    this.parts.push(rightPost);

    // Horizontal bar covering the top portion of the backrest: height = 0.2, center Y = 1.06
    const horizBar = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    horizBar.setParent(this);
    horizBar.translate([0, 1.06, -0.4]);
    horizBar.scale([0.80, 0.5, 0.03]);
    this.parts.push(horizBar);

    // Armrests: Y = 0.46 + 0.3 = 0.76, extended to Z = -0.4 to connect to backrest side frame
    const armLeft = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    armLeft.setParent(this);
    armLeft.translate([-0.42, 0.76, 0.025]);
    armLeft.scale([0.06, 0.04, 0.85]);
    this.parts.push(armLeft);

    const armRight = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    armRight.setParent(this);
    armRight.translate([0.42, 0.76, 0.025]);
    armRight.scale([0.06, 0.04, 0.85]);
    this.parts.push(armRight);

    // Armrest vertical supports: Y = 0.46 + 0.15 = 0.61, height = 0.3
    const supportLeft = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    supportLeft.setParent(this);
    supportLeft.translate([-0.42, 0.61, 0.35]);
    supportLeft.scale([0.04, 0.3, 0.04]);
    this.parts.push(supportLeft);

    const supportRight = new Wall(gl, solidRes.program, solidRes.locs, woodColor);
    supportRight.setParent(this);
    supportRight.translate([0.42, 0.61, 0.35]);
    supportRight.scale([0.04, 0.3, 0.04]);
    this.parts.push(supportRight);

    // Apply wood material properties to all rocking chair parts
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
    // Total bounding box of the Rocking Chair (scaled by 1.8)
    const halfWidth = 0.48 * 1.8;
    const halfDepth = 0.58 * 1.8; // including rocker overhang
    const height = 1.25 * 1.8;

    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);

    const corners = [
      [-halfWidth, 0, -halfDepth],
      [halfWidth, 0, -halfDepth],
      [-halfWidth, 0, halfDepth],
      [halfWidth, 0, halfDepth],
      [-halfWidth, height, -halfDepth],
      [halfWidth, height, -halfDepth],
      [-halfWidth, height, halfDepth],
      [halfWidth, height, halfDepth]
    ];

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const c of corners) {
      const rx = c[0] * cos + c[2] * sin;
      const rz = -c[0] * sin + c[2] * cos;
      const wx = rx + this.position[0];
      const wy = c[1] + this.position[1] + houseElevation;
      const wz = rz + this.position[2];

      if (wx < minX) minX = wx;
      if (wx > maxX) maxX = wx;
      if (wy < minY) minY = wy;
      if (wy > maxY) maxY = wy;
      if (wz < minZ) minZ = wz;
      if (wz > maxZ) maxZ = wz;
    }

    return { minX, maxX, minY, maxY, minZ, maxZ };
  }

  draw(gl, viewProjection) {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);
    this.parts.forEach(part => part.draw(gl, viewProjection));
  }
}

class RedCouch extends Node {
  constructor(gl, solidRes) {
    super();
    this.parts = [];

    // Red cushions color
    const redColor = [0.8, 0.12, 0.12, 1.0];
    const woodColor = [0.3, 0.18, 0.08, 1.0];

    // Bottom of the legs will sit at local Y = 0.
    // Legs: height = 0.2, centered at Y = 0.1
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

    // Seat cushion: height = 0.35, sits directly on legs (Y = 0.2 to 0.55, center at 0.375)
    const seat = new Wall(gl, solidRes.program, solidRes.locs, redColor);
    seat.setParent(this);
    seat.translate([0, 0.375, 0]);
    seat.scale([0.8, 0.35, 0.8]);
    this.parts.push(seat);

    // Left armrest: Y = 0.2 to 0.7, height = 0.5, center at 0.45
    const armLeft = new Wall(gl, solidRes.program, solidRes.locs, redColor);
    armLeft.setParent(this);
    armLeft.translate([-0.46, 0.45, 0.02]);
    armLeft.scale([0.16, 0.5, 0.8]);
    this.parts.push(armLeft);

    // Right armrest: Y = 0.2 to 0.7, height = 0.5, center at 0.45
    const armRight = new Wall(gl, solidRes.program, solidRes.locs, redColor);
    armRight.setParent(this);
    armRight.translate([0.46, 0.45, 0.02]);
    armRight.scale([0.16, 0.5, 0.8]);
    this.parts.push(armRight);

    // White patches on the armrests (fabric protectors/caps)
    const whiteColor = [1.0, 1.0, 1.0, 1.0];

    const patchLeft = new Wall(gl, solidRes.program, solidRes.locs, whiteColor);
    patchLeft.setParent(this);
    patchLeft.translate([-0.46, 0.701, 0.05]);
    patchLeft.scale([0.162, 0.02, 0.3]);
    this.parts.push(patchLeft);

    const patchRight = new Wall(gl, solidRes.program, solidRes.locs, whiteColor);
    patchRight.setParent(this);
    patchRight.translate([0.46, 0.701, 0.05]);
    patchRight.scale([0.162, 0.02, 0.3]);
    this.parts.push(patchRight);

    // Backrest: Y = 0.2 to 0.9, height = 0.7, center at 0.55. Relocated back to Z = -0.32
    const back = new Wall(gl, solidRes.program, solidRes.locs, redColor);
    back.setParent(this);
    back.translate([0, 0.55, -0.32]);
    back.scale([0.8, 0.7, 0.22]);
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
    // Total bounding box of the Red Couch (scaled by 1.8)
    const halfWidth = 0.54 * 1.8; // includes armrest thickness
    const halfDepth = 0.45 * 1.8; // includes backrest thickness
    const height = 0.9 * 1.8;

    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);

    const corners = [
      [-halfWidth, 0, -halfDepth],
      [halfWidth, 0, -halfDepth],
      [-halfWidth, 0, halfDepth],
      [halfWidth, 0, halfDepth],
      [-halfWidth, height, -halfDepth],
      [halfWidth, height, -halfDepth],
      [-halfWidth, height, halfDepth],
      [halfWidth, height, halfDepth]
    ];

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const c of corners) {
      const rx = c[0] * cos + c[2] * sin;
      const rz = -c[0] * sin + c[2] * cos;
      const wx = rx + this.position[0];
      const wy = c[1] + this.position[1] + houseElevation;
      const wz = rz + this.position[2];

      if (wx < minX) minX = wx;
      if (wx > maxX) maxX = wx;
      if (wy < minY) minY = wy;
      if (wy > maxY) maxY = wy;
      if (wz < minZ) minZ = wz;
      if (wz > maxZ) maxZ = wz;
    }

    return { minX, maxX, minY, maxY, minZ, maxZ };
  }

  draw(gl, viewProjection) {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);
    this.parts.forEach(part => part.draw(gl, viewProjection));
  }
}
