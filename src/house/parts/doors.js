
class Door extends Node {
  constructor(gl, solidRes, texRes, type, woodTexture, screenMeshTexture, initialOpen = false) {
    super();
    this.type = type; // 'solid' or 'screen'
    this.woodTexture = woodTexture;
    this.screenMeshTexture = screenMeshTexture;
    this.solidRes = solidRes;
    this.texRes = texRes;
    this.screenMesh = null; // Stored separately for custom texturing

    // Door state variables
    this.isOpen = initialOpen;
    this.currentAngle = initialOpen ? Math.PI / 2 : 0.0;
    this.targetAngle = initialOpen ? Math.PI / 2 : 0.0;
    this.isLocked = false;
    this.lockedAnimTime = 0.0;
    
    // Physical dimensions
    this.width = 2.85;
    this.height = 3.9;
    this.thickness = 0.1;

    // Position of door relative to parent
    this.position = [0, 0, 0]; 
    this.rotationY = 0;

    // Create HingeNode at the local left edge (-W/2)
    this.hinge = new Node();
    this.hinge.setParent(this);
    this.hinge.translate([-this.width / 2, 0, 0]);

    // Create LeafNode centered on HingeNode but offset by +W/2 so it sits flush
    this.leaf = new Node();
    this.leaf.setParent(this.hinge);
    this.leaf.translate([this.width / 2, 0, 0]);

    // Sub-components arrays
    this.texturedMeshes = [];
    this.solidMeshes = [];

    // Knob base nodes and positions for rotation animation
    this.knobBaseF = null;
    this.knobBaseB = null;
    this.knobPosF = null;
    this.knobPosB = null;

    // Build the visual parts
    this.buildVisuals(gl);
  }

  // Set translation/rotation on the Door base node
  setTransform(pos, rotY) {
    this.position = pos;
    this.rotationY = rotY;
    this.localMatrix = mat4.create();
    mat4.translate(this.localMatrix, this.localMatrix, pos);
    mat4.rotate(this.localMatrix, this.localMatrix, rotY, [0, 1, 0]);
  }

  toggle() {
    if (this.isLocked) {
      this.lockedAnimTime = 0.4;
      return;
    }
    this.isOpen = !this.isOpen;
    // We swing inwards (positive 90 degrees / half Pi)
    this.targetAngle = this.isOpen ? Math.PI / 2 : 0.0;
  }

  update(deltaTime) {
    if (this.isLocked && this.lockedAnimTime > 0) {
      this.lockedAnimTime = Math.max(0.0, this.lockedAnimTime - deltaTime);
    }

    const swingSpeed = 4.0; // speed in rad/sec
    if (this.currentAngle < this.targetAngle) {
      this.currentAngle = Math.min(this.targetAngle, this.currentAngle + swingSpeed * deltaTime);
    } else if (this.currentAngle > this.targetAngle) {
      this.currentAngle = Math.max(this.targetAngle, this.currentAngle - swingSpeed * deltaTime);
    }

    // Apply rotation around Y axis to HingeNode relative to its left edge translation
    this.hinge.localMatrix = mat4.create();
    mat4.translate(this.hinge.localMatrix, this.hinge.localMatrix, [-this.width / 2, 0, 0]);
    mat4.rotate(this.hinge.localMatrix, this.hinge.localMatrix, this.currentAngle, [0, 1, 0]);

    // Animate doorknobs rotating during latch/unlatch sequence
    if (this.knobBaseF && this.knobBaseB && this.knobPosF && this.knobPosB) {
      let knobAngle = 0.0;
      if (this.isLocked && this.lockedAnimTime > 0) {
        const animDuration = 0.4;
        const progress = (animDuration - this.lockedAnimTime) / animDuration;
        knobAngle = Math.sin(progress * Math.PI) * 0.25;
      } else {
        const p = this.currentAngle / (Math.PI / 2);
        // Twist the knob by up to 45 degrees (0.8 rad) as the door unlatches, only when opening (this.isOpen is true)
        knobAngle = (this.isOpen && p < 0.5) ? Math.sin(p * Math.PI / 0.5) * 0.8 : 0.0;
      }

      this.knobBaseF.localMatrix = mat4.create();
      mat4.translate(this.knobBaseF.localMatrix, this.knobBaseF.localMatrix, this.knobPosF);
      mat4.rotate(this.knobBaseF.localMatrix, this.knobBaseF.localMatrix, knobAngle, [0, 0, 1]);

      this.knobBaseB.localMatrix = mat4.create();
      mat4.translate(this.knobBaseB.localMatrix, this.knobBaseB.localMatrix, this.knobPosB);
      mat4.rotate(this.knobBaseB.localMatrix, this.knobBaseB.localMatrix, -knobAngle, [0, 0, 1]);
    }
  }

  buildVisuals(gl) {
    const w = this.width;
    const h = this.height;
    const t = this.thickness;

    // --- STATIC OUTER DOOR FRAME (Anchored to Wall) ---
    // Frame color always matches the elegant wainscoting brown
    const frameColor = [139 / 255, 90 / 255, 43 / 255, 1.0]; // Rich wainscoting wood brown

    const wallT = 0.20;  // Matches wall thickness
    const jambW = 0.075; // Left/Right gap covers
    const frameH = 4.0;  // Doorway height

    // Left Jamb casing
    const leftJamb = new Wall(gl, this.solidRes.program, this.solidRes.locs, frameColor);
    leftJamb.setParent(this); // Stays static, parented to the base Door node
    leftJamb.translate([-1.5 + jambW / 2, 0, 0]);
    leftJamb.scale([jambW, frameH, wallT]);
    this.solidMeshes.push(leftJamb);

    // Right Jamb casing
    const rightJamb = new Wall(gl, this.solidRes.program, this.solidRes.locs, frameColor);
    rightJamb.setParent(this); // Stays static, parented to the base Door node
    rightJamb.translate([1.5 - jambW / 2, 0, 0]);
    rightJamb.scale([jambW, frameH, wallT]);
    this.solidMeshes.push(rightJamb);

    // Top Jamb casing (Header)
    const topJamb = new Wall(gl, this.solidRes.program, this.solidRes.locs, frameColor);
    topJamb.setParent(this); // Stays static, parented to the base Door node
    topJamb.translate([0, 2.0 - 0.05, 0]);
    topJamb.scale([3.0, 0.1, wallT]);
    this.solidMeshes.push(topJamb);

    // --- SWINGING DOOR LEAF ---
    if (this.type === 'solid') {
      // 1. SOLID OAK WOOD DOOR
      // A single unit cube scaled to cover the leaf and textured with the wood floor texture
      const doorLeaf = new Wall(gl, this.texRes.program, this.texRes.locs);
      doorLeaf.setParent(this.leaf);
      doorLeaf.scale([w, h, t]);
      // Apply texture scaling to tile nicely
      doorLeaf.uvScale = [w / 2.0, h / 2.0];
      doorLeaf.uvOffset = [0, 0];
      this.texturedMeshes.push(doorLeaf);

      // --- Elegant Brass/Gold Doorknob Assembly for Solid Door ---
      const knobColor = [0.85, 0.65, 0.12, 1.0]; // Elegant Brass/Gold color

      this.knobPosF = [w / 2 - 0.45, 0, t / 2];
      this.knobPosB = [w / 2 - 0.45, 0, -t / 2];

      this.knobBaseF = new Node();
      this.knobBaseF.setParent(this.leaf);
      this.knobBaseF.translate(this.knobPosF);

      this.knobBaseB = new Node();
      this.knobBaseB.setParent(this.leaf);
      this.knobBaseB.translate(this.knobPosB);

      // Front door knob shank (parented to rotating base)
      const shankF = new Wall(gl, this.solidRes.program, this.solidRes.locs, knobColor);
      shankF.setParent(this.knobBaseF);
      shankF.translate([0, 0, 0.03]);
      shankF.scale([0.06, 0.06, 0.08]);
      this.solidMeshes.push(shankF);

      // Front door knob (parented to rotating base)
      const knobF = new Wall(gl, this.solidRes.program, this.solidRes.locs, knobColor);
      knobF.setParent(this.knobBaseF);
      knobF.translate([0, 0, 0.07]);
      knobF.scale([0.12, 0.12, 0.08]);
      this.solidMeshes.push(knobF);

      // Back door knob shank (parented to rotating base)
      const shankB = new Wall(gl, this.solidRes.program, this.solidRes.locs, knobColor);
      shankB.setParent(this.knobBaseB);
      shankB.translate([0, 0, -0.03]);
      shankB.scale([0.06, 0.06, 0.08]);
      this.solidMeshes.push(shankB);

      // Back door knob (parented to rotating base)
      const knobB = new Wall(gl, this.solidRes.program, this.solidRes.locs, knobColor);
      knobB.setParent(this.knobBaseB);
      knobB.translate([0, 0, -0.07]);
      knobB.scale([0.12, 0.12, 0.08]);
      this.solidMeshes.push(knobB);

    } else {
      // 2. STYLIZED CARTOON OAK BROWN SCREEN DOOR (Matching Reference Image in Brown)
      const brownColor = [139 / 255, 90 / 255, 43 / 255, 1.0]; // Beautiful Oak Wood Brown
      const doorT = 0.10;

      // --- 2a. Bottom Solid Panel (approx. 42% of total height) ---
      const bottomH = 1.65; // Balanced wood panel height
      const bottomPanel = new Wall(gl, this.solidRes.program, this.solidRes.locs, brownColor);
      bottomPanel.setParent(this.leaf);
      bottomPanel.translate([0, -h / 2 + bottomH / 2, 0]); // Center at Y = -1.125
      bottomPanel.scale([w, bottomH, doorT]);  // Width=2.85, Height=1.65, Depth=0.1
      this.solidMeshes.push(bottomPanel);

      // --- 2b. Upper Window Frame ---
      const stileH = h - bottomH; // 2.25 units
      const stileY = -h / 2 + bottomH + stileH / 2; // Center at Y = 0.825
      
      // Left vertical frame stile
      const stileL = new Wall(gl, this.solidRes.program, this.solidRes.locs, brownColor);
      stileL.setParent(this.leaf);
      stileL.translate([-w / 2 + 0.15, stileY, 0]); 
      stileL.scale([0.3, stileH, doorT]);
      this.solidMeshes.push(stileL);

      // Right vertical frame stile
      const stileR = new Wall(gl, this.solidRes.program, this.solidRes.locs, brownColor);
      stileR.setParent(this.leaf);
      stileR.translate([w / 2 - 0.15, stileY, 0]); 
      stileR.scale([0.3, stileH, doorT]);
      this.solidMeshes.push(stileR);

      // Top horizontal frame rail
      const railTop = new Wall(gl, this.solidRes.program, this.solidRes.locs, brownColor);
      railTop.setParent(this.leaf);
      railTop.translate([0, h / 2 - 0.15, 0]); // Center at Y = 1.8
      railTop.scale([w, 0.3, doorT]);
      this.solidMeshes.push(railTop);

      // --- 2c. Screen Mesh (Perfect, balanced upper window) ---
      // A large semi-transparent screen mesh using the PNG texture
      this.screenMesh = new Wall(gl, this.texRes.program, this.texRes.locs);
      this.screenMesh.setParent(this.leaf);
      // Center it in the opening and push it slightly forward/backward to avoid Z-fighting
      const screenH = stileH - 0.15; // 2.10 units
      const screenY = stileY - 0.075; // 0.75 units
      this.screenMesh.translate([0, screenY, 0.001]); 
      // Make it slightly wider (w - 0.4 instead of w - 0.6) and taller to overlap the wooden frame borders and seal all gaps!
      this.screenMesh.scale([w - 0.4, screenH, 0.01]);
      // Sizing the texture repeat mapping to make the diamond grid look perfectly dense
      this.screenMesh.uvScale = [(w - 0.4) * 4.0, screenH * 4.0];
      this.screenMesh.uvOffset = [0, 0];

      // --- 2d. Yellow Doorknob Backplate & Keyhole (Raised comfortably on Solid Panel) ---
      const goldColor = [240 / 255, 205 / 255, 60 / 255, 1.0]; // Cartoon bright golden yellow
      const plateW = 0.18;
      const plateH = 0.45;
      const plateY = -0.65; // Higher position, perfectly nested within the solid wood panel!

      // Front Backplate
      const plateF = new Wall(gl, this.solidRes.program, this.solidRes.locs, goldColor);
      plateF.setParent(this.leaf);
      plateF.translate([w / 2 - 0.32, plateY, doorT / 2 + 0.005]);
      plateF.scale([plateW, plateH, 0.01]);
      this.solidMeshes.push(plateF);

      // Back Backplate
      const plateB = new Wall(gl, this.solidRes.program, this.solidRes.locs, goldColor);
      plateB.setParent(this.leaf);
      plateB.translate([w / 2 - 0.32, plateY, -(doorT / 2 + 0.005)]);
      plateB.scale([plateW, plateH, 0.01]);
      this.solidMeshes.push(plateB);

      // Black Keyhole silhouette (Front face)
      const keyholeF = new Wall(gl, this.solidRes.program, this.solidRes.locs, [0.08, 0.08, 0.08, 1.0]);
      keyholeF.setParent(this.leaf);
      keyholeF.translate([w / 2 - 0.32, plateY - 0.11, doorT / 2 + 0.012]);
      keyholeF.scale([0.035, 0.08, 0.005]);
      this.solidMeshes.push(keyholeF);

      // Black Keyhole silhouette (Back face)
      const keyholeB = new Wall(gl, this.solidRes.program, this.solidRes.locs, [0.08, 0.08, 0.08, 1.0]);
      keyholeB.setParent(this.leaf);
      keyholeB.translate([w / 2 - 0.32, plateY - 0.11, -(doorT / 2 + 0.012)]);
      keyholeB.scale([0.035, 0.08, 0.005]);
      this.solidMeshes.push(keyholeB);

      // --- 2e. Spherical Gold Doorknobs (Raised position) ---
      this.knobPosF = [w / 2 - 0.32, plateY + 0.07, doorT / 2];
      this.knobPosB = [w / 2 - 0.32, plateY + 0.07, -doorT / 2];

      this.knobBaseF = new Node();
      this.knobBaseF.setParent(this.leaf);
      this.knobBaseF.translate(this.knobPosF);

      this.knobBaseB = new Node();
      this.knobBaseB.setParent(this.leaf);
      this.knobBaseB.translate(this.knobPosB);

      // Front Golden Knob
      const knobF = new Wall(gl, this.solidRes.program, this.solidRes.locs, goldColor);
      knobF.setParent(this.knobBaseF);
      knobF.translate([0, 0, 0.07]);
      knobF.scale([0.15, 0.15, 0.15]); // Cute round spherical knob
      this.solidMeshes.push(knobF);

      // Back Golden Knob
      const knobB = new Wall(gl, this.solidRes.program, this.solidRes.locs, goldColor);
      knobB.setParent(this.knobBaseB);
      knobB.translate([0, 0, -0.07]);
      knobB.scale([0.15, 0.15, 0.15]);
      this.solidMeshes.push(knobB);
    }
  }

  getCollisionBounds(houseElevation) {
    const cx = this.position[0];
    const cy = this.position[1] + houseElevation;
    const cz = this.position[2];

    const theta = this.currentAngle;
    const rotY = this.rotationY;
    const w = this.width;
    const t = this.thickness;

    // Hinge local point [-w/2, 0, 0] transformed to parent space
    const x1 = cx - (w / 2) * Math.cos(rotY);
    const z1 = cz + (w / 2) * Math.sin(rotY);

    // Leaf end local point [-w/2 + w * cos(theta), 0, -w * sin(theta)] transformed to parent space
    const lx = -w / 2 + w * Math.cos(theta);
    const lz = -w * Math.sin(theta);
    const x2 = cx + lx * Math.cos(rotY) + lz * Math.sin(rotY);
    const z2 = cz - lx * Math.sin(rotY) + lz * Math.cos(rotY);

    // Bounds derived from the line segment (with thickness t)
    const minX = Math.min(x1, x2) - t / 2;
    const maxX = Math.max(x1, x2) + t / 2;
    const minZ = Math.min(z1, z2) - t / 2;
    const maxZ = Math.max(z1, z2) + t / 2;
    
    const minY = cy - this.height / 2;
    const maxY = cy + this.height / 2;

    return {
      minX,
      maxX,
      minY,
      maxY,
      minZ,
      maxZ
    };
  }

  draw(gl, viewProjection, pass = 'all') {
    this.updateWorldMatrix(this.parent ? this.parent.worldMatrix : null);

    if (pass === 'all' || pass === 'opaque') {
      // Render Textured parts (Solid Oak Door leaf)
      this.texturedMeshes.forEach(mesh => {
        mesh.draw(gl, viewProjection, this.woodTexture);
      });

      // Render Solid parts (Borders, Plate, Knobs)
      this.solidMeshes.forEach(mesh => {
        mesh.draw(gl, viewProjection);
      });
    }

    if (pass === 'all' || pass === 'transparent') {
      // Render Custom Screen Mesh (if present) using its transparent PNG texture
      if (this.screenMesh && this.screenMeshTexture) {
        this.screenMesh.draw(gl, viewProjection, this.screenMeshTexture);
      }
    }
  }
}
