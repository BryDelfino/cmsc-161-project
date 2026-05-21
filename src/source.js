
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

function main() {
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl");
  if (!gl) return;

  // 1. SETUP PROGRAMS
  const skyboxProgram = createProgram(gl, vertexShaderSource, fragmentShaderSource);
  const solidProgram = createProgram(gl, solidVertexShaderSource, solidFragmentShaderSource);
  const texProgram = createProgram(gl, texVertexShaderSource, texFragmentShaderSource);

  // 2. LOOKUP LOCATIONS
  const skyboxLocs = {
    pos: gl.getAttribLocation(skyboxProgram, "a_position"),
    tex: gl.getUniformLocation(skyboxProgram, "u_skybox"),
    viewInv: gl.getUniformLocation(skyboxProgram, "u_viewDirectionProjectionInverse"),
  };

  const solidLocs = {
    pos: gl.getAttribLocation(solidProgram, "a_position"),
    matrix: gl.getUniformLocation(solidProgram, "u_matrix"),
    color: gl.getUniformLocation(solidProgram, "u_color"),
  };

  const texLocs = {
    pos: gl.getAttribLocation(texProgram, "a_position"),
    uv: gl.getAttribLocation(texProgram, "a_texcoord"),
    matrix: gl.getUniformLocation(texProgram, "u_matrix"),
    tex: gl.getUniformLocation(texProgram, "u_texture"),
    uvScale: gl.getUniformLocation(texProgram, "u_uvScale"),
    uvOffset: gl.getUniformLocation(texProgram, "u_uvOffset"),
  };

  // 3. INITIALIZE COMPONENTS
  const camera = new Camera(canvas);
  let lockedMessageTimer = 0.0;

  const skybox = new Skybox(gl, skyboxProgram, skyboxLocs, [
    '../assets/skybox/px.png',
    '../assets/skybox/nx.png',
    '../assets/skybox/py.png',
    '../assets/skybox/ny.png',
    '../assets/skybox/pz.png',
    '../assets/skybox/nz.png'
  ]);

  // Create Floor Texture
  // --- FLOOR TEXTURE (Load from file) ---
  const floorTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, floorTexture);

  // Fill with a solid brown while we wait for the image to load
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([101, 67, 33, 255]));

  const floorImage = new Image();
  floorImage.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, floorTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, floorImage);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  };
  floorImage.src = "../assets/textures/ground_dirt.jpg";

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  const floorSize = 100;
  const floor = new Floor(gl, texProgram, texLocs, floorTexture, floorSize);

  function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
  }

  // Helper to load JPEG textures asynchronously with a solid color fallback
  function loadTexture(gl, src, defaultColor) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(defaultColor));

    const img = new Image();
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

      // Check if texture dimensions are power of two
      if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      } else {
        // Safe NPOT settings for WebGL 1.0
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
    };
    img.src = src;
    return texture;
  }

  // Load all user requested JPEG textures from assets/textures/
  const houseTextures = {
    outside: loadTexture(gl, "../assets/textures/outsidewall.jpg", [220, 220, 220, 255]),
    floor: loadTexture(gl, "../assets/textures/floor.jpg", [139, 69, 19, 255]),
    livingRoom: loadTexture(gl, "../assets/textures/living_room.jpg", [240, 230, 210, 255]),
    screenmesh: loadTexture(gl, "../assets/textures/screenmesh.png", [128, 128, 128, 100]),
    rug: loadTexture(gl, "../assets/textures/rug.png", [133, 110, 95, 255]),
  };

  // --- HOUSE ---
  const house = new House(gl,
    { program: solidProgram, locs: solidLocs }, // Solid Resources
    { program: texProgram, locs: texLocs },     // Texture Resources
    houseTextures
  );

  // Compute initial world matrices immediately
  house.update(0);

  // Helper to find the closest interactable object that the camera is facing
  function getClosestInteractable(maxDist = 5.0) {
    const playerPos = camera.position;
    // Camera's horizontal forward vector on the X-Z plane (derived from camera.yaw)
    const forwardX = Math.cos(camera.yaw);
    const forwardZ = Math.sin(camera.yaw);

    let closestObj = null;
    let objType = null;
    let minDist = maxDist;

    // Helper to check if player is facing the target position within a 60-degree half-angle cone (dot >= 0.5)
    function isFacing(targetWorldPos, dotThreshold = 0.5) {
      const dx = targetWorldPos[0] - playerPos[0];
      const dz = targetWorldPos[2] - playerPos[2];
      const dist2D = Math.sqrt(dx * dx + dz * dz);
      if (dist2D > 0) {
        const dirX = dx / dist2D;
        const dirZ = dz / dist2D;
        const dot = forwardX * dirX + forwardZ * dirZ;
        return dot >= dotThreshold;
      }
      return true;
    }

    // 1. Doors (Check distance and facing towards doorknob if available)
    house.doors.forEach(door => {
      let doorWorldPos;
      if (door.knobBaseF && door.knobBaseF.worldMatrix) {
        doorWorldPos = vec3.fromValues(
          door.knobBaseF.worldMatrix[12],
          door.knobBaseF.worldMatrix[13],
          door.knobBaseF.worldMatrix[14]
        );
      } else {
        doorWorldPos = vec3.fromValues(
          door.worldMatrix[12],
          door.worldMatrix[13],
          door.worldMatrix[14]
        );
      }

      const dist = vec3.distance(playerPos, doorWorldPos);
      if (dist < minDist && isFacing(doorWorldPos, 0.5)) {
        minDist = dist;
        closestObj = door;
        objType = 'door';
      }
    });

    // 2. Lightswitches (Only interactable from the front side of the switch plate)
    if (house.lightswitches) {
      house.lightswitches.forEach(sw => {
        const swWorldPos = vec3.fromValues(
          sw.worldMatrix[12],
          sw.worldMatrix[13],
          sw.worldMatrix[14]
        );

        // Retrieve local +Z axis of the switch in world space to check if player is on the front side
        const switchFront = vec3.fromValues(
          sw.worldMatrix[8],
          sw.worldMatrix[9],
          sw.worldMatrix[10]
        );
        const toPlayer = vec3.create();
        vec3.subtract(toPlayer, playerPos, swWorldPos);
        const frontDot = vec3.dot(switchFront, toPlayer);

        if (frontDot > 0) {
          const dist = vec3.distance(playerPos, swWorldPos);
          if (dist < minDist && isFacing(swWorldPos, 0.5)) {
            minDist = dist;
            closestObj = sw;
            objType = 'lightswitch';
          }
        }
      });
    }

    // 3. Lamp
    if (house.livingRoomLamp) {
      const lampWorldPos = vec3.fromValues(
        house.livingRoomLamp.worldMatrix[12],
        house.livingRoomLamp.worldMatrix[13],
        house.livingRoomLamp.worldMatrix[14]
      );
      const dist = vec3.distance(playerPos, lampWorldPos);
      if (dist < minDist && isFacing(lampWorldPos, 0.5)) {
        minDist = dist;
        closestObj = house.livingRoomLamp;
        objType = 'lamp';
      }
    }

    // 4. TV (Only interactable from the front side of the TV screen)
    if (house.livingRoomTV) {
      const tvWorldPos = vec3.fromValues(
        house.livingRoomTV.worldMatrix[12],
        house.livingRoomTV.worldMatrix[13],
        house.livingRoomTV.worldMatrix[14]
      );

      // Retrieve local +Z axis of the TV in world space to check if player is in front of the screen
      const tvFront = vec3.fromValues(
        house.livingRoomTV.worldMatrix[8],
        house.livingRoomTV.worldMatrix[9],
        house.livingRoomTV.worldMatrix[10]
      );
      const toPlayer = vec3.create();
      vec3.subtract(toPlayer, playerPos, tvWorldPos);
      const frontDot = vec3.dot(tvFront, toPlayer);

      if (frontDot > 0) {
        const dist = vec3.distance(playerPos, tvWorldPos);
        if (dist < minDist && isFacing(tvWorldPos, 0.5)) {
          minDist = dist;
          closestObj = house.livingRoomTV;
          objType = 'tv';
        }
      }
    }

    return { obj: closestObj, type: objType };
  }

  // Listen for 'E' keypress to toggle closest interactable object (door, lightswitch, lamp, or TV) within reach and facing direction
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "e") {
      const { obj: closestObj, type: objType } = getClosestInteractable(5.0);
      if (closestObj) {
        closestObj.toggle();
        if (objType === 'lightswitch' && house.ceilingLight) {
          house.ceilingLight.toggle();
        }
        if (objType === 'door' && closestObj.isLocked) {
          lockedMessageTimer = 2.0;
        }
      }
    }
  });

  let then = 0;
  function render(time) {
    time *= 0.001;
    const deltaTime = time - then;
    then = time;

    // Advance door swinging animations
    house.update(deltaTime);

    // Update Camera (with dynamic door and static wall collisions, and walkable platforms)
    camera.update(deltaTime, house.getCollisionWalls(), house.getWalkableNodes());

    // Viewport Setup
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
    }
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Enable Depth testing and standard alpha blending for semi-transparent objects (screen doors, windows, etc...)
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Update HUD overlay interaction prompt based on door/lightswitch/lamp/TV proximity
    const promptDiv = document.querySelector("#interaction-prompt");
    if (promptDiv) {
      if (lockedMessageTimer > 0) {
        lockedMessageTimer -= deltaTime;
        promptDiv.textContent = "The door is locked.";
        promptDiv.style.display = "block";
      } else {
        const { obj: closestObj, type: objType } = getClosestInteractable(5.0);
        if (closestObj) {
          if (objType === 'door') {
            promptDiv.textContent = `Press [E] to ${closestObj.isOpen ? "Close" : "Open"} Door`;
          } else if (objType === 'lightswitch') {
            promptDiv.textContent = `Press [E] to Turn ${closestObj.isOn ? "Off" : "On"} Light`;
          } else if (objType === 'lamp') {
            promptDiv.textContent = `Press [E] to Turn ${closestObj.isOn ? "Off" : "On"} Lamp`;
          } else if (objType === 'tv') {
            promptDiv.textContent = `Press [E] to Turn ${closestObj.isOn ? "Off" : "On"} TV`;
          }
          promptDiv.style.display = "block";
        } else {
          promptDiv.style.display = "none";
        }
      }
    }

    const projectionMatrix = camera.getProjectionMatrix(gl);
    const viewMatrix = camera.getViewMatrix();

    // --- DRAW COMPONENTS ---
    skybox.draw(projectionMatrix, viewMatrix);

    gl.depthFunc(gl.LESS);
    const viewProjection = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix);
    floor.draw(gl, viewProjection);

    // Draw House 
    house.draw(gl, viewProjection);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main();
