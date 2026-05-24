class Television extends Node {
  constructor(gl, solidRes, texRes) {
    super();
    this.gl = gl;

    // Cabinet
    this.cabinet = new Cube(gl, solidRes.program, solidRes.locs, [0.65, 0.45, 0.28, 1.0]);
    this.cabinet.setParent(this);
    this.cabinet.shininess = 20.0;
    this.cabinet.specularStrength = 0.3;
    this.cabinet.translate([0, 1.05, 0]);
    this.cabinet.scale([1.6, 1.3, 1.0]);

    // Screen
    this.screen = new Cube(gl, texRes.program, texRes.locs, [0.15, 0.15, 0.15, 1.0]);
    this.screen.setParent(this);
    this.screen.shininess = 30.0;
    this.screen.specularStrength = 0.5;
    this.screen.translate([-0.15, 1.1, 0.51]);
    this.screen.scale([1.0, 0.9, 0.02]);
    this.screen.emissive = 0.0;

    // Video playback setup
    this.video = document.createElement('video');
    this.video.src = '../assets/textures/courage.mp4';
    this.video.autoplay = false;
    this.video.loop = true;
    this.video.muted = true;
    this.video.crossOrigin = 'anonymous';

    this.videoTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const blackPixel = new Uint8Array([0, 0, 0, 255]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, blackPixel);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.blackTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.blackTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, blackPixel);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.screen.uvScale = [0.75, 1.0];
    this.screen.uvOffset = [0.125, 0.0];

    // Dial panel
    this.panel = new Cube(gl, solidRes.program, solidRes.locs, [0.25, 0.2, 0.15, 1.0]);
    this.panel.setParent(this);
    this.panel.translate([0.5, 1.1, 0.51]);
    this.panel.scale([0.25, 0.9, 0.02]);

    // Main knob
    this.mainKnob = new Cylinder(gl, solidRes.program, solidRes.locs, 0.06, 0.06, 0.04, 16, [0.4, 0.4, 0.4, 1.0]);
    this.mainKnob.setParent(this);
    this.mainKnob.shininess = 80.0;
    this.mainKnob.specularStrength = 1.0;
    this.mainKnob.translate([0.5, 1.4, 0.53]);
    this.mainKnob.rotate(Math.PI / 2, [1, 0, 0]);

    this.mainKnobHandle = new Cube(gl, solidRes.program, solidRes.locs, [0.75, 0.75, 0.75, 1.0]);
    this.mainKnobHandle.setParent(this.mainKnob);
    this.mainKnobHandle.shininess = 80.0;
    this.mainKnobHandle.specularStrength = 1.0;
    this.mainKnobHandle.translate([0, 0.03, 0]);
    this.mainKnobHandle.scale([0.02, 0.02, 0.10]);

    // Secondary knobs
    this.knob1 = new Cylinder(gl, solidRes.program, solidRes.locs, 0.035, 0.035, 0.03, 12, [0.6, 0.6, 0.6, 1.0]);
    this.knob1.setParent(this);
    this.knob1.shininess = 80.0;
    this.knob1.specularStrength = 1.0;
    this.knob1.translate([0.5, 1.22, 0.53]);
    this.knob1.rotate(Math.PI / 2, [1, 0, 0]);

    this.knob2 = new Cylinder(gl, solidRes.program, solidRes.locs, 0.035, 0.035, 0.03, 12, [0.6, 0.6, 0.6, 1.0]);
    this.knob2.setParent(this);
    this.knob2.shininess = 80.0;
    this.knob2.specularStrength = 1.0;
    this.knob2.translate([0.5, 1.05, 0.53]);
    this.knob2.rotate(Math.PI / 2, [1, 0, 0]);

    // CRT structures
    this.crtCone = new Cylinder(gl, solidRes.program, solidRes.locs, 0.35, 0.15, 0.4, 16, [0.35, 0.35, 0.35, 1.0]);
    this.crtCone.setParent(this);
    this.crtCone.shininess = 80.0;
    this.crtCone.specularStrength = 1.0;
    this.crtCone.translate([0, 1.0, -0.7]);
    this.crtCone.scale([1.5, 1.5, 1.5]);
    this.crtCone.rotate(Math.PI / 2, [1, 0, 0]);

    this.crtNeck = new Cylinder(gl, solidRes.program, solidRes.locs, 0.08, 0.08, 0.15, 12, [0.35, 0.35, 0.35, 1.0]);
    this.crtNeck.setParent(this.crtCone);
    this.crtNeck.shininess = 80.0;
    this.crtNeck.specularStrength = 1.0;
    this.crtNeck.translate([0, -0.275, 0]);
    this.crtNeck.scale([1.0, 1.0, 1.0]);

    // Grille
    this.grille = new Cube(gl, solidRes.program, solidRes.locs, [0.1, 0.1, 0.1, 1.0]);
    this.grille.setParent(this);
    this.grille.shininess = 80.0;
    this.grille.specularStrength = 1.0;
    this.grille.translate([0.5, 0.8, 0.53]);
    this.grille.scale([0.2, 0.2, 0.01]);

    // Antenna
    this.antennaBase = new Sphere(gl, solidRes.program, solidRes.locs, 0.08, 12, 12, [0.3, 0.3, 0.3, 1.0]);
    this.antennaBase.setParent(this);
    this.antennaBase.shininess = 80.0;
    this.antennaBase.specularStrength = 1.0;
    this.antennaBase.translate([0.0, 1.74, 0.0]);

    this.rodLeft = new Cylinder(gl, solidRes.program, solidRes.locs, 0.012, 0.012, 0.8, 8, [0.7, 0.7, 0.7, 1.0]);
    this.rodLeft.setParent(this);
    this.rodLeft.shininess = 80.0;
    this.rodLeft.specularStrength = 1.0;
    this.rodLeft.translate([-0.25, 2.05, 0.0]);
    this.rodLeft.rotate(Math.PI / 6, [0, 0, 1]);

    this.rodRight = new Cylinder(gl, solidRes.program, solidRes.locs, 0.012, 0.012, 0.8, 8, [0.7, 0.7, 0.7, 1.0]);
    this.rodRight.setParent(this);
    this.rodRight.shininess = 80.0;
    this.rodRight.specularStrength = 1.0;
    this.rodRight.translate([0.25, 2.05, 0.0]);
    this.rodRight.rotate(-Math.PI / 6, [0, 0, 1]);

    // Legs
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
      leg.shininess = 20.0;
      leg.specularStrength = 0.3;
      leg.translate(coord);
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
    if (this.screen) {
      this.screen.emissive = this.isOn ? 1.0 : 0.0;
    }
    if (this.isOn) {
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

    if (this.isOn && this.video && this.video.readyState >= this.video.HAVE_CURRENT_DATA) {
      const gl = this._glCache;
      if (gl) {
        gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
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
    this.localMatrix = mat4.create();
    mat4.translate(this.localMatrix, this.localMatrix, pos);
    mat4.rotate(this.localMatrix, this.localMatrix, rotY, [0, 1, 0]);
    this._glCache = this.gl;
    mat4.scale(this.localMatrix, this.localMatrix, [1, 1, 1]);
  }

  getCollisionBounds(houseElevation) {
    return computeAABBBounds(this.position, this.rotation, 0.8 * 0.4, 0.5 * 0.4, 1.7 * 0.4, houseElevation);
  }

  draw(gl, viewProjection, shadowProgramInfo) {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);
    this.cabinet.draw(gl, viewProjection, null, shadowProgramInfo);
    if (this.isOn && this.videoTexture) {
      this.screen.draw(gl, viewProjection, this.videoTexture, shadowProgramInfo);
    } else {
      this.screen.draw(gl, viewProjection, this.blackTexture, shadowProgramInfo);
    }
    this.panel.draw(gl, viewProjection, null, shadowProgramInfo);
    this.mainKnob.draw(gl, viewProjection, null, shadowProgramInfo);
    this.mainKnobHandle.draw(gl, viewProjection, null, shadowProgramInfo);
    this.knob1.draw(gl, viewProjection, null, shadowProgramInfo);
    this.knob2.draw(gl, viewProjection, null, shadowProgramInfo);
    this.crtCone.draw(gl, viewProjection, null, shadowProgramInfo);
    this.crtNeck.draw(gl, viewProjection, null, shadowProgramInfo);
    this.grille.draw(gl, viewProjection, null, shadowProgramInfo);
    this.antennaBase.draw(gl, viewProjection, null, shadowProgramInfo);
    this.rodLeft.draw(gl, viewProjection, null, shadowProgramInfo);
    this.rodRight.draw(gl, viewProjection, null, shadowProgramInfo);
    this.legs.forEach(leg => leg.draw(gl, viewProjection, null, shadowProgramInfo));
  }
}
