// Cylinder shape geometry and node definitions
function createCylinderGeometry(gl, radiusTop, radiusBottom, height, radialSegments) {
  const vertexData = [];
  const indexData = [];

  // Generate side vertices
  for (let i = 0; i <= radialSegments; i++) {
    const angle = (i / radialSegments) * 2 * Math.PI;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const u = i / radialSegments;

    // Top vertex
    const xTop = cos * radiusTop;
    const zTop = sin * radiusTop;
    const yTop = height / 2;
    vertexData.push(xTop, yTop, zTop, 1.0, u, 1.0);

    // Bottom vertex
    const xBot = cos * radiusBottom;
    const zBot = sin * radiusBottom;
    const yBot = -height / 2;
    vertexData.push(xBot, yBot, zBot, 1.0, u, 0.0);
  }

  // Generate side indices
  for (let i = 0; i < radialSegments; i++) {
    const next = i + 1;
    const idxTopCurrent = i * 2;
    const idxBotCurrent = i * 2 + 1;
    const idxTopNext = next * 2;
    const idxBotNext = next * 2 + 1;

    // Triangle 1: TopCurrent -> BotCurrent -> BotNext
    indexData.push(idxTopCurrent, idxBotCurrent, idxBotNext);
    // Triangle 2: TopCurrent -> BotNext -> TopNext
    indexData.push(idxTopCurrent, idxBotNext, idxTopNext);
  }

  // Cap indices offsets
  const capStartIdx = vertexData.length / 6;

  // Top Cap Center
  vertexData.push(0, height / 2, 0, 1.0, 0.5, 0.5);
  // Top Cap perimeter
  for (let i = 0; i <= radialSegments; i++) {
    const angle = (i / radialSegments) * 2 * Math.PI;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const u = (cos + 1) / 2;
    const v = (sin + 1) / 2;
    vertexData.push(cos * radiusTop, height / 2, sin * radiusTop, 1.0, u, v);
  }
  // Top Cap Triangles
  const centerTopIdx = capStartIdx;
  for (let i = 0; i < radialSegments; i++) {
    indexData.push(centerTopIdx, centerTopIdx + 1 + i, centerTopIdx + 2 + i);
  }

  // Bottom Cap Center
  const botCapStartIdx = vertexData.length / 6;
  vertexData.push(0, -height / 2, 0, 1.0, 0.5, 0.5);
  // Bottom Cap perimeter
  for (let i = 0; i <= radialSegments; i++) {
    const angle = (i / radialSegments) * 2 * Math.PI;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const u = (cos + 1) / 2;
    const v = (sin + 1) / 2;
    vertexData.push(cos * radiusBottom, -height / 2, sin * radiusBottom, 1.0, u, v);
  }
  // Bottom Cap Triangles
  const centerBotIdx = botCapStartIdx;
  for (let i = 0; i < radialSegments; i++) {
    indexData.push(centerBotIdx, centerBotIdx + 2 + i, centerBotIdx + 1 + i);
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

// Cylinder object.
class Cylinder extends Node {
  constructor(gl, program, locs, radiusTop, radiusBottom, height, radialSegments = 16, color = [0.8, 0.7, 0.5, 1.0]) {
    super();
    this.program = program;
    this.locs = locs;
    this.color = color;
    this.mesh = createCylinderGeometry(gl, radiusTop, radiusBottom, height, radialSegments);
  }

  draw(gl, viewProjection, texture) {
    if (!this.program) return;
    gl.useProgram(this.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vbuf);
    gl.vertexAttribPointer(this.locs.pos, 4, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(this.locs.pos);

    if (this.locs.uv !== undefined && this.locs.uv !== -1) {
      gl.vertexAttribPointer(this.locs.uv, 2, gl.FLOAT, false, 24, 16);
      gl.enableVertexAttribArray(this.locs.uv);
    }

    const mvp = mat4.multiply(mat4.create(), viewProjection, this.worldMatrix);
    gl.uniformMatrix4fv(this.locs.matrix, false, mvp);

    if (this.locs.tex && texture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(this.locs.tex, 0);

      if (this.locs.uvScale) {
        const uvs = this.uvScale || [1.0, 1.0];
        gl.uniform2fv(this.locs.uvScale, uvs);
      }
      if (this.locs.uvOffset) {
        const uvo = this.uvOffset || [0.0, 0.0];
        gl.uniform2fv(this.locs.uvOffset, uvo);
      }
    }

    if (this.locs.color) {
      gl.uniform4fv(this.locs.color, this.color);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.ibuf);
    gl.drawElements(gl.TRIANGLES, this.mesh.count, gl.UNSIGNED_SHORT, 0);
  }
}

class Television extends Node {
  constructor(gl, solidRes, texRes) {
    super();
    // Store the WebGL context for later use (e.g., updating video texture)
    this.gl = gl;

    // Bottom of the legs will sit at local Y = 0.
    // Total height of legs = 0.4.
    // Cabinet is centered at Y = 0.4 + 0.65 = 1.05.
    this.cabinet = new Wall(gl, solidRes.program, solidRes.locs, [0.65, 0.45, 0.28, 1.0]);
    this.cabinet.setParent(this);
    this.cabinet.translate([0, 1.05, 0]);
    this.cabinet.scale([1.6, 1.3, 1.0]);

    // Screen: uses textured shader so we can display video frames
    this.screen = new Wall(gl, texRes.program, texRes.locs, [0.15, 0.15, 0.15, 1.0]);
    this.screen.setParent(this);
    this.screen.translate([-0.15, 1.1, 0.51]); // Shifted left to make room for knob/controls
    this.screen.scale([1.0, 0.9, 0.02]);
    // Create hidden video element for playback
    this.video = document.createElement('video');
    this.video.src = '../assets/textures/courage.mp4';
    this.video.autoplay = false;
    this.video.loop = true;
    this.video.muted = false;
    this.video.crossOrigin = 'anonymous';
    // Create texture to hold video frames
    this.videoTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // Initialize with a single black pixel
    const blackPixel = new Uint8Array([0, 0, 0, 255]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, blackPixel);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // Create a static 1x1 black texture for the off state
    this.blackTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.blackTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, blackPixel);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // Stretch horizontally to crop pillarbox bars (4:3 content in 16:9 frame)
    this.screen.uvScale = [0.75, 1.0];
    this.screen.uvOffset = [0.125, 0.0];

    // Dial panel background (recessed/different color)
    this.panel = new Wall(gl, solidRes.program, solidRes.locs, [0.25, 0.2, 0.15, 1.0]);
    this.panel.setParent(this);
    this.panel.translate([0.5, 1.1, 0.51]);
    this.panel.scale([0.25, 0.9, 0.02]);

    // Main Knob: bigger knob with a handle
    this.mainKnob = new Cylinder(gl, solidRes.program, solidRes.locs, 0.06, 0.06, 0.04, 16, [0.4, 0.4, 0.4, 1.0]);
    this.mainKnob.setParent(this);
    this.mainKnob.translate([0.5, 1.4, 0.53]);
    this.mainKnob.rotate(Math.PI / 2, [1, 0, 0]); // rotate to face forward

    this.mainKnobHandle = new Wall(gl, solidRes.program, solidRes.locs, [0.75, 0.75, 0.75, 1.0]);
    this.mainKnobHandle.setParent(this.mainKnob);
    this.mainKnobHandle.translate([0, 0.03, 0]); // bottom of handle is on top cap
    this.mainKnobHandle.scale([0.02, 0.02, 0.10]); // rectangular bar across face

    // Buttons (formerly knobs): Two smaller round buttons
    this.knob1 = new Cylinder(gl, solidRes.program, solidRes.locs, 0.035, 0.035, 0.03, 12, [0.6, 0.6, 0.6, 1.0]);
    this.knob1.setParent(this);
    this.knob1.translate([0.5, 1.22, 0.53]);
    this.knob1.rotate(Math.PI / 2, [1, 0, 0]);

    this.knob2 = new Cylinder(gl, solidRes.program, solidRes.locs, 0.035, 0.035, 0.03, 12, [0.6, 0.6, 0.6, 1.0]);
    this.knob2.setParent(this);
    this.knob2.translate([0.5, 1.05, 0.53]);
    this.knob2.rotate(Math.PI / 2, [1, 0, 0]);

    // CRT Back Cone & Neck
    this.crtCone = new Cylinder(gl, solidRes.program, solidRes.locs, 0.35, 0.15, 0.4, 16, [0.35, 0.35, 0.35, 1.0]);
    this.crtCone.setParent(this);
    this.crtCone.translate([0, 1.0, -0.7]);
    this.crtCone.scale([1.5, 1.5, 1.5]);
    this.crtCone.rotate(Math.PI / 2, [1, 0, 0]);

    this.crtNeck = new Cylinder(gl, solidRes.program, solidRes.locs, 0.08, 0.08, 0.15, 12, [0.35, 0.35, 0.35, 1.0]);
    this.crtNeck.setParent(this.crtCone);
    this.crtNeck.translate([0, -0.275, 0]);
    this.crtNeck.scale([1.0, 1.0, 1.0]);
    this.crtNeck.rotate(0, [1, 0, 0]);

    // Speaker grille: horizontal bars
    this.grille = new Wall(gl, solidRes.program, solidRes.locs, [0.1, 0.1, 0.1, 1.0]);
    this.grille.setParent(this);
    this.grille.translate([0.5, 0.8, 0.53]);
    this.grille.scale([0.2, 0.2, 0.01]);

    // Antenna base
    this.antennaBase = new Sphere(gl, solidRes.program, solidRes.locs, 0.08, 12, 12, [0.3, 0.3, 0.3, 1.0]);
    this.antennaBase.setParent(this);
    this.antennaBase.translate([0.0, 1.74, 0.0]);

    // Antenna rods (V-shape)
    this.rodLeft = new Cylinder(gl, solidRes.program, solidRes.locs, 0.012, 0.012, 0.8, 8, [0.7, 0.7, 0.7, 1.0]);
    this.rodLeft.setParent(this);
    this.rodLeft.translate([-0.25, 2.05, 0.0]);
    this.rodLeft.rotate(Math.PI / 6, [0, 0, 1]); // Tilt left

    this.rodRight = new Cylinder(gl, solidRes.program, solidRes.locs, 0.012, 0.012, 0.8, 8, [0.7, 0.7, 0.7, 1.0]);
    this.rodRight.setParent(this);
    this.rodRight.translate([0.25, 2.05, 0.0]);
    this.rodRight.rotate(-Math.PI / 6, [0, 0, 1]); // Tilt right

    // Legs: Four legs starting at Y = 0 to Y = 0.4
    this.legs = [];
    const legCoords = [
      [-0.6, 0.2, 0.35],
      [0.6, 0.2, 0.35],
      [-0.6, 0.2, -0.35],
      [0.6, 0.2, -0.35]
    ];
    legCoords.forEach((coord) => {
      const leg = new Cylinder(gl, solidRes.program, solidRes.locs, 0.04, 0.02, 0.4, 8, [0.55, 0.38, 0.23, 1.0]);
      leg.setParent(this);
      leg.translate(coord);
      // Angle them outward slightly
      const rotZ = coord[0] < 0 ? -0.15 : 0.15;
      const rotX = coord[2] < 0 ? -0.15 : 0.15;
      leg.rotate(rotZ, [0, 0, 1]);
      leg.rotate(rotX, [1, 0, 0]);
      this.legs.push(leg);
    });

    this.isOn = false;
    this.buttonPushTimer = 0.0;
    this.buttonPushDuration = 0.25;
    this.scale([0.4, 0.4, 0.4]);
  }

  toggle() {
    this.isOn = !this.isOn;
    this.buttonPushTimer = this.buttonPushDuration;
    this.updateVisuals();
    console.log("Television toggled:", this.isOn ? "ON" : "OFF");
  }

  updateVisuals() {
    if (this.isOn) {
      // Start video playback when TV turns on
      if (this.video && this.video.paused) {
        this.video.play();
      }
    } else {
      if (this.video && !this.video.paused) {
        this.video.pause();
        this.video.currentTime = 0;
      }
    }
  }

  update(deltaTime) {
    if (this.buttonPushTimer > 0) {
      this.buttonPushTimer = Math.max(0.0, this.buttonPushTimer - deltaTime);
    }

    // Update video texture each frame when TV is on
    if (this.isOn && this.video && this.video.readyState >= this.video.HAVE_CURRENT_DATA) {
      const gl = this._glCache;
      if (gl) {
        gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
        // Flip Y so the video is right-side up
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.bindTexture(gl.TEXTURE_2D, null);
      }
    }

    if (this.knob1) {
      const pushDepth = 0.025 * Math.sin((this.buttonPushTimer / this.buttonPushDuration) * Math.PI);
      this.knob1.localMatrix = mat4.create();
      mat4.translate(this.knob1.localMatrix, this.knob1.localMatrix, [0.5, 1.22, 0.53 - pushDepth]);
      mat4.rotateX(this.knob1.localMatrix, this.knob1.localMatrix, Math.PI / 2);
    }
  }

  setTransform(pos, rotY) {
    this.position = pos;
    this.rotation = rotY;
    // Ensure local matrix is reset for each transform
    this.localMatrix = mat4.create();
    mat4.translate(this.localMatrix, this.localMatrix, pos);
    mat4.rotate(this.localMatrix, this.localMatrix, rotY, [0, 1, 0]);
    // Cache gl context for video texture updates
    this._glCache = this.gl;
    mat4.scale(this.localMatrix, this.localMatrix, [1, 1, 1]);
  }

  getCollisionBounds(houseElevation) {
    // Total bounding box of the TV setup (scaled by 0.4)
    const halfWidth = 0.8 * 0.4;
    const halfDepth = 0.5 * 0.4;
    const height = 1.7 * 0.4;
    // excluding antenna rods to let player look above it if needed

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
    this.cabinet.draw(gl, viewProjection);
    // Draw screen with video texture when on, black texture when off
    if (this.isOn && this.videoTexture) {
      this.screen.draw(gl, viewProjection, this.videoTexture);
    } else {
      this.screen.draw(gl, viewProjection, this.blackTexture);
    }
    this.panel.draw(gl, viewProjection);
    this.mainKnob.draw(gl, viewProjection);
    this.mainKnobHandle.draw(gl, viewProjection);
    this.knob1.draw(gl, viewProjection);
    this.knob2.draw(gl, viewProjection);
    this.crtCone.draw(gl, viewProjection);
    this.crtNeck.draw(gl, viewProjection);
    this.grille.draw(gl, viewProjection);
    this.antennaBase.draw(gl, viewProjection);
    this.rodLeft.draw(gl, viewProjection);
    this.rodRight.draw(gl, viewProjection);
    this.legs.forEach(leg => leg.draw(gl, viewProjection));
  }
}
