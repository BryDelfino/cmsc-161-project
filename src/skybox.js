class Skybox {
  constructor(gl, program, locs, faceUrls) {
    this.gl = gl;
    this.program = program;
    this.locs = locs;

    // Create a 2D quad covering the screen
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

    this.texture = this.loadCubemap(faceUrls);
  }

  loadCubemap(urls) {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

    const faceInfos = [
      { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: urls[0] },
      { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: urls[1] },
      { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: urls[2] },
      { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: urls[3] },
      { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: urls[4] },
      { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: urls[5] },
    ];

    faceInfos.forEach((face) => {
      // Placeholder while loading
      gl.texImage2D(face.target, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = face.url;
      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texImage2D(face.target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      };
    });

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    return texture;
  }

  draw(projectionMatrix, viewMatrix) {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.enableVertexAttribArray(this.locs.pos);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.vertexAttribPointer(this.locs.pos, 2, gl.FLOAT, false, 0, 0);

    // Remove translation from view matrix for skybox
    const skyboxView = mat4.clone(viewMatrix);
    skyboxView[12] = 0; skyboxView[13] = 0; skyboxView[14] = 0;
    
    const viewProjInv = mat4.invert(mat4.create(), mat4.multiply(mat4.create(), projectionMatrix, skyboxView));
    gl.uniformMatrix4fv(this.locs.viewInv, false, viewProjInv);
    gl.uniform1i(this.locs.tex, 0);
    
    gl.depthFunc(gl.LEQUAL);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}
