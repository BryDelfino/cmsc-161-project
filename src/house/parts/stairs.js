class Stairs extends Node {
  constructor(gl, texRes, stepWidth, totalHeight, stepCount, stepDepth, backOverlap = 0.0) {
    super();
    this.steps = [];

    const stepHeight = totalHeight / stepCount;
    const bottomY = -2.0 - totalHeight;

    for (let i = 0; i < stepCount; i++) {
      const step = new Cube(gl, texRes.program, texRes.locs);
      step.setParent(this);
      step.shininess = 20.0;
      step.specularStrength = 0.3;

      const topYOffset = (i === 0) ? -0.01 : 0.0;
      const topY = -2.0 - i * stepHeight + topYOffset;
      const h = topY - bottomY;
      const currentDepth = (i === 0) ? (stepDepth + backOverlap) : stepDepth;

      let sZ;
      if (i === 0) {
        sZ = -backOverlap + currentDepth / 2;
      } else {
        sZ = i * stepDepth + stepDepth / 2;
      }

      const sY = bottomY + h / 2;

      step.translate([0, sY, sZ]);
      step.scale([stepWidth, h, currentDepth]);
      step.uvScale = [stepWidth / 4.0, h / 4.0];
      this.steps.push(step);
    }
  }

  setTransform(pos, rotY) {
    this.position = pos;
    this.rotation = rotY;
    this.localMatrix = mat4.create();
    mat4.translate(this.localMatrix, this.localMatrix, pos);
    mat4.rotate(this.localMatrix, this.localMatrix, rotY, [0, 1, 0]);
  }

  draw(gl, viewProjection, texture, shadowProgramInfo) {
    if (texture && typeof texture === 'object' && texture.program && texture.locs) {
      shadowProgramInfo = texture;
      texture = null;
    }
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);
    this.steps.forEach(step => {
      step.draw(gl, viewProjection, texture, shadowProgramInfo);
    });
  }
}

class InteriorStairs extends Node {
  constructor(gl, solidRes, texRes, length = 8.5, stepWidth = 4.5, stepCount = 14) {
    super();

    this.length = length;
    this.stepWidth = stepWidth;
    this.stepCount = stepCount;
    this.position = [0, 0, 0];
    this.rotation = 0;

    const totalHeight = 7.0;
    const stepDepth = length / stepCount;
    const stepHeight = totalHeight / stepCount;
    const bottomY = -2.0;

    this.steps = [];
    this.treads = [];
    this.sidePlates = [];
    this.posts = [];
    this.rail = null;
    this.newelPost = null;
    this.newelSphere = null;
    this.baseboards = [];

    const greenColor = [148 / 255, 196 / 255, 170 / 255, 1.0];
    const treadThickness = 0.05;
    const riserWidth = stepWidth - 0.2;
    const riserDepth = stepDepth - 0.06;

    for (let i = 0; i < stepCount; i++) {
      const topY = bottomY + (i + 1) * stepHeight;
      const h = topY - bottomY;
      const sY = bottomY + h / 2;
      const sZ = i * stepDepth + stepDepth / 2;

      // Riser
      const riser = new Cube(gl, solidRes.program, solidRes.locs, greenColor);
      riser.setParent(this);
      riser.shininess = 20.0;
      riser.specularStrength = 0.3;
      riser.translate([0, sY, sZ - 0.03]);
      riser.scale([riserWidth, h, riserDepth]);
      this.steps.push(riser);

      // Side plate
      const sidePlate = new Cube(gl, texRes.program, texRes.locs);
      sidePlate.setParent(this);
      sidePlate.translate([stepWidth / 2 + 0.001, sY, sZ]);
      sidePlate.scale([0.01, h, stepDepth]);
      sidePlate.uvScale = [-stepDepth / 2.0, h / 2.0];
      sidePlate.uvOffset = [(9.5 - sZ) / 2.0, h / 4.0];
      this.sidePlates.push(sidePlate);

      // Tread
      const tread = new Cube(gl, solidRes.program, solidRes.locs, greenColor);
      tread.setParent(this);
      tread.shininess = 20.0;
      tread.specularStrength = 0.3;
      tread.translate([0, topY + treadThickness / 2, sZ]);
      tread.scale([stepWidth + 0.02, treadThickness, stepDepth + 0.02]);
      this.treads.push(tread);
    }

    // Newel Post
    const newelX = stepWidth / 2 - 0.15;
    const newelHeight = 2.2;
    const newelZ = stepDepth / 2;

    this.newelPost = new Cube(gl, solidRes.program, solidRes.locs, greenColor);
    this.newelPost.setParent(this);
    this.newelPost.shininess = 20.0;
    this.newelPost.specularStrength = 0.3;
    this.newelPost.translate([newelX, bottomY + newelHeight / 2, newelZ]);
    this.newelPost.scale([0.22, newelHeight, 0.22]);

    this.newelSphere = new Sphere(gl, solidRes.program, solidRes.locs, 0.18, 16, 16, greenColor);
    this.newelSphere.setParent(this);
    this.newelSphere.shininess = 20.0;
    this.newelSphere.specularStrength = 0.3;
    this.newelSphere.translate([newelX, bottomY + newelHeight + 0.12, newelZ]);

    // Handrail calculations
    const dy = (bottomY + totalHeight + 2.0) - (bottomY + newelHeight);
    const dz = length - newelZ;
    const slopeAngle = Math.atan2(dy, dz);
    const railLength = Math.sqrt(dy * dy + dz * dz);

    // Balusters
    for (let i = 1; i < stepCount; i++) {
      const stepTopY = bottomY + (i + 1) * stepHeight;
      const stepZ = i * stepDepth + stepDepth / 2;
      const railY = (bottomY + newelHeight) + (stepZ - newelZ) * (dy / dz);
      const balusterHeight = railY - stepTopY;

      if (balusterHeight > 0.05) {
        const post = new Cube(gl, solidRes.program, solidRes.locs, greenColor);
        post.setParent(this);
        post.shininess = 20.0;
        post.specularStrength = 0.3;
        post.translate([newelX, stepTopY + balusterHeight / 2, stepZ]);
        post.scale([0.08, balusterHeight, 0.08]);
        this.posts.push(post);
      }
    }

    // Handrail
    this.rail = new Cube(gl, solidRes.program, solidRes.locs, greenColor);
    this.rail.setParent(this);
    this.rail.shininess = 20.0;
    this.rail.specularStrength = 0.3;

    const midY = (bottomY + newelHeight + bottomY + totalHeight + 2.0) / 2;
    const midZ = (newelZ + length) / 2;

    this.rail.localMatrix = mat4.create();
    mat4.translate(this.rail.localMatrix, this.rail.localMatrix, [newelX, midY, midZ]);
    mat4.rotateX(this.rail.localMatrix, this.rail.localMatrix, -slopeAngle);
    mat4.scale(this.rail.localMatrix, this.rail.localMatrix, [0.12, 0.08, railLength]);

    // Baseboards
    const baseboardColor = [0.4, 0.25, 0.15, 1.0];

    const baseboard1 = new Cube(gl, solidRes.program, solidRes.locs, baseboardColor);
    baseboard1.setParent(this);
    baseboard1.shininess = 20.0;
    baseboard1.specularStrength = 0.3;
    baseboard1.translate([stepWidth / 2 - 0.05, bottomY + 0.175, stepDepth / 2]);
    baseboard1.scale([0.12, 0.72, stepDepth]);
    this.baseboards.push(baseboard1);

    const baseboard2 = new Cube(gl, solidRes.program, solidRes.locs, baseboardColor);
    baseboard2.setParent(this);
    baseboard2.shininess = 20.0;
    baseboard2.specularStrength = 0.3;
    const mainLength = length - stepDepth;
    baseboard2.translate([stepWidth / 2 + 0.01, bottomY + 0.35, stepDepth + mainLength / 2]);
    baseboard2.scale([0.05, 0.7, mainLength]);
    this.baseboards.push(baseboard2);
  }

  setTransform(pos, rotY) {
    this.position = pos;
    this.rotation = rotY;
    this.localMatrix = mat4.create();
    mat4.translate(this.localMatrix, this.localMatrix, pos);
    mat4.rotate(this.localMatrix, this.localMatrix, rotY, [0, 1, 0]);
  }

  getCollisionBounds(houseElevation) {
    const localX = this.stepWidth / 2 - 0.15;
    const bottomY = -2.0;
    const totalHeight = 7.0;
    const length = this.length;

    // Define AABB corners in local coordinates (covering the railing volume along the open side)
    const localCorners = [
      [localX - 0.15, bottomY, 0],
      [localX + 0.15, bottomY, 0],
      [localX - 0.15, bottomY, length],
      [localX + 0.15, bottomY, length],
      [localX - 0.15, bottomY + totalHeight + 2.0, 0],
      [localX + 0.15, bottomY + totalHeight + 2.0, 0],
      [localX - 0.15, bottomY + totalHeight + 2.0, length],
      [localX + 0.15, bottomY + totalHeight + 2.0, length],
    ];

    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const corner of localCorners) {
      // Rotate corner around Y axis
      const rx = corner[0] * cos + corner[2] * sin;
      const rz = -corner[0] * sin + corner[2] * cos;
      // Translate to world space (including house elevation)
      const wx = rx + this.position[0];
      const wy = corner[1] + this.position[1] + houseElevation;
      const wz = rz + this.position[2];

      minX = Math.min(minX, wx);
      maxX = Math.max(maxX, wx);
      minY = Math.min(minY, wy);
      maxY = Math.max(maxY, wy);
      minZ = Math.min(minZ, wz);
      maxZ = Math.max(maxZ, wz);
    }

    return { minX, maxX, minY, maxY, minZ, maxZ };
  }

  draw(gl, viewProjection, riserTexture, shadowProgramInfo) {
    if (riserTexture && typeof riserTexture === 'object' && riserTexture.program && riserTexture.locs) {
      shadowProgramInfo = riserTexture;
      riserTexture = null;
    }
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);

    // Draw solid green riser blocks
    this.steps.forEach(riser => {
      riser.draw(gl, viewProjection, null, shadowProgramInfo);
    });

    // Draw textured wallpaper side plates on the open side of the stairs
    this.sidePlates.forEach(plate => {
      plate.draw(gl, viewProjection, riserTexture, shadowProgramInfo);
    });

    // Draw treads using green color
    this.treads.forEach(tread => {
      tread.draw(gl, viewProjection, null, shadowProgramInfo);
    });

    // Draw solid green wooden structures
    this.newelPost.draw(gl, viewProjection, null, shadowProgramInfo);
    this.newelSphere.draw(gl, viewProjection, null, shadowProgramInfo);
    this.posts.forEach(p => p.draw(gl, viewProjection, null, shadowProgramInfo));
    this.rail.draw(gl, viewProjection, null, shadowProgramInfo);

    // Draw wainscoting brown baseboard lining along stairs base
    this.baseboards.forEach(b => b.draw(gl, viewProjection, null, shadowProgramInfo));
  }
}
