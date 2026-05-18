class House extends Node {
  constructor(gl, solidRes, texRes, wallTexture) {
    super();
    this.walls = [];
    this.wallTexture = wallTexture;
    this.elevation = 1.5;
    this.translate([0, this.elevation, 0]);

    const wallConfig = [
      // --- EXTERIOR WALLS (Textured) ---
      { pos: [-12, 0, -13],  scale: [2, 7, 0.2], tex: true },  
      { pos: [-9.5, 4, -13], scale: [3, 3, 0.2], tex: true },  
      { pos: [ 2.5, 0, -13], scale: [21, 7, 0.2], tex: true }, 

      // --- South Wall ---
      { pos: [-10.25, 0, 13], scale: [5.5, 7, 0.2], tex: true },  
      { pos: [-6, 0, 13],     scale: [3, 1, 0.2], tex: true },    
      { pos: [-6, 4, 13],     scale: [3, 3, 0.2], tex: true },    
      { pos: [-3, 0, 13],     scale: [3, 7, 0.2], tex: true },    
      { pos: [ 0, 4, 13],     scale: [3, 3, 0.2], tex: true },    
      { pos: [ 3, 0, 13],     scale: [3, 7, 0.2], tex: true },    
      { pos: [ 6, 0, 13],     scale: [3, 1, 0.2], tex: true },    
      { pos: [ 6, 4, 13],     scale: [3, 3, 0.2], tex: true },    
      { pos: [ 10.25, 0, 13], scale: [5.5, 7, 0.2], tex: true },  

      // --- East Wall (Window for Kitchen) ---
      { pos: [13, 0, -11.75], scale: [0.2, 7, 2.5],  tex: true }, // Corner
      { pos: [13, 0, -9],     scale: [0.2, 1, 3],    tex: true }, // Window sill (width 3)
      { pos: [13, 4, -9],     scale: [0.2, 3, 3],    tex: true }, // Window header (width 3)
      { pos: [13, 0, 2.75],   scale: [0.2, 7, 20.5], tex: true }, // Rest of wall

      // --- West Wall (Windows for Living Room and Kitchen) ---
      { pos: [-13, 0, -11.75], scale: [0.2, 7, 2.5], tex: true }, // Corner of Kitchen
      { pos: [-13, 0, -9],     scale: [0.2, 1, 3],    tex: true }, // Kitchen Window Sill
      { pos: [-13, 4, -9],     scale: [0.2, 3, 3],    tex: true }, // Kitchen Window Header
      { pos: [-13, 0, -0.5],   scale: [0.2, 7, 14],   tex: true }, // Rest of the Wall
      { pos: [-13, 0, 8],      scale: [0.2, 1, 3],    tex: true }, // Living Room Window Sill     
      { pos: [-13, 4, 8],      scale: [0.2, 3, 3],    tex: true }, // Living Room Window Header
      { pos: [-13, 0, 11.25],  scale: [0.2, 7, 3.5],  tex: true }, // Corner of Living Room



      // --- Living Room Divider (Doorway on Left) ---
      { pos: [-12, 0, 3],  scale: [0.2, 7, 2],  rot: Math.PI/2, color: [0.9, 0.8, 0.7, 1.0] }, 
      { pos: [-9.5, 4, 3], scale: [0.2, 3, 3],  rot: Math.PI/2, color: [0.9, 0.8, 0.7, 1.0] }, 
      { pos: [ 2.5, 0, 3], scale: [0.2, 7, 21], rot: Math.PI/2, color: [0.9, 0.8, 0.7, 1.0] }, 
      
      // --- Dining/Kitchen Divider (Solid + Doorway on Left) ---
      { pos: [-12, 0, -5],  scale: [0.2, 7, 2],  rot: Math.PI/2, color: [0.7, 0.8, 0.9, 1.0] }, 
      { pos: [-9.5, 4, -5], scale: [0.2, 3, 3],  rot: Math.PI/2, color: [0.7, 0.8, 0.9, 1.0] }, 
      { pos: [ 2.5, 0, -5], scale: [0.2, 7, 21], rot: Math.PI/2, color: [0.7, 0.8, 0.9, 1.0] }, 
    ];

    wallConfig.forEach(cfg => {
      const prog = cfg.tex ? texRes.program : solidRes.program;
      const locs = cfg.tex ? texRes.locs : solidRes.locs;
      
      const w = new Wall(gl, prog, locs, cfg.color);
      w.setParent(this);
      w.translate([cfg.pos[0], -2 + cfg.scale[1]/2 + cfg.pos[1], cfg.pos[2]]); 
      if (cfg.rot) w.rotate(cfg.rot, [0, 1, 0]);
      w.scale(cfg.scale);

      const yCenter = -2 + cfg.scale[1]/2 + cfg.pos[1] + this.elevation;
      w.bounds = {
        minX: cfg.pos[0] - (cfg.rot ? cfg.scale[2] : cfg.scale[0]) / 2,
        maxX: cfg.pos[0] + (cfg.rot ? cfg.scale[2] : cfg.scale[0]) / 2,
        minY: yCenter - cfg.scale[1] / 2,
        maxY: yCenter + cfg.scale[1] / 2,
        minZ: cfg.pos[2] - (cfg.rot ? cfg.scale[0] : cfg.scale[2]) / 2,
        maxZ: cfg.pos[2] + (cfg.rot ? cfg.scale[0] : cfg.scale[2]) / 2,
      };
      this.walls.push(w);
    });

    this.ceiling = new Wall(gl, texRes.program, texRes.locs);
    this.ceiling.setParent(this);
    this.ceiling.translate([0, 5, 0]); 
    this.ceiling.scale([26, 0.2, 26]);

    // --- House Floor Slab (uses Wall object instead of Floor because it is 3D.) ---
    this.floor = new Wall(gl, texRes.program, texRes.locs);
    this.floor.setParent(this);
    this.floor.translate([0, -2, 0]);
    this.floor.scale([26, 0.2, 26]);  
  }

  draw(gl, viewProjection) {
    this.updateWorldMatrix();
    this.walls.forEach(w => w.draw(gl, viewProjection, this.wallTexture));
    this.ceiling.draw(gl, viewProjection, this.wallTexture);
    this.floor.draw(gl, viewProjection, this.wallTexture);
  }
}
