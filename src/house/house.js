class House extends Node {
  constructor(gl, solidRes, texRes, wallTextures) {
    super();
    this.walls = [];
    this.visualTexturedWalls = [];
    this.visualSolidWalls = [];
    this.wallTextures = wallTextures;
    this.floorTexture = wallTextures.floor;
    this.screenMeshTexture = wallTextures.screenmesh;
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
      // --- South Wall (Z = 13) ---
      { pos: [-8.75, 0, 15], scale: [2.5, 7, 0.2], tex: true },
      { pos: [-6, 0, 15], scale: [3, 1, 0.2], tex: true },
      { pos: [-6, 4, 15], scale: [3, 3, 0.2], tex: true },
      { pos: [-3, 0, 15], scale: [3, 7, 0.2], tex: true },
      { pos: [0, 4, 15], scale: [3, 3, 0.2], tex: true },
      { pos: [3, 0, 15], scale: [3, 7, 0.2], tex: true },
      { pos: [6, 0, 15], scale: [3, 1, 0.2], tex: true },
      { pos: [6, 4, 15], scale: [3, 3, 0.2], tex: true },
      { pos: [8.75, 0, 15], scale: [2.5, 7, 0.2], tex: true },

      // --- East Wall (X = 13) — Living Room only (Z = 3 to 13) ---
      { pos: [10, 0, 8], scale: [0.2, 7, 14], tex: true }, // Living Room Wall

      // --- West Wall (X = -13) — Living Room only (Z = 3 to 15) ---
      { pos: [-10, 0, 3.75], scale: [0.2, 7, 5.5], tex: true }, // Living Room Corner Wall (North)
      { pos: [-10, 0, 8], scale: [0.2, 1, 5], tex: true },       // Living Room Window Sill
      { pos: [-10, 4, 8], scale: [0.2, 3, 3], tex: true },       // Living Room Window Header
      { pos: [-10, 0, 12.25], scale: [0.2, 7, 5.5], tex: true }, // Living Room Corner Wall (South)

      // --- Living Room Divider (X = -10 to 10, doorway at X = -8 to -5) ---
      { pos: [-9, 0, 1.0], scale: [0.2, 7, 2], rot: Math.PI / 2, color: [0.9, 0.8, 0.7, 1.0] },   // Corner (X: -10 to -8)
      { pos: [-6.5, 4, 1.0], scale: [0.2, 3, 3], rot: Math.PI / 2, color: [0.9, 0.8, 0.7, 1.0] }, // Header above doorway (X: -8 to -5)
      { pos: [2.5, 0, 1.0], scale: [0.2, 7, 15], rot: Math.PI / 2, color: [0.9, 0.8, 0.7, 1.0] }  // Main wall (X: -5 to 10)

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
        const northTex = this.wallTextures.livingRoom;  // face into living room → living room wallpaper
        const southTex = this.wallTextures.outside;    // face away from living room → outside wood
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

      } else {
        // --- EXTERIOR WALL ---
        if (cfg.pos[2] < 0) {
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


          // Baseboard (Only for floor-sitting walls!)
          if (sitsOnFloor) {
            const base = new Wall(gl, solidRes.program, solidRes.locs, [0.4, 0.25, 0.15, 1.0]);
            base.setParent(visualParent);
            base.translate([0, -cfg.scale[1] / 2 + 0.35, 0.051]);
            base.scale([cfg.scale[0], 0.7, 0.11]);
            this.visualSolidWalls.push(base);
          }

        } else if (cfg.pos[0] === -10) {
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

        } else if (cfg.pos[0] === 10) {
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

        } else if (cfg.pos[2] > 0) {
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
        }
      }
    });


    // --- Ceiling Slab: Living Room (Z = 3 to 13) ---
    this.livingRoomCeiling = new Wall(gl, solidRes.program, solidRes.locs, [217 / 255, 211 / 255, 134 / 255, 1.0]);
    this.livingRoomCeiling.setParent(this);
    this.livingRoomCeiling.translate([0, 5, 8]);  // centre of Z=3..13
    this.livingRoomCeiling.scale([20, 0.2, 14]);

    // --- Floor Slab: Living Room (Z = 3 to 13) ---
    this.livingRoomFloor = new Wall(gl, texRes.program, texRes.locs);
    this.livingRoomFloor.setParent(this);
    this.livingRoomFloor.translate([0, -2.1, 8]);
    this.livingRoomFloor.scale([20, 0.2, 14.0]);
    this.livingRoomFloor.uvScale = [20.0 / floorScale, 10.0 / floorScale];
    this.livingRoomFloor.uvOffset = [-10.0 / floorScale, 3.0 / floorScale];

    // --- Doors ---
    this.doors = [];

    // 1. Front Entrance Door: Solid Oak Wood Door 
    const frontDoor = new Door(gl, solidRes, texRes, 'screen', this.floorTexture, this.screenMeshTexture);
    frontDoor.setParent(this);
    frontDoor.setTransform([0, 0, 15], 0);
    this.doors.push(frontDoor);

    // 2. Living Room / Dining Divider Door
    const livingRoomDoor = new Door(gl, solidRes, texRes, 'solid', this.floorTexture, this.screenMeshTexture);
    livingRoomDoor.setParent(this);
    livingRoomDoor.setTransform([-6.5, 0, 1.1], 0);
    this.doors.push(livingRoomDoor);


    // --- Front Porch ---
    this.porch = new Porch(gl, solidRes, texRes, this.wallTextures.outside);
    this.porch.setParent(this);
    this.porch.translate([0, 0, 2]); 

    // --- Windows ---
    this.windows = [];

    // Window configurations: [x, y, z], rotY
    const windowConfigs = [
      // 1. South Wall: Left Window
      { pos: [-6, 0.5, 15], rot: 0 },
      // 2. South Wall: Right Window
      { pos: [6, 0.5, 15], rot: 0 },
      // 3. West Wall: Living Room Window
      { pos: [-10, 0.5, 8], rot: -Math.PI / 2 },
    ];

    windowConfigs.forEach(cfg => {
      const win = new Window(gl, solidRes, texRes);
      win.setParent(this);
      win.setTransform(cfg.pos, cfg.rot);
      this.windows.push(win);
    });


    // --- Interior Stairs ---
    this.interiorStairs = new InteriorStairs(gl, solidRes, texRes);
    this.interiorStairs.setParent(this);
    this.interiorStairs.setTransform([7.8, 0, 9.6], Math.PI);

    // --- Living Room Furniture ---
    this.livingRoomTV = new Television(gl, solidRes, texRes, this.floorTexture);
    this.livingRoomTV.setParent(this);
    this.livingRoomTV.setTransform([-5.0, -1.9, 8.0], Math.PI / 2);

    this.livingRoomCarpet = new Carpet(gl, solidRes, texRes);
    this.livingRoomCarpet.setParent(this);
    this.livingRoomCarpet.setTransform([1.0, -1.9, 8.0], 0);

    this.livingRoomRockingChair = new RockingChair(gl, solidRes);
    this.livingRoomRockingChair.setParent(this);
    this.livingRoomRockingChair.setTransform([2.0, -1.9, 6.0], -Math.PI / 2 + 35 * Math.PI / 180);

    this.livingRoomRedCouch = new RedCouch(gl, solidRes);
    this.livingRoomRedCouch.setParent(this);
    this.livingRoomRedCouch.setTransform([2.7, -1.9, 10.0], -Math.PI / 2 - 35 * Math.PI / 180);

    this.livingRoomTable = new SmallTable(gl, solidRes);
    this.livingRoomTable.setParent(this);
    this.livingRoomTable.setTransform([2.5, -1.9, 8.0], 0);

    this.livingRoomLamp = new Lamp(gl, solidRes);
    this.livingRoomLamp.setParent(this);
    this.livingRoomLamp.setTransform([2.7, -1.9, 12.0], 0);

    this.livingRoomClock = new GrandfatherClock(gl, solidRes, texRes, this.floorTexture);
    this.livingRoomClock.setParent(this);
    this.livingRoomClock.setTransform([9.3, -1.9, 14.0], -Math.PI / 2);
  }

  update(deltaTime) {
    if (this.doors) this.doors.forEach(door => door.update(deltaTime));
    // Propagate all local matrix updates down the scenegraph to compute world matrices
    this.updateWorldMatrix(null);
  }

  getWalkableNodes() {
    const list = [];
    if (this.livingRoomFloor) list.push(this.livingRoomFloor);
    if (this.porch) {
      if (this.porch.deck) list.push(this.porch.deck);
      if (this.porch.steps && this.porch.steps.steps) {
        list.push(...this.porch.steps.steps);
      }
    }
    if (this.kitchenSteps && this.kitchenSteps.steps) {
      list.push(...this.kitchenSteps.steps);
    }
    if (this.interiorStairs && this.interiorStairs.steps) {
      list.push(...this.interiorStairs.steps);
    }
    return list;
  }

  getCollisionWalls() {
    // Return all static boundaries and dynamic door collision bounds
    const doorWalls = this.doors.map(door => {
      return {
        bounds: door.getCollisionBounds(this.elevation)
      };
    });
    const walls = this.walls.concat(doorWalls);

    // Add collision for the interior stairs railing/handrail on the open side
    if (this.interiorStairs && this.interiorStairs.getCollisionBounds) {
      walls.push({
        bounds: this.interiorStairs.getCollisionBounds(this.elevation)
      });
    }

    // Add collisions for living room furniture
    const furnitureItems = [
      this.livingRoomTV,
      this.livingRoomRockingChair,
      this.livingRoomRedCouch,
      this.livingRoomTable,
      this.livingRoomLamp,
      this.livingRoomClock
    ];
    furnitureItems.forEach(item => {
      if (item && item.getCollisionBounds) {
        walls.push({
          bounds: item.getCollisionBounds(this.elevation)
        });
      }
    });

    return walls;
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

    // Render ceiling slab
    this.livingRoomCeiling.draw(gl, viewProjection);

    // Render floor slab
    this.livingRoomFloor.draw(gl, viewProjection, this.floorTexture);

    // Render Front Porch (Deck platform, railings, and steps leading to ground)
    if (this.porch) this.porch.draw(gl, viewProjection);

    // Render Interior Stairs
    if (this.interiorStairs) this.interiorStairs.draw(gl, viewProjection, this.wallTextures.livingRoom);

    // Render Living Room Furniture
    if (this.livingRoomCarpet) this.livingRoomCarpet.draw(gl, viewProjection, this.wallTextures.rug);
    if (this.livingRoomTV) this.livingRoomTV.draw(gl, viewProjection, this.floorTexture);
    if (this.livingRoomRockingChair) this.livingRoomRockingChair.draw(gl, viewProjection);
    if (this.livingRoomRedCouch) this.livingRoomRedCouch.draw(gl, viewProjection);
    if (this.livingRoomTable) this.livingRoomTable.draw(gl, viewProjection);
    if (this.livingRoomLamp) this.livingRoomLamp.draw(gl, viewProjection);
    if (this.livingRoomClock) this.livingRoomClock.draw(gl, viewProjection, this.floorTexture);

    // Render all opaque parts of interactable doors first
    if (this.doors) this.doors.forEach(door => door.draw(gl, viewProjection, 'opaque'));

    // Render all opaque parts of windows
    if (this.windows) this.windows.forEach(win => win.draw(gl, viewProjection, 'opaque'));

    // Then render all transparent screen meshes.
    gl.depthMask(false);
    if (this.doors) this.doors.forEach(door => door.draw(gl, viewProjection, 'transparent'));
    // Render all transparent window glass panes
    if (this.windows) this.windows.forEach(win => win.draw(gl, viewProjection, 'transparent'));
    gl.depthMask(true); // Re-enable depth buffer writes
  }
}
