class Camera {
  constructor(canvas) {
    this.position = vec3.fromValues(0, 2, 5);
    this.yaw = -Math.PI * 1.5;
    this.pitch = 0;
    this.viewMatrix = mat4.create();
    this.projectionMatrix = mat4.create();
    this.keys = {};

    // Bind inputs
    window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);
    
    canvas.addEventListener('click', () => canvas.requestPointerLock());
    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === canvas) {
        const sensitivity = 0.001;
        this.yaw += e.movementX * sensitivity;
        this.pitch -= e.movementY * sensitivity;
        const halfPi = Math.PI / 2;
        this.pitch = Math.max(-halfPi + 0.05, Math.min(halfPi - 0.05, this.pitch));
      }
    });
  }

  getStandingHeight(x, z, walkableNodes) {
    let standingHeight = -2.0; // Default ground level

    const corners = [
      [-0.5, -0.5, -0.5],
      [ 0.5, -0.5, -0.5],
      [-0.5,  0.5, -0.5],
      [ 0.5,  0.5, -0.5],
      [-0.5, -0.5,  0.5],
      [ 0.5, -0.5,  0.5],
      [-0.5,  0.5,  0.5],
      [ 0.5,  0.5,  0.5]
    ];

    for (const node of walkableNodes) {
      if (!node.worldMatrix) continue;

      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;

      const m = node.worldMatrix;
      for (const c of corners) {
        const wx = m[0]*c[0] + m[4]*c[1] + m[8]*c[2] + m[12];
        const wy = m[1]*c[0] + m[5]*c[1] + m[9]*c[2] + m[13];
        const wz = m[2]*c[0] + m[6]*c[1] + m[10]*c[2] + m[14];

        if (wx < minX) minX = wx;
        if (wx > maxX) maxX = wx;
        if (wy < minY) minY = wy;
        if (wy > maxY) maxY = wy;
        if (wz < minZ) minZ = wz;
        if (wz > maxZ) maxZ = wz;
      }

      // Check if player's horizontal position is inside this node's AABB
      if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) {
        if (maxY > standingHeight) {
          standingHeight = maxY;
        }
      }
    }

    return standingHeight;
  }

  update(deltaTime, cubes = [], walkableNodes = []) {
    const moveSpeed = 5 * deltaTime;
    const forward = vec3.fromValues(Math.cos(this.yaw), 0, Math.sin(this.yaw));
    const right = vec3.fromValues(-Math.sin(this.yaw), 0, Math.cos(this.yaw));
    
    let moveDir = vec3.create();
    if (this.keys['w']) vec3.add(moveDir, moveDir, forward);
    if (this.keys['s']) vec3.subtract(moveDir, moveDir, forward);
    if (this.keys['a']) vec3.subtract(moveDir, moveDir, right);
    if (this.keys['d']) vec3.add(moveDir, moveDir, right);

    let nextX = this.position[0];
    let nextZ = this.position[2];

    if (vec3.length(moveDir) > 0) {
      vec3.normalize(moveDir, moveDir);
      vec3.scale(moveDir, moveDir, moveSpeed);
      
      const playerRadius = 0.5;
      const pMinY = this.position[1] - 2.5; 
      const pMaxY = this.position[1] + 0.2;

      // Check X movement
      let testX = this.position[0] + moveDir[0];
      let collisionX = false;
      for (const c of cubes) {
        if (testX + playerRadius > c.bounds.minX && testX - playerRadius < c.bounds.maxX &&
            this.position[2] + playerRadius > c.bounds.minZ && this.position[2] - playerRadius < c.bounds.maxZ &&
            pMaxY > c.bounds.minY && pMinY < c.bounds.maxY) {
          collisionX = true;
          break;
        }
      }
      if (!collisionX) nextX = testX;

      // Check Z movement
      let testZ = this.position[2] + moveDir[2];
      let collisionZ = false;
      for (const c of cubes) {
        if (this.position[0] + playerRadius > c.bounds.minX && this.position[0] - playerRadius < c.bounds.maxX &&
            testZ + playerRadius > c.bounds.minZ && testZ - playerRadius < c.bounds.maxZ &&
            pMaxY > c.bounds.minY && pMinY < c.bounds.maxY) {
          collisionZ = true;
          break;
        }
      }
      if (!collisionZ) nextZ = testZ;
    }

    this.position[0] = nextX;
    this.position[2] = nextZ;

    const standingHeight = this.getStandingHeight(this.position[0], this.position[2], walkableNodes);
    const targetY = standingHeight + 2.5;
    this.position[1] += (targetY - this.position[1]) * Math.min(1.0, 15.0 * deltaTime);
  }

  getProjectionMatrix(gl) {
    const aspect = gl.canvas.width / gl.canvas.height;
    mat4.perspective(this.projectionMatrix, Math.PI / 3, aspect, 0.1, 2000);
    return this.projectionMatrix;
  }

  getViewMatrix() {
    const front = vec3.fromValues(
      Math.cos(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.sin(this.yaw) * Math.cos(this.pitch)
    );
    const target = vec3.add(vec3.create(), this.position, front);
    mat4.lookAt(this.viewMatrix, this.position, target, [0, 1, 0]);
    return this.viewMatrix;
  }
}
