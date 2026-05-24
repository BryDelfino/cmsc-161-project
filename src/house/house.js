class House extends Node {
  constructor(gl, solidRes, texRes, cubeTextures) {
    super();
    this.collisionCubes = [];
    this.visualTexturedCubes = [];
    this.visualSolidCubes = [];
    this.cubeTextures = cubeTextures;
    this.floorTexture = cubeTextures.floor;
    this.screenMeshTexture = cubeTextures.screenmesh;
    this.elevation = 1.5;
    this.translate([0, this.elevation, 0]);

    const outsideScale = 2.0;
    const floorScale = 2.0;
    const livingRoomScale = 2.0;
    const kitchenScale = 3.0;
    const diningScale = 3.0;

    const getRoomTexture = (z) => {
      if (z < -5) return this.cubeTextures.kitchen;
      if (z < 3) return this.cubeTextures.dining;
      return this.cubeTextures.livingRoom;
    };

    const getScaleForTexture = (tex) => {
      if (tex === this.cubeTextures.kitchen) return kitchenScale;
      if (tex === this.cubeTextures.dining) return diningScale;
      if (tex === this.cubeTextures.outside) return outsideScale;
      return livingRoomScale;
    };

    const cubeConfig = [
      // South Cubes
      { pos: [-8.75, 0, 15], scale: [2.5, 7, 0.2], tex: true },
      { pos: [-6, 0, 15], scale: [3, 1, 0.2], tex: true },
      { pos: [-6, 4, 15], scale: [3, 3, 0.2], tex: true },
      { pos: [-3, 0, 15], scale: [3, 7, 0.2], tex: true },
      { pos: [0, 4, 15], scale: [3, 3, 0.2], tex: true },
      { pos: [3, 0, 15], scale: [3, 7, 0.2], tex: true },
      { pos: [6, 0, 15], scale: [3, 1, 0.2], tex: true },
      { pos: [6, 4, 15], scale: [3, 3, 0.2], tex: true },
      { pos: [8.75, 0, 15], scale: [2.5, 7, 0.2], tex: true },

      // East Cubes
      { pos: [10, 0, 8], scale: [0.2, 7, 14], tex: true },

      // West Cubes
      { pos: [-10, 0, 3.75], scale: [0.2, 7, 5.5], tex: true },
      { pos: [-10, 0, 8], scale: [0.2, 1, 5], tex: true },
      { pos: [-10, 4, 8], scale: [0.2, 3, 3], tex: true },
      { pos: [-10, 0, 12.25], scale: [0.2, 7, 5.5], tex: true },

      // Divider
      { pos: [-9, 0, 1.0], scale: [0.2, 7, 2], rot: Math.PI / 2, color: [0.9, 0.8, 0.7, 1.0] },
      { pos: [-6.5, 4, 1.0], scale: [0.2, 3, 3], rot: Math.PI / 2, color: [0.9, 0.8, 0.7, 1.0] },
      { pos: [2.5, 0, 1.0], scale: [0.2, 7, 15], rot: Math.PI / 2, color: [0.9, 0.8, 0.7, 1.0] }
    ];

    cubeConfig.forEach(cfg => {
      const collisionProg = cfg.tex ? texRes.program : solidRes.program;
      const collisionLocs = cfg.tex ? texRes.locs : solidRes.locs;

      const c = new Cube(gl, collisionProg, collisionLocs, cfg.color);
      c.setParent(this);
      c.translate([cfg.pos[0], -2 + cfg.scale[1] / 2 + cfg.pos[1], cfg.pos[2]]);
      if (cfg.rot) c.rotate(cfg.rot, [0, 1, 0]);
      c.scale(cfg.scale);

      const yCenter = -2 + cfg.scale[1] / 2 + cfg.pos[1] + this.elevation;
      c.bounds = {
        minX: cfg.pos[0] - (cfg.rot ? cfg.scale[2] : cfg.scale[0]) / 2,
        maxX: cfg.pos[0] + (cfg.rot ? cfg.scale[2] : cfg.scale[0]) / 2,
        minY: yCenter - cfg.scale[1] / 2,
        maxY: yCenter + cfg.scale[1] / 2,
        minZ: cfg.pos[2] - (cfg.rot ? cfg.scale[0] : cfg.scale[2]) / 2,
        maxZ: cfg.pos[2] + (cfg.rot ? cfg.scale[0] : cfg.scale[2]) / 2,
      };
      this.collisionCubes.push(c);

      const visualParent = new Node();
      visualParent.setParent(this);
      visualParent.translate([cfg.pos[0], -2 + cfg.scale[1] / 2 + cfg.pos[1], cfg.pos[2]]);
      if (cfg.rot) visualParent.rotate(cfg.rot, [0, 1, 0]);

      const sitsOnFloor = cfg.pos[1] === undefined || cfg.pos[1] === 0;
      const startingY = cfg.pos[1] === undefined ? 0.0 : cfg.pos[1];

      if (cfg.rot) {
        const northTex = this.cubeTextures.livingRoom;
        const southTex = this.cubeTextures.outside;
        const leftX = cfg.pos[0] - cfg.scale[2] / 2;

        const northScale = getScaleForTexture(northTex);
        const southScale = getScaleForTexture(southTex);

        const northCube = new Cube(gl, texRes.program, texRes.locs);
        northCube.setParent(visualParent);
        northCube.translate([-0.05, 0, 0]);
        northCube.scale([0.1, cfg.scale[1], cfg.scale[2]]);
        northCube.uvScale = [cfg.scale[2] / northScale, cfg.scale[1] / northScale];
        northCube.uvOffset = [leftX / northScale, startingY / northScale];
        this.visualTexturedCubes.push({ cube: northCube, texture: northTex });

        if (sitsOnFloor) {
          const northBase = new Cube(gl, solidRes.program, solidRes.locs, [0.4, 0.25, 0.15, 1.0]);
          northBase.setParent(visualParent);
          northBase.translate([-0.051, -cfg.scale[1] / 2 + 0.35, 0]);
          northBase.scale([0.11, 0.7, cfg.scale[2]]);
          this.visualSolidCubes.push(northBase);
        }

        const southCube = new Cube(gl, texRes.program, texRes.locs);
        southCube.setParent(visualParent);
        southCube.translate([0.05, 0, 0]);
        southCube.scale([0.1, cfg.scale[1], cfg.scale[2]]);
        southCube.uvScale = [cfg.scale[2] / southScale, cfg.scale[1] / southScale];
        southCube.uvOffset = [leftX / southScale, startingY / southScale];
        this.visualTexturedCubes.push({ cube: southCube, texture: southTex });

      } else {
        if (cfg.pos[2] < 0) {
          const leftX = cfg.pos[0] - cfg.scale[0] / 2;
          const outerTex = this.cubeTextures.outside;
          const innerTex = getRoomTexture(cfg.pos[2]);
          const outerScale = getScaleForTexture(outerTex);
          const innerScale = getScaleForTexture(innerTex);

          const outerCube = new Cube(gl, texRes.program, texRes.locs);
          outerCube.setParent(visualParent);
          outerCube.translate([0, 0, -0.05]);
          outerCube.scale([cfg.scale[0], cfg.scale[1], 0.1]);
          outerCube.uvScale = [cfg.scale[0] / outerScale, cfg.scale[1] / outerScale];
          outerCube.uvOffset = [leftX / outerScale, startingY / outerScale];
          this.visualTexturedCubes.push({ cube: outerCube, texture: outerTex });

          if (sitsOnFloor) {
            const base = new Cube(gl, solidRes.program, solidRes.locs, [0.4, 0.25, 0.15, 1.0]);
            base.setParent(visualParent);
            base.translate([0, -cfg.scale[1] / 2 + 0.35, 0.051]);
            base.scale([cfg.scale[0], 0.7, 0.11]);
            this.visualSolidCubes.push(base);
          }

        } else if (cfg.pos[0] === -10) {
          const leftZ = cfg.pos[2] - cfg.scale[2] / 2;
          const outerTex = this.cubeTextures.outside;
          const innerTex = getRoomTexture(cfg.pos[2]);
          const outerScale = getScaleForTexture(outerTex);
          const innerScale = getScaleForTexture(innerTex);

          const outerCube = new Cube(gl, texRes.program, texRes.locs);
          outerCube.setParent(visualParent);
          outerCube.translate([-0.05, 0, 0]);
          outerCube.scale([0.1, cfg.scale[1], cfg.scale[2]]);
          outerCube.uvScale = [cfg.scale[2] / outerScale, cfg.scale[1] / outerScale];
          outerCube.uvOffset = [leftZ / outerScale, startingY / outerScale];
          this.visualTexturedCubes.push({ cube: outerCube, texture: outerTex });

          const innerCube = new Cube(gl, texRes.program, texRes.locs);
          innerCube.setParent(visualParent);
          innerCube.translate([0.05, 0, 0]);
          innerCube.scale([0.1, cfg.scale[1], cfg.scale[2]]);
          innerCube.uvScale = [cfg.scale[2] / innerScale, cfg.scale[1] / innerScale];
          innerCube.uvOffset = [leftZ / innerScale, startingY / innerScale];
          this.visualTexturedCubes.push({ cube: innerCube, texture: innerTex });

          if (sitsOnFloor) {
            const base = new Cube(gl, solidRes.program, solidRes.locs, [0.4, 0.25, 0.15, 1.0]);
            base.setParent(visualParent);
            base.translate([0.051, -cfg.scale[1] / 2 + 0.35, 0]);
            base.scale([0.11, 0.7, cfg.scale[2]]);
            this.visualSolidCubes.push(base);
          }

        } else if (cfg.pos[0] === 10) {
          const leftZ = cfg.pos[2] - cfg.scale[2] / 2;
          const outerTex = this.cubeTextures.outside;
          const innerTex = getRoomTexture(cfg.pos[2]);
          const outerScale = getScaleForTexture(outerTex);
          const innerScale = getScaleForTexture(innerTex);

          const outerCube = new Cube(gl, texRes.program, texRes.locs);
          outerCube.setParent(visualParent);
          outerCube.translate([0.05, 0, 0]);
          outerCube.scale([0.1, cfg.scale[1], cfg.scale[2]]);
          outerCube.uvScale = [cfg.scale[2] / outerScale, cfg.scale[1] / outerScale];
          outerCube.uvOffset = [leftZ / outerScale, startingY / outerScale];
          this.visualTexturedCubes.push({ cube: outerCube, texture: outerTex });

          const innerCube = new Cube(gl, texRes.program, texRes.locs);
          innerCube.setParent(visualParent);
          innerCube.translate([-0.05, 0, 0]);
          innerCube.scale([0.1, cfg.scale[1], cfg.scale[2]]);
          innerCube.uvScale = [cfg.scale[2] / innerScale, cfg.scale[1] / innerScale];
          innerCube.uvOffset = [leftZ / innerScale, startingY / innerScale];
          this.visualTexturedCubes.push({ cube: innerCube, texture: innerTex });

          if (sitsOnFloor) {
            const base = new Cube(gl, solidRes.program, solidRes.locs, [0.4, 0.25, 0.15, 1.0]);
            base.setParent(visualParent);
            base.translate([-0.051, -cfg.scale[1] / 2 + 0.35, 0]);
            base.scale([0.11, 0.7, cfg.scale[2]]);
            this.visualSolidCubes.push(base);
          }

        } else if (cfg.pos[2] > 0) {
          const leftX = cfg.pos[0] - cfg.scale[0] / 2;
          const outerTex = this.cubeTextures.outside;
          const innerTex = getRoomTexture(cfg.pos[2]);
          const outerScale = getScaleForTexture(outerTex);
          const innerScale = getScaleForTexture(innerTex);

          const outerCube = new Cube(gl, texRes.program, texRes.locs);
          outerCube.setParent(visualParent);
          outerCube.translate([0, 0, 0.05]);
          outerCube.scale([cfg.scale[0], cfg.scale[1], 0.1]);
          outerCube.uvScale = [cfg.scale[0] / outerScale, cfg.scale[1] / outerScale];
          outerCube.uvOffset = [leftX / outerScale, startingY / outerScale];
          this.visualTexturedCubes.push({ cube: outerCube, texture: outerTex });

          const innerCube = new Cube(gl, texRes.program, texRes.locs);
          innerCube.setParent(visualParent);
          innerCube.translate([0, 0, -0.05]);
          innerCube.scale([cfg.scale[0], cfg.scale[1], 0.1]);
          innerCube.uvScale = [cfg.scale[0] / innerScale, cfg.scale[1] / innerScale];
          innerCube.uvOffset = [leftX / innerScale, startingY / innerScale];
          this.visualTexturedCubes.push({ cube: innerCube, texture: innerTex });

          if (sitsOnFloor) {
            const base = new Cube(gl, solidRes.program, solidRes.locs, [0.4, 0.25, 0.15, 1.0]);
            base.setParent(visualParent);
            base.translate([0, -cfg.scale[1] / 2 + 0.35, -0.051]);
            base.scale([cfg.scale[0], 0.7, 0.11]);
            this.visualSolidCubes.push(base);
          }
        }
      }
    });

    const ceilingColor = [217 / 255, 211 / 255, 134 / 255, 1.0];

    this.livingRoomCeilingLeft = new Cube(gl, solidRes.program, solidRes.locs, ceilingColor);
    this.livingRoomCeilingLeft.setParent(this);
    this.livingRoomCeilingLeft.translate([-2.2, 5, 8]);
    this.livingRoomCeilingLeft.scale([15.5, 0.2, 14]);

    this.livingRoomCeilingRight = new Cube(gl, solidRes.program, solidRes.locs, ceilingColor);
    this.livingRoomCeilingRight.setParent(this);
    this.livingRoomCeilingRight.translate([7.75, 5, 12]);
    this.livingRoomCeilingRight.scale([4.5, 0.2, 6]);

    this.livingRoomFloor = new Cube(gl, texRes.program, texRes.locs);
    this.livingRoomFloor.setParent(this);
    this.livingRoomFloor.translate([0, -2.1, 8]);
    this.livingRoomFloor.rotate(Math.PI / 2, [0, 1, 0]);
    this.livingRoomFloor.scale([14.0, 0.2, 20.0]);
    this.livingRoomFloor.uvScale = [14.0 / floorScale, 20.0 / floorScale];
    this.livingRoomFloor.uvOffset = [3.0 / floorScale, -10.0 / floorScale];

    this.doors = [];
    const frontDoor = new Door(gl, solidRes, texRes, 'screen', this.floorTexture, this.screenMeshTexture);
    frontDoor.setParent(this);
    frontDoor.setTransform([0, 0, 15], 0);
    this.doors.push(frontDoor);

    const livingRoomDoor = new Door(gl, solidRes, texRes, 'solid', this.floorTexture, this.screenMeshTexture);
    livingRoomDoor.setParent(this);
    livingRoomDoor.setTransform([-6.5, 0, 1.1], 0);
    livingRoomDoor.isLocked = true;
    this.doors.push(livingRoomDoor);

    this.porch = new Porch(gl, solidRes, texRes, this.cubeTextures.outside);
    this.porch.setParent(this);
    this.porch.translate([0, 0, 2]);

    this.windows = [];
    const windowConfigs = [
      { pos: [-6, 0.5, 15], rot: 0 },
      { pos: [6, 0.5, 15], rot: 0 },
      { pos: [-10, 0.5, 8], rot: -Math.PI / 2 },
    ];
    windowConfigs.forEach(cfg => {
      const win = new Window(gl, solidRes, texRes);
      win.setParent(this);
      win.setTransform(cfg.pos, cfg.rot);
      this.windows.push(win);
    });

    this.interiorStairs = new InteriorStairs(gl, solidRes, texRes);
    this.interiorStairs.setParent(this);
    this.interiorStairs.setTransform([7.8, 0, 9.6], Math.PI);

    this.livingRoomTV = new Television(gl, solidRes, texRes);
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
    this.livingRoomTable.setTransform([2.5, -1.9, 8.0], Math.PI / 3);

    this.livingRoomLamp = new Lamp(gl, solidRes);
    this.livingRoomLamp.setParent(this);
    this.livingRoomLamp.setTransform([2.7, -1.9, 12.0], -Math.PI / 2);

    this.livingRoomClock = new GrandfatherClock(gl, solidRes);
    this.livingRoomClock.setParent(this);
    this.livingRoomClock.setTransform([9.3, -1.9, 14.0], -Math.PI / 2);

    this.squareFrame = new SquarePictureFrame(gl, solidRes, texRes, cubeTextures.noodles);
    this.squareFrame.setParent(this);
    this.squareFrame.setTransform([9.660, 3.2, 9.125], Math.PI / 2);

    this.rectangularFrame = new RectangularPictureFrame(gl, solidRes);
    this.rectangularFrame.setParent(this);
    this.rectangularFrame.setTransform([0, 2.5, 1.125], 0);

    this.lightswitches = [];
    const entranceSwitch = new Lightswitch(gl, solidRes, true);
    entranceSwitch.setParent(this);
    entranceSwitch.setTransform([2.3, 0.5, 14.88], Math.PI);
    this.lightswitches.push(entranceSwitch);

    this.ceilingLight = new CeilingLight(gl, solidRes, true);
    this.ceilingLight.setParent(this);
    this.ceilingLight.setTransform([-2.0, 5.0, 8.0]);

    // Outside boundaries
    this.collisionCubes.push({
      bounds: { minX: -10.3, maxX: -10.1, minY: -10.0, maxY: 10.0, minZ: 15.0, maxZ: 26.0 }
    });
    this.collisionCubes.push({
      bounds: { minX: 10.1, maxX: 10.3, minY: -10.0, maxY: 10.0, minZ: 15.0, maxZ: 26.0 }
    });
    this.collisionCubes.push({
      bounds: { minX: -10.3, maxX: 10.3, minY: -10.0, maxY: 10.0, minZ: 26.0, maxZ: 26.2 }
    });

    // Upstairs Room Illusion
    const upstairsFloor = new Cube(gl, texRes.program, texRes.locs);
    upstairsFloor.setParent(this);
    upstairsFloor.translate([7.75, 5.0, -0.5]);
    upstairsFloor.rotate(Math.PI / 2, [0, 1, 0]);
    upstairsFloor.scale([3.0, 0.2, 4.5]);
    upstairsFloor.uvScale = [3.0 / 2.0, 4.5 / 2.0];
    upstairsFloor.shininess = 20.0;
    upstairsFloor.specularStrength = 0.3;
    this.visualTexturedCubes.push({ cube: upstairsFloor, texture: this.floorTexture });

    const upstairsWestCube = new Cube(gl, texRes.program, texRes.locs);
    upstairsWestCube.setParent(this);
    upstairsWestCube.translate([5.5, 8.5, 3.5]);
    upstairsWestCube.scale([0.2, 7.0, 11.0]);
    upstairsWestCube.uvScale = [11.0 / 2.0, 7.0 / 2.0];
    this.visualTexturedCubes.push({ cube: upstairsWestCube, texture: this.cubeTextures.livingRoom });

    const upstairsEastCube = new Cube(gl, texRes.program, texRes.locs);
    upstairsEastCube.setParent(this);
    upstairsEastCube.translate([10.0, 8.5, 3.5]);
    upstairsEastCube.scale([0.2, 7.0, 11.0]);
    upstairsEastCube.uvScale = [11.0 / 2.0, 7.0 / 2.0];
    this.visualTexturedCubes.push({ cube: upstairsEastCube, texture: this.cubeTextures.livingRoom });

    const upstairsNorthCube = new Cube(gl, texRes.program, texRes.locs);
    upstairsNorthCube.setParent(this);
    upstairsNorthCube.translate([7.75, 8.5, -2.0]);
    upstairsNorthCube.scale([4.5, 7.0, 0.2]);
    upstairsNorthCube.uvScale = [4.5 / 2.0, 7.0 / 2.0];
    this.visualTexturedCubes.push({ cube: upstairsNorthCube, texture: this.cubeTextures.livingRoom });

    const upstairsSouthCube = new Cube(gl, texRes.program, texRes.locs);
    upstairsSouthCube.setParent(this);
    upstairsSouthCube.translate([7.75, 8.5, 9.0]);
    upstairsSouthCube.scale([4.5, 7.0, 0.2]);
    upstairsSouthCube.uvScale = [4.5 / 2.0, 7.0 / 2.0];
    this.visualTexturedCubes.push({ cube: upstairsSouthCube, texture: this.cubeTextures.livingRoom });

    this.collisionCubes.push({
      bounds: { minX: 5.5, maxX: 10.0, minY: 3.0, maxY: 10.0, minZ: 2.0, maxZ: 2.2 }
    });

    const upstairsCeiling = new Cube(gl, solidRes.program, solidRes.locs, ceilingColor);
    upstairsCeiling.setParent(this);
    upstairsCeiling.translate([7.75, 12.0, 3.5]);
    upstairsCeiling.scale([4.5, 0.2, 11.0]);
    this.visualSolidCubes.push(upstairsCeiling);

    this.livingRoomFloor.shininess = 20.0;
    this.livingRoomFloor.specularStrength = 0.3;
    this.visualSolidCubes.forEach(c => {
      if (c !== upstairsCeiling) {
        c.shininess = 20.0;
        c.specularStrength = 0.3;
      }
    });
  }

  update(deltaTime) {
    if (this.doors) this.doors.forEach(door => door.update(deltaTime));
    if (this.lightswitches) this.lightswitches.forEach(sw => sw.update(deltaTime));
    if (this.livingRoomTV && this.livingRoomTV.update) this.livingRoomTV.update(deltaTime);
    if (this.livingRoomClock && this.livingRoomClock.update) this.livingRoomClock.update(deltaTime);
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

  getCollisionCubes() {
    const doorCubes = this.doors.map(door => {
      return { bounds: door.getCollisionBounds(this.elevation) };
    });
    const cubes = this.collisionCubes.concat(doorCubes);

    if (this.interiorStairs && this.interiorStairs.getCollisionBounds) {
      cubes.push({ bounds: this.interiorStairs.getCollisionBounds(this.elevation) });
    }

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
        cubes.push({ bounds: item.getCollisionBounds(this.elevation) });
      }
    });

    return cubes;
  }

  draw(gl, viewProjection, shadowProgramInfo) {
    this.updateWorldMatrix();

    this.visualTexturedCubes.forEach(item => {
      item.cube.draw(gl, viewProjection, item.texture, shadowProgramInfo);
    });

    this.visualSolidCubes.forEach(c => {
      c.draw(gl, viewProjection, shadowProgramInfo);
    });

    this.livingRoomCeilingLeft.draw(gl, viewProjection, shadowProgramInfo);
    this.livingRoomCeilingRight.draw(gl, viewProjection, shadowProgramInfo);
    this.livingRoomFloor.draw(gl, viewProjection, this.floorTexture, shadowProgramInfo);

    if (this.porch) this.porch.draw(gl, viewProjection, shadowProgramInfo);
    if (this.interiorStairs) this.interiorStairs.draw(gl, viewProjection, this.cubeTextures.livingRoom, shadowProgramInfo);

    if (this.livingRoomCarpet) this.livingRoomCarpet.draw(gl, viewProjection, this.cubeTextures.rug, shadowProgramInfo);
    if (this.livingRoomTV) this.livingRoomTV.draw(gl, viewProjection, shadowProgramInfo);
    if (this.livingRoomRockingChair) this.livingRoomRockingChair.draw(gl, viewProjection, shadowProgramInfo);
    if (this.livingRoomRedCouch) this.livingRoomRedCouch.draw(gl, viewProjection, shadowProgramInfo);
    if (this.livingRoomTable) this.livingRoomTable.draw(gl, viewProjection, shadowProgramInfo);
    if (this.livingRoomLamp) this.livingRoomLamp.draw(gl, viewProjection, shadowProgramInfo);
    if (this.livingRoomClock) this.livingRoomClock.draw(gl, viewProjection, shadowProgramInfo);

    if (this.squareFrame) this.squareFrame.draw(gl, viewProjection, shadowProgramInfo);
    if (this.rectangularFrame) this.rectangularFrame.draw(gl, viewProjection, shadowProgramInfo);

    if (this.lightswitches) this.lightswitches.forEach(sw => sw.draw(gl, viewProjection, shadowProgramInfo));
    if (this.ceilingLight) this.ceilingLight.draw(gl, viewProjection, shadowProgramInfo);

    if (shadowProgramInfo) {
      if (this.doors) this.doors.forEach(door => door.draw(gl, viewProjection, 'opaque', shadowProgramInfo));
      if (this.windows) this.windows.forEach(win => win.draw(gl, viewProjection, 'opaque', shadowProgramInfo));
    } else {
      if (this.doors) this.doors.forEach(door => door.draw(gl, viewProjection, 'opaque'));
      if (this.windows) this.windows.forEach(win => win.draw(gl, viewProjection, 'opaque'));

      gl.depthMask(false);
      if (this.doors) this.doors.forEach(door => door.draw(gl, viewProjection, 'transparent'));
      if (this.windows) this.windows.forEach(win => win.draw(gl, viewProjection, 'transparent'));
      gl.depthMask(true);
    }
  }
}
