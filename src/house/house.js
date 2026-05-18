class House extends Node {
  constructor(gl, solidRes, texRes, wallTextures) {
    super();
    this.walls = [];
    this.visualTexturedWalls = [];
    this.visualSolidWalls = [];
    this.wallTextures = wallTextures;
    this.floorTexture = wallTextures.floor;
    this.elevation = 1.5;
    this.translate([0, this.elevation, 0]);

    const outsideScale = 2.0;     // Wooden exterior
    const floorScale = 2.0;       // Wooden floor boards
    const livingRoomScale = 2.0;  // Living room wallpaper
    const kitchenScale = 3.0;     // Kitchen wallpaper
    const diningScale = 3.0;      // Dining room wallpaper 

    // Helper to determine the room texture based on the Z position
    const getRoomTexture = (z) => {
      if (z < -5) return this.wallTextures.kitchen;
      if (z < 3) return this.wallTextures.dining;
      return this.wallTextures.livingRoom;
    };

    // Helper to determine custom UV scaling divisor based on texture
    const getScaleForTexture = (tex) => {
      if (tex === this.wallTextures.kitchen) return kitchenScale;
      if (tex === this.wallTextures.dining) return diningScale;
      if (tex === this.wallTextures.outside) return outsideScale;
      return livingRoomScale;
    };

    const wallConfig = [
      // --- EXTERIOR WALLS (Textured) ---
      // --- North Wall (Z = -13) ---
      { pos: [-12, 0, -13], scale: [2, 7, 0.2], tex: true },
      { pos: [-9.5, 4, -13], scale: [3, 3, 0.2], tex: true },
      { pos: [2.5, 0, -13], scale: [21, 7, 0.2], tex: true },

      // --- South Wall (Z = 13) ---
      { pos: [-10.25, 0, 13], scale: [5.5, 7, 0.2], tex: true },
      { pos: [-6, 0, 13], scale: [3, 1, 0.2], tex: true },
      { pos: [-6, 4, 13], scale: [3, 3, 0.2], tex: true },
      { pos: [-3, 0, 13], scale: [3, 7, 0.2], tex: true },
      { pos: [0, 4, 13], scale: [3, 3, 0.2], tex: true },
      { pos: [3, 0, 13], scale: [3, 7, 0.2], tex: true },
      { pos: [6, 0, 13], scale: [3, 1, 0.2], tex: true },
      { pos: [6, 4, 13], scale: [3, 3, 0.2], tex: true },
      { pos: [10.25, 0, 13], scale: [5.5, 7, 0.2], tex: true },

      // --- East Wall (X = 13, Split by Room Zones) ---
      { pos: [13, 0, -11.75], scale: [0.2, 7, 2.5], tex: true }, // Kitchen Corner
      { pos: [13, 0, -9], scale: [0.2, 1, 3], tex: true }, // Kitchen Window Sill
      { pos: [13, 4, -9], scale: [0.2, 3, 3], tex: true }, // Kitchen Window Header
      { pos: [13, 0, -6.25], scale: [0.2, 7, 2.5], tex: true }, // Kitchen Remaining Wall
      { pos: [13, 0, -1], scale: [0.2, 7, 8], tex: true }, // Dining Room Wall Segment
      { pos: [13, 0, 8], scale: [0.2, 7, 10], tex: true }, // Living Room Wall Segment

      // --- West Wall (X = -13, Split by Room Zones) ---
      { pos: [-13, 0, -11.75], scale: [0.2, 7, 2.5], tex: true }, // Kitchen Corner
      { pos: [-13, 0, -9], scale: [0.2, 1, 3], tex: true }, // Kitchen Window Sill
      { pos: [-13, 4, -9], scale: [0.2, 3, 3], tex: true }, // Kitchen Window Header
      { pos: [-13, 0, -6.25], scale: [0.2, 7, 2.5], tex: true }, // Kitchen Remaining Wall
      { pos: [-13, 0, -1], scale: [0.2, 7, 8], tex: true }, // Dining Room Wall Segment
      { pos: [-13, 0, 4.75], scale: [0.2, 7, 3.5], tex: true }, // Living Room Corner Wall
      { pos: [-13, 0, 8], scale: [0.2, 1, 3], tex: true }, // Living Room Window Sill     
      { pos: [-13, 4, 8], scale: [0.2, 3, 3], tex: true }, // Living Room Window Header
      { pos: [-13, 0, 11.25], scale: [0.2, 7, 3.5], tex: true }, // Living Room South Corner

      // --- Living Room Divider (Doorway on Left) ---
      { pos: [-12, 0, 3], scale: [0.2, 7, 2], rot: Math.PI / 2, color: [0.9, 0.8, 0.7, 1.0] },
      { pos: [-9.5, 4, 3], scale: [0.2, 3, 3], rot: Math.PI / 2, color: [0.9, 0.8, 0.7, 1.0] },
      { pos: [2.5, 0, 3], scale: [0.2, 7, 21], rot: Math.PI / 2, color: [0.9, 0.8, 0.7, 1.0] },

      // --- Dining/Kitchen Divider (Solid + Doorway on Left) ---
      { pos: [-12, 0, -5], scale: [0.2, 7, 2], rot: Math.PI / 2, color: [0.7, 0.8, 0.9, 1.0] },
      { pos: [-9.5, 4, -5], scale: [0.2, 3, 3], rot: Math.PI / 2, color: [0.7, 0.8, 0.9, 1.0] },
      { pos: [2.5, 0, -5], scale: [0.2, 7, 21], rot: Math.PI / 2, color: [0.7, 0.8, 0.9, 1.0] },
    ];

    wallConfig.forEach(cfg => {
      // 1. Create collision wall (invisible, 0.2 thick) for camera boundaries
      const collisionProg = cfg.tex ? texRes.program : solidRes.program;
      const collisionLocs = cfg.tex ? texRes.locs : solidRes.locs;

      const w = new Wall(gl, collisionProg, collisionLocs, cfg.color);
      w.setParent(this);
      w.translate([cfg.pos[0], -2 + cfg.scale[1] / 2 + cfg.pos[1], cfg.pos[2]]);
      if (cfg.rot) w.rotate(cfg.rot, [0, 1, 0]);
      w.scale(cfg.scale);

      const yCenter = -2 + cfg.scale[1] / 2 + cfg.pos[1] + this.elevation;
      w.bounds = {
        minX: cfg.pos[0] - (cfg.rot ? cfg.scale[2] : cfg.scale[0]) / 2,
        maxX: cfg.pos[0] + (cfg.rot ? cfg.scale[2] : cfg.scale[0]) / 2,
        minY: yCenter - cfg.scale[1] / 2,
        maxY: yCenter + cfg.scale[1] / 2,
        minZ: cfg.pos[2] - (cfg.rot ? cfg.scale[0] : cfg.scale[2]) / 2,
        maxZ: cfg.pos[2] + (cfg.rot ? cfg.scale[0] : cfg.scale[2]) / 2,
      };
      this.walls.push(w);

      // 2. Create visual split walls with wainscoting brown strips
      const visualParent = new Node();
      visualParent.setParent(this);
      visualParent.translate([cfg.pos[0], -2 + cfg.scale[1] / 2 + cfg.pos[1], cfg.pos[2]]);
      if (cfg.rot) visualParent.rotate(cfg.rot, [0, 1, 0]);

      // Sits on floor if starting elevation pos[1] is 0 or undefined
      const sitsOnFloor = cfg.pos[1] === undefined || cfg.pos[1] === 0;
      const startingY = cfg.pos[1] === undefined ? 0.0 : cfg.pos[1];

      if (cfg.rot) {
        // --- INTERIOR ROOM DIVIDER ---
        // South side (local +X) and North side (local -X)
        const northTex = cfg.pos[2] === -5 ? this.wallTextures.dining : this.wallTextures.livingRoom;
        const southTex = cfg.pos[2] === -5 ? this.wallTextures.kitchen : this.wallTextures.dining;
        const leftX = cfg.pos[0] - cfg.scale[2] / 2;

        const northScale = getScaleForTexture(northTex);
        const southScale = getScaleForTexture(southTex);

        // North-Facing Inner Wall (Dining or Kitchen)
        const northWall = new Wall(gl, texRes.program, texRes.locs);
        northWall.setParent(visualParent);
        northWall.translate([-0.05, 0, 0]);
        northWall.scale([0.1, cfg.scale[1], cfg.scale[2]]);
        northWall.uvScale = [cfg.scale[2] / northScale, cfg.scale[1] / northScale];
        northWall.uvOffset = [leftX / northScale, startingY / northScale];
        this.visualTexturedWalls.push({ wall: northWall, texture: northTex });

        // North-Facing Baseboard (Only for floor-sitting walls!)
        if (sitsOnFloor) {
          const northBase = new Wall(gl, solidRes.program, solidRes.locs, [0.4, 0.25, 0.15, 1.0]);
          northBase.setParent(visualParent);
          northBase.translate([-0.051, -cfg.scale[1] / 2 + 0.35, 0]);
          northBase.scale([0.11, 0.7, cfg.scale[2]]);
          this.visualSolidWalls.push(northBase);
        }

        // South-Facing Inner Wall (Dining or Living Room)
        const southWall = new Wall(gl, texRes.program, texRes.locs);
        southWall.setParent(visualParent);
        southWall.translate([0.05, 0, 0]);
        southWall.scale([0.1, cfg.scale[1], cfg.scale[2]]);
        southWall.uvScale = [cfg.scale[2] / southScale, cfg.scale[1] / southScale];
        southWall.uvOffset = [leftX / southScale, startingY / southScale];
        this.visualTexturedWalls.push({ wall: southWall, texture: southTex });

        // South-Facing Baseboard (Only for floor-sitting walls!)
        if (sitsOnFloor) {
          const southBase = new Wall(gl, solidRes.program, solidRes.locs, [0.4, 0.25, 0.15, 1.0]);
          southBase.setParent(visualParent);
          southBase.translate([0.051, -cfg.scale[1] / 2 + 0.35, 0]);
          southBase.scale([0.11, 0.7, cfg.scale[2]]);
          this.visualSolidWalls.push(southBase);
        }

      } else {
        // --- EXTERIOR WALL ---
        if (cfg.pos[2] === -13) {
          // North Wall (runs along X, Z is thickness)
          const leftX = cfg.pos[0] - cfg.scale[0] / 2;

          const outerTex = this.wallTextures.outside;
          const innerTex = getRoomTexture(cfg.pos[2]);
          const outerScale = getScaleForTexture(outerTex);
          const innerScale = getScaleForTexture(innerTex);

          // Outer Face (North, Z decreases)
          const outerWall = new Wall(gl, texRes.program, texRes.locs);
          outerWall.setParent(visualParent);
          outerWall.translate([0, 0, -0.05]);
          outerWall.scale([cfg.scale[0], cfg.scale[1], 0.1]);
          outerWall.uvScale = [cfg.scale[0] / outerScale, cfg.scale[1] / outerScale];
          outerWall.uvOffset = [leftX / outerScale, startingY / outerScale];
          this.visualTexturedWalls.push({ wall: outerWall, texture: outerTex });

          // Inner Face (South, Z increases, Kitchen)
          const innerWall = new Wall(gl, texRes.program, texRes.locs);
          innerWall.setParent(visualParent);
          innerWall.translate([0, 0, 0.05]);
          innerWall.scale([cfg.scale[0], cfg.scale[1], 0.1]);
          innerWall.uvScale = [cfg.scale[0] / innerScale, cfg.scale[1] / innerScale];
          innerWall.uvOffset = [leftX / innerScale, startingY / innerScale];
          this.visualTexturedWalls.push({ wall: innerWall, texture: innerTex });

          // Baseboard (Only for floor-sitting walls!)
          if (sitsOnFloor) {
            const base = new Wall(gl, solidRes.program, solidRes.locs, [0.4, 0.25, 0.15, 1.0]);
            base.setParent(visualParent);
            base.translate([0, -cfg.scale[1] / 2 + 0.35, 0.051]);
            base.scale([cfg.scale[0], 0.7, 0.11]);
            this.visualSolidWalls.push(base);
          }

        } else if (cfg.pos[2] === 13) {
          // South Wall (runs along X, Z is thickness)
          const leftX = cfg.pos[0] - cfg.scale[0] / 2;

          const outerTex = this.wallTextures.outside;
          const innerTex = getRoomTexture(cfg.pos[2]);
          const outerScale = getScaleForTexture(outerTex);
          const innerScale = getScaleForTexture(innerTex);

          // Outer Face (South, Z increases)
          const outerWall = new Wall(gl, texRes.program, texRes.locs);
          outerWall.setParent(visualParent);
          outerWall.translate([0, 0, 0.05]);
          outerWall.scale([cfg.scale[0], cfg.scale[1], 0.1]);
          outerWall.uvScale = [cfg.scale[0] / outerScale, cfg.scale[1] / outerScale];
          outerWall.uvOffset = [leftX / outerScale, startingY / outerScale];
          this.visualTexturedWalls.push({ wall: outerWall, texture: outerTex });

          // Inner Face (North, Z decreases, Living Room)
          const innerWall = new Wall(gl, texRes.program, texRes.locs);
          innerWall.setParent(visualParent);
          innerWall.translate([0, 0, -0.05]);
          innerWall.scale([cfg.scale[0], cfg.scale[1], 0.1]);
          innerWall.uvScale = [cfg.scale[0] / innerScale, cfg.scale[1] / innerScale];
          innerWall.uvOffset = [leftX / innerScale, startingY / innerScale];
          this.visualTexturedWalls.push({ wall: innerWall, texture: innerTex });

          // Baseboard (Only for floor-sitting walls!)
          if (sitsOnFloor) {
            const base = new Wall(gl, solidRes.program, solidRes.locs, [0.4, 0.25, 0.15, 1.0]);
            base.setParent(visualParent);
            base.translate([0, -cfg.scale[1] / 2 + 0.35, -0.051]);
            base.scale([cfg.scale[0], 0.7, 0.11]);
            this.visualSolidWalls.push(base);
          }

        } else if (cfg.pos[0] === -13) {
          // West Wall (runs along Z, X is thickness)
          const leftZ = cfg.pos[2] - cfg.scale[2] / 2;

          const outerTex = this.wallTextures.outside;
          const innerTex = getRoomTexture(cfg.pos[2]);
          const outerScale = getScaleForTexture(outerTex);
          const innerScale = getScaleForTexture(innerTex);

          // Outer Face (West, X decreases)
          const outerWall = new Wall(gl, texRes.program, texRes.locs);
          outerWall.setParent(visualParent);
          outerWall.translate([-0.05, 0, 0]);
          outerWall.scale([0.1, cfg.scale[1], cfg.scale[2]]);
          outerWall.uvScale = [cfg.scale[2] / outerScale, cfg.scale[1] / outerScale];
          outerWall.uvOffset = [leftZ / outerScale, startingY / outerScale];
          this.visualTexturedWalls.push({ wall: outerWall, texture: outerTex });

          // Inner Face (East, X increases, Room specific based on Z)
          const innerWall = new Wall(gl, texRes.program, texRes.locs);
          innerWall.setParent(visualParent);
          innerWall.translate([0.05, 0, 0]);
          innerWall.scale([0.1, cfg.scale[1], cfg.scale[2]]);
          innerWall.uvScale = [cfg.scale[2] / innerScale, cfg.scale[1] / innerScale];
          innerWall.uvOffset = [leftZ / innerScale, startingY / innerScale];
          this.visualTexturedWalls.push({ wall: innerWall, texture: innerTex });

          // Baseboard (Only for floor-sitting walls!)
          if (sitsOnFloor) {
            const base = new Wall(gl, solidRes.program, solidRes.locs, [0.4, 0.25, 0.15, 1.0]);
            base.setParent(visualParent);
            base.translate([0.051, -cfg.scale[1] / 2 + 0.35, 0]);
            base.scale([0.11, 0.7, cfg.scale[2]]);
            this.visualSolidWalls.push(base);
          }

        } else if (cfg.pos[0] === 13) {
          // East Wall (runs along Z, X is thickness)
          const leftZ = cfg.pos[2] - cfg.scale[2] / 2;

          const outerTex = this.wallTextures.outside;
          const innerTex = getRoomTexture(cfg.pos[2]);
          const outerScale = getScaleForTexture(outerTex);
          const innerScale = getScaleForTexture(innerTex);

          // Outer Face (East, X increases)
          const outerWall = new Wall(gl, texRes.program, texRes.locs);
          outerWall.setParent(visualParent);
          outerWall.translate([0.05, 0, 0]);
          outerWall.scale([0.1, cfg.scale[1], cfg.scale[2]]);
          outerWall.uvScale = [cfg.scale[2] / outerScale, cfg.scale[1] / outerScale];
          outerWall.uvOffset = [leftZ / outerScale, startingY / outerScale];
          this.visualTexturedWalls.push({ wall: outerWall, texture: outerTex });

          // Inner Face (West, X decreases, Room specific based on Z)
          const innerWall = new Wall(gl, texRes.program, texRes.locs);
          innerWall.setParent(visualParent);
          innerWall.translate([-0.05, 0, 0]);
          innerWall.scale([0.1, cfg.scale[1], cfg.scale[2]]);
          innerWall.uvScale = [cfg.scale[2] / innerScale, cfg.scale[1] / innerScale];
          innerWall.uvOffset = [leftZ / innerScale, startingY / innerScale];
          this.visualTexturedWalls.push({ wall: innerWall, texture: innerTex });

          // Baseboard (Only for floor-sitting walls!)
          if (sitsOnFloor) {
            const base = new Wall(gl, solidRes.program, solidRes.locs, [0.4, 0.25, 0.15, 1.0]);
            base.setParent(visualParent);
            base.translate([-0.051, -cfg.scale[1] / 2 + 0.35, 0]);
            base.scale([0.11, 0.7, cfg.scale[2]]);
            this.visualSolidWalls.push(base);
          }
        }
      }
    });

    // --- House Ceiling Slab (Solid Paint Color) ---
    this.ceiling = new Wall(gl, solidRes.program, solidRes.locs, [217 / 255, 211 / 255, 134 / 255, 1.0]);
    this.ceiling.setParent(this);
    this.ceiling.translate([0, 5, 0]);
    this.ceiling.scale([26, 0.2, 26]);

    // --- House Floor Slab ---
    this.floor = new Wall(gl, texRes.program, texRes.locs);
    this.floor.setParent(this);
    this.floor.translate([0, -2, 0]);
    this.floor.scale([26, 0.2, 26]);
    this.floor.uvScale = [26.0 / floorScale, 26.0 / floorScale];
    this.floor.uvOffset = [-13.0 / floorScale, -13.0 / floorScale];
  }

  draw(gl, viewProjection) {
    this.updateWorldMatrix();

    // Render visual textured walls with their designated JPEG textures
    this.visualTexturedWalls.forEach(item => {
      item.wall.draw(gl, viewProjection, item.texture);
    });

    // Render solid wainscoting brown baseboard strips
    this.visualSolidWalls.forEach(w => {
      w.draw(gl, viewProjection);
    });

    // Render ceiling slab with solid paint color rgb(217, 211, 134)
    this.ceiling.draw(gl, viewProjection);

    // Render floor slab with floor.jpg texture
    this.floor.draw(gl, viewProjection, this.floorTexture);
  }
}
