class Camera {
  constructor(canvas) {
    this.position = vec3.fromValues(0, 0, 5);
    this.yaw = -Math.PI / 2;
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

  update(deltaTime) {
    const moveSpeed = 5 * deltaTime;
    const forward = vec3.fromValues(Math.cos(this.yaw), 0, Math.sin(this.yaw));
    const right = vec3.fromValues(-Math.sin(this.yaw), 0, Math.cos(this.yaw));
    
    if (this.keys['w']) vec3.scaleAndAdd(this.position, this.position, forward, moveSpeed);
    if (this.keys['s']) vec3.scaleAndAdd(this.position, this.position, forward, -moveSpeed);
    if (this.keys['a']) vec3.scaleAndAdd(this.position, this.position, right, -moveSpeed);
    if (this.keys['d']) vec3.scaleAndAdd(this.position, this.position, right, moveSpeed);
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
