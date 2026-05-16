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

  update(deltaTime, walls = []) {
    const moveSpeed = 5 * deltaTime;
    const forward = vec3.fromValues(Math.cos(this.yaw), 0, Math.sin(this.yaw));
    const right = vec3.fromValues(-Math.sin(this.yaw), 0, Math.cos(this.yaw));
    
    let moveDir = vec3.create();
    if (this.keys['w']) vec3.add(moveDir, moveDir, forward);
    if (this.keys['s']) vec3.subtract(moveDir, moveDir, forward);
    if (this.keys['a']) vec3.subtract(moveDir, moveDir, right);
    if (this.keys['d']) vec3.add(moveDir, moveDir, right);

    if (vec3.length(moveDir) > 0) {
      vec3.normalize(moveDir, moveDir);
      vec3.scale(moveDir, moveDir, moveSpeed);
      
      const playerRadius = 0.5;

      // Player Y-range (from feet to just above head)
      const pMinY = -2.0; 
      const pMaxY = 0.5;

      // Check X movement
      let nextX = this.position[0] + moveDir[0];
      let collisionX = false;
      for (const w of walls) {
        if (nextX + playerRadius > w.bounds.minX && nextX - playerRadius < w.bounds.maxX &&
            this.position[2] + playerRadius > w.bounds.minZ && this.position[2] - playerRadius < w.bounds.maxZ &&
            pMaxY > w.bounds.minY && pMinY < w.bounds.maxY) {
          collisionX = true;
          break;
        }
      }
      if (!collisionX) this.position[0] = nextX;

      // Check Z movement
      let nextZ = this.position[2] + moveDir[2];
      let collisionZ = false;
      for (const w of walls) {
        if (this.position[0] + playerRadius > w.bounds.minX && this.position[0] - playerRadius < w.bounds.maxX &&
            nextZ + playerRadius > w.bounds.minZ && nextZ - playerRadius < w.bounds.maxZ &&
            pMaxY > w.bounds.minY && pMinY < w.bounds.maxY) {
          collisionZ = true;
          break;
        }
      }
      if (!collisionZ) this.position[2] = nextZ;
    }
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
