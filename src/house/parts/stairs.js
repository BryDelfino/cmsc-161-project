class Stairs extends Node {
  constructor(gl, texRes, stepWidth, totalHeight, stepCount, stepDepth, backOverlap = 0.0) {
    super();
    this.steps = [];

    const stepHeight = totalHeight / stepCount; // 0.50 units per step for 3 steps
    const bottomY = -2.0 - totalHeight;        // ground level (-3.5 local to house)

    for (let i = 0; i < stepCount; i++) {
      const step = new Wall(gl, texRes.program, texRes.locs);
      step.setParent(this);
      step.shininess = 20.0;
      step.specularStrength = 0.3;

      // To fill the gaps on the side, we extend each step's height all the way down to bottomY
      // We offset the highest step (i === 0) by a tiny fraction (-0.01) to prevent Z-fighting with the deck/floor
      const topYOffset = (i === 0) ? -0.01 : 0.0;
      const topY = -2.0 - i * stepHeight + topYOffset; // -2.01 (Step 1), -2.5 (Step 2), -3.0 (Step 3)
      const h = topY - bottomY;                 // 1.49, 1.0, 0.5

      // Extend the highest step backwards if backOverlap is specified to fill any gaps under overhangs
      const currentDepth = (i === 0) ? (stepDepth + backOverlap) : stepDepth;

      let sZ;
      if (i === 0) {
        sZ = -backOverlap + currentDepth / 2; // Shift center forward by half of the added depth
      } else {
        sZ = i * stepDepth + stepDepth / 2;
      }

      const sY = bottomY + h / 2;               // -2.75, -3.0, -3.25

      step.translate([0, sY, sZ]);
      step.scale([stepWidth, h, currentDepth]);
      // Tile textures nicely based on step scale
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

  draw(gl, viewProjection, texture) {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);
    this.steps.forEach(step => {
      step.draw(gl, viewProjection, texture);
    });
  }
}

// Helper to generate sphere vertex attributes for WebGL (Position + UV + Normal format)
function createSphereGeometry(gl, radius, latitudeBands, longitudeBands) {
  const vertexData = [];
  const indexData = [];

  for (let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
    const theta = latNumber * Math.PI / latitudeBands;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
      const phi = longNumber * 2 * Math.PI / longitudeBands;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;
      const u = 1 - (longNumber / longitudeBands);
      const v = 1 - (latNumber / latitudeBands);

      // Stride: X, Y, Z, W, U, V, NX, NY, NZ
      vertexData.push(x * radius, y * radius, z * radius, 1.0, u, v, x, y, z);
    }
  }

  for (let latNumber = 0; latNumber < latitudeBands; latNumber++) {
    for (let longNumber = 0; longNumber < longitudeBands; longNumber++) {
      const first = (latNumber * (longitudeBands + 1)) + longNumber;
      const second = first + longitudeBands + 1;
      indexData.push(first, second, first + 1);
      indexData.push(second, second + 1, first + 1);
    }
  }

  const vbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

  const ibuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);

  return {
    vbuf: vbuf,
    ibuf: ibuf,
    count: indexData.length
  };
}

class Sphere extends Node {
  constructor(gl, program, locs, radius, latBands = 16, longBands = 16, color = [0.4, 0.25, 0.15, 1.0]) {
    super();
    this.program = program;
    this.locs = locs;
    this.color = color;
    this.mesh = createSphereGeometry(gl, radius, latBands, longBands);
    this.shininess = 1.0;
    this.specularStrength = 0.0;
    this.emissive = 0.0;
    this.twoSided = 0.0;
  }

  draw(gl, viewProjection, texture) {
    if (!this.program) return;
    gl.useProgram(this.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vbuf);
    gl.vertexAttribPointer(this.locs.pos, 4, gl.FLOAT, false, 36, 0);
    gl.enableVertexAttribArray(this.locs.pos);

    if (this.locs.uv !== undefined && this.locs.uv !== -1) {
      gl.vertexAttribPointer(this.locs.uv, 2, gl.FLOAT, false, 36, 16);
      gl.enableVertexAttribArray(this.locs.uv);
    }

    if (this.locs.normal !== undefined && this.locs.normal !== -1) {
      gl.vertexAttribPointer(this.locs.normal, 3, gl.FLOAT, false, 36, 24);
      gl.enableVertexAttribArray(this.locs.normal);
    }

    const mvp = mat4.multiply(mat4.create(), viewProjection, this.worldMatrix);
    gl.uniformMatrix4fv(this.locs.matrix, false, mvp);

    if (this.locs.worldMatrix) {
      gl.uniformMatrix4fv(this.locs.worldMatrix, false, this.worldMatrix);
    }
    if (this.locs.worldInverseTranspose) {
      const normalMatrix = mat4.create();
      mat4.invert(normalMatrix, this.worldMatrix);
      mat4.transpose(normalMatrix, normalMatrix);
      gl.uniformMatrix4fv(this.locs.worldInverseTranspose, false, normalMatrix);
    }
    if (this.locs.shininess) {
      gl.uniform1f(this.locs.shininess, this.shininess !== undefined ? this.shininess : 1.0);
    }
    if (this.locs.specularStrength) {
      gl.uniform1f(this.locs.specularStrength, this.specularStrength !== undefined ? this.specularStrength : 0.0);
    }
    if (this.locs.emissive) {
      gl.uniform1f(this.locs.emissive, this.emissive !== undefined ? this.emissive : 0.0);
    }
    if (this.locs.twoSided) {
      gl.uniform1f(this.locs.twoSided, this.twoSided !== undefined ? this.twoSided : 0.0);
    }

    if (this.locs.tex && texture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(this.locs.tex, 0);

      if (this.locs.uvScale) {
        gl.uniform2fv(this.locs.uvScale, [1.0, 1.0]);
      }
      if (this.locs.uvOffset) {
        gl.uniform2fv(this.locs.uvOffset, [0.0, 0.0]);
      }
    }

    if (this.locs.color) {
      gl.uniform4fv(this.locs.color, this.color);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.ibuf);
    gl.drawElements(gl.TRIANGLES, this.mesh.count, gl.UNSIGNED_SHORT, 0);
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
    const bottomY = -2.0; // Starts at floor level (-2.0 local to house)

    this.steps = [];  // risers (solid base blocks, used for collision and visuals)
    this.treads = []; // treads (visual only)
    this.sidePlates = []; // wallpapered side plates (stringer covering open side)
    this.posts = [];
    this.rail = null;
    this.newelPost = null;
    this.newelSphere = null;
    this.baseboards = []; // skirting lining segments

    // Solid minty green color: rgb(148, 196, 170)
    const greenColor = [148 / 255, 196 / 255, 170 / 255, 1.0];

    // --- 1. BUILD THE STEPS (Split into green solid treads and recessed solid green risers) ---
    const treadThickness = 0.05;
    const riserWidth = stepWidth - 0.2;     // Recessed inward by 0.1 on each side
    const riserDepth = stepDepth - 0.06;    // Recessed inward to leave a front overhang

    for (let i = 0; i < stepCount; i++) {
      const topY = bottomY + (i + 1) * stepHeight; // e.g. -1.5, -1.0, ..., 5.0
      const h = topY - bottomY;                   // Height from floor: 0.5, 1.0, ..., 7.0
      const sY = bottomY + h / 2;                 // Center Y position
      const sZ = i * stepDepth + stepDepth / 2;   // Center Z position

      // Riser Solid Block (Fully visual & walkable, solid green color, recessed inward)
      const riser = new Wall(gl, solidRes.program, solidRes.locs, greenColor);
      riser.setParent(this);
      riser.shininess = 20.0;
      riser.specularStrength = 0.3;
      riser.translate([0, sY, sZ - 0.03]); // Shifted slightly back for front nose overhang
      riser.scale([riserWidth, h, riserDepth]);
      this.steps.push(riser);

      // Side Riser Plate (Overlayed on the open side local X = stepWidth / 2 + 0.001 to show seamless wallpaper)
      // Standardizes the texture coordinates (U along Z, V along Y) to align perfectly with the background wallpaper.
      const sidePlate = new Wall(gl, texRes.program, texRes.locs);
      sidePlate.setParent(this);
      sidePlate.translate([stepWidth / 2 + 0.001, sY, sZ]);
      sidePlate.scale([0.01, h, stepDepth]);
      sidePlate.uvScale = [-stepDepth / 2.0, h / 2.0];
      sidePlate.uvOffset = [(9.5 - sZ) / 2.0, h / 4.0];
      this.sidePlates.push(sidePlate);

      // Tread (Visual only, sits on top, solid green color)
      const tread = new Wall(gl, solidRes.program, solidRes.locs, greenColor);
      tread.setParent(this);
      tread.shininess = 20.0;
      tread.specularStrength = 0.3;
      tread.translate([0, topY + treadThickness / 2, sZ]);
      tread.scale([stepWidth + 0.02, treadThickness, stepDepth + 0.02]); // slightly overhangs for realism!
      this.treads.push(tread);
    }

    // --- 2. NEWEL POST (Rectangular column + Sphere) ---
    const newelX = stepWidth / 2 - 0.15;
    const newelHeight = 2.2;
    const newelZ = stepDepth / 2;

    this.newelPost = new Wall(gl, solidRes.program, solidRes.locs, greenColor);
    this.newelPost.setParent(this);
    this.newelPost.shininess = 20.0;
    this.newelPost.specularStrength = 0.3;
    this.newelPost.translate([newelX, bottomY + newelHeight / 2, newelZ]);
    this.newelPost.scale([0.22, newelHeight, 0.22]);

    // Sphere on top of Newel Post
    this.newelSphere = new Sphere(gl, solidRes.program, solidRes.locs, 0.18, 16, 16, greenColor);
    this.newelSphere.setParent(this);
    this.newelSphere.shininess = 20.0;
    this.newelSphere.specularStrength = 0.3;
    this.newelSphere.translate([newelX, bottomY + newelHeight + 0.12, newelZ]);

    // --- 4. HANDRAIL CALCULATIONS ---
    const dy = (bottomY + totalHeight + 2.0) - (bottomY + newelHeight);
    const dz = length - newelZ;
    const slopeAngle = Math.atan2(dy, dz);
    const railLength = Math.sqrt(dy * dy + dz * dz);

    // --- 3. BALUSTERS (Vertical support posts on EVERY step) ---
    for (let i = 1; i < stepCount; i++) {
      const stepTopY = bottomY + (i + 1) * stepHeight;
      const stepZ = i * stepDepth + stepDepth / 2;

      const railY = (bottomY + newelHeight) + (stepZ - newelZ) * (dy / dz);
      const balusterHeight = railY - stepTopY;

      if (balusterHeight > 0.05) {
        const post = new Wall(gl, solidRes.program, solidRes.locs, greenColor);
        post.setParent(this);
        post.shininess = 20.0;
        post.specularStrength = 0.3;
        post.translate([newelX, stepTopY + balusterHeight / 2, stepZ]);
        post.scale([0.08, balusterHeight, 0.08]);
        this.posts.push(post);
      }
    }

    // --- 4. BUILD THE HANDRAIL ---
    this.rail = new Wall(gl, solidRes.program, solidRes.locs, greenColor);
    this.rail.setParent(this);
    this.rail.shininess = 20.0;
    this.rail.specularStrength = 0.3;

    const midY = (bottomY + newelHeight + bottomY + totalHeight + 2.0) / 2;
    const midZ = (newelZ + length) / 2;

    this.rail.localMatrix = mat4.create();
    mat4.translate(this.rail.localMatrix, this.rail.localMatrix, [newelX, midY, midZ]);
    mat4.rotateX(this.rail.localMatrix, this.rail.localMatrix, -slopeAngle);
    mat4.scale(this.rail.localMatrix, this.rail.localMatrix, [0.12, 0.08, railLength]);

    // --- 5. BASEBOARD / SKIRTING BOARD (Brown lining along floor at base of stairs side) ---
    const baseboardColor = [0.4, 0.25, 0.15, 1.0];

    // First step lining: Shorter height (0.35) so it stays below the first step tread
    const baseboard1 = new Wall(gl, solidRes.program, solidRes.locs, baseboardColor);
    baseboard1.setParent(this);
    baseboard1.shininess = 20.0;
    baseboard1.specularStrength = 0.3;
    baseboard1.translate([stepWidth / 2 - 0.05, bottomY + 0.175, stepDepth / 2]);
    baseboard1.scale([0.12, 0.72, stepDepth]);
    this.baseboards.push(baseboard1);

    // Remaining steps lining: Standard height (0.7)
    const baseboard2 = new Wall(gl, solidRes.program, solidRes.locs, baseboardColor);
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

  draw(gl, viewProjection, riserTexture) {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);

    // Draw solid green riser blocks
    this.steps.forEach(riser => {
      riser.draw(gl, viewProjection);
    });

    // Draw textured wallpaper side plates on the open side of the stairs
    this.sidePlates.forEach(plate => {
      plate.draw(gl, viewProjection, riserTexture);
    });

    // Draw treads using green color
    this.treads.forEach(tread => {
      tread.draw(gl, viewProjection);
    });

    // Draw solid green wooden structures
    this.newelPost.draw(gl, viewProjection);
    this.newelSphere.draw(gl, viewProjection);
    this.posts.forEach(p => p.draw(gl, viewProjection));
    this.rail.draw(gl, viewProjection);

    // Draw wainscoting brown baseboard lining along stairs base
    this.baseboards.forEach(b => b.draw(gl, viewProjection));
  }
}
