// 0. SHADOW SHADERS
const shadowVertexShaderSource = `
  attribute vec4 a_position;
  uniform mat4 u_matrix;
  void main() {
    gl_Position = u_matrix * a_position;
  }
`;

const shadowFragmentShaderSource = `
  precision mediump float;
  
  vec4 packDepth(const in float depth) {
    const vec4 bitShift = vec4(16777216.0, 65536.0, 256.0, 1.0);
    const vec4 bitMask = vec4(0.0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0);
    vec4 res = fract(depth * bitShift);
    res -= res.xxyz * bitMask;
    return res;
  }

  void main() {
    gl_FragColor = packDepth(gl_FragCoord.z);
  }
`;

// 1. SKYBOX SHADERS
const vertexShaderSource = `
  attribute vec4 a_position;
  varying vec4 v_position;
  void main() {
    v_position = a_position;
    gl_Position = a_position;
    gl_Position.z = 1.0;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform samplerCube u_skybox;
  uniform mat4 u_viewDirectionProjectionInverse;
  varying vec4 v_position;
  void main() {
    vec4 t = u_viewDirectionProjectionInverse * v_position;
    gl_FragColor = textureCube(u_skybox, normalize(t.xyz / t.w));
  }
`;

// 2. SOLID COLOR SHADERS
const solidVertexShaderSource = `
  attribute vec4 a_position;
  attribute vec3 a_normal;
  uniform mat4 u_matrix;
  uniform mat4 u_worldMatrix;
  uniform mat4 u_worldInverseTranspose;
  uniform mat4 u_lightMatrix;
  varying vec3 v_worldPos;
  varying vec3 v_normal;
  varying vec4 v_lightSpacePos;
  void main() {
    gl_Position = u_matrix * a_position;
    v_worldPos = (u_worldMatrix * a_position).xyz;
    v_normal = (u_worldInverseTranspose * vec4(a_normal, 0.0)).xyz;
    v_lightSpacePos = u_lightMatrix * u_worldMatrix * a_position;
  }
`;

const solidFragmentShaderSource = `
  precision mediump float;
  
  varying vec3 v_worldPos;
  varying vec3 v_normal;
  varying vec4 v_lightSpacePos;
  uniform vec4 u_color;
  uniform sampler2D u_shadowMap;
  
  // Lighting uniforms
  uniform vec3 u_viewPosition;
  
  // Ambient directional light (pointing to south wall)
  uniform vec3 u_ambientLightDir;
  uniform vec3 u_ambientLightColor;
  
  // Ceiling Light (Point light)
  uniform vec3 u_ceilingLightPos;
  uniform vec3 u_ceilingLightColor;
  uniform float u_ceilingLightOn;
  
  // Lamp Light (Point light)
  uniform vec3 u_lampLightPos;
  uniform vec3 u_lampLightColor;
  uniform float u_lampLightOn;
  
  // TV Light (Directional light)
  uniform vec3 u_tvLightDir;
  uniform vec3 u_tvLightPos;
  uniform vec3 u_tvLightColor;
  uniform float u_tvLightOn;
  
  // Material properties
  uniform float u_shininess;
  uniform float u_specularStrength;
  uniform float u_emissive;
  uniform float u_twoSided;
  
  float unpackDepth(const in vec4 rgbaDepth) {
    const vec4 bitShift = vec4(1.0 / 16777216.0, 1.0 / 65536.0, 1.0 / 256.0, 1.0);
    return dot(rgbaDepth, bitShift);
  }
  
  void main() {
    vec3 normal = normalize(v_normal);
    vec3 viewDir = normalize(u_viewPosition - v_worldPos);
    if (dot(normal, viewDir) < 0.0) {
      normal = -normal;
    }
    
    // Shadow map calculation
    vec3 projCoords = v_lightSpacePos.xyz / v_lightSpacePos.w;
    projCoords = projCoords * 0.5 + 0.5;
    float shadow = 0.0;
    if (projCoords.z <= 1.0 && projCoords.x >= 0.0 && projCoords.x <= 1.0 && projCoords.y >= 0.0 && projCoords.y <= 1.0) {
      float closestDepth = unpackDepth(texture2D(u_shadowMap, projCoords.xy));
      float bias = max(0.003 * (1.0 - dot(normal, normalize(-u_ambientLightDir))), 0.0005);
      if (projCoords.z - bias > closestDepth) {
        shadow = 1.0;
      }
    }
    
    vec3 diffuseLight = vec3(0.0);
    vec3 specularLight = vec3(0.0);
    
    float shadowStrength = 1.0;
    if (u_ceilingLightOn > 0.5) shadowStrength -= 0.35;
    if (u_lampLightOn > 0.5) shadowStrength -= 0.35;
    if (u_tvLightOn > 0.5) shadowStrength -= 0.2;
    shadowStrength = max(shadowStrength, 0.3);

    // 1. Ambient Directional Light
    {
      vec3 lightDir = normalize(-u_ambientLightDir);
      float diff = (u_twoSided > 0.5) ? abs(dot(normal, lightDir)) : max(dot(normal, lightDir), 0.0);
      diffuseLight += u_ambientLightColor * diff * (1.0 - shadow * shadowStrength);
      
      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), max(u_shininess, 1.0));
      specularLight += u_ambientLightColor * u_specularStrength * spec * (1.0 - shadow * shadowStrength);
    }
    
    // 2. Ceiling Light (Point Light)
    if (u_ceilingLightOn > 0.5) {
      vec3 lightDir = u_ceilingLightPos - v_worldPos;
      float dist = length(lightDir);
      lightDir = normalize(lightDir);
      
      float attenuation = 1.0 / (1.0 + 0.1 * dist + 0.02 * dist * dist);
      float diff = (u_twoSided > 0.5) ? abs(dot(normal, lightDir)) : max(dot(normal, lightDir), 0.0);
      diffuseLight += u_ceilingLightColor * diff * attenuation;
      
      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), max(u_shininess, 1.0));
      specularLight += u_ceilingLightColor * u_specularStrength * spec * attenuation;
    }
    
    // 3. Lamp Light (Point Light)
    if (u_lampLightOn > 0.5) {
      vec3 lightDir = u_lampLightPos - v_worldPos;
      float dist = length(lightDir);
      lightDir = normalize(lightDir);
      
      float attenuation = 1.0 / (1.0 + 0.1 * dist + 0.02 * dist * dist);
      float diff = (u_twoSided > 0.5) ? abs(dot(normal, lightDir)) : max(dot(normal, lightDir), 0.0);
      diffuseLight += u_lampLightColor * diff * attenuation;
      
      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), max(u_shininess, 1.0));
      specularLight += u_lampLightColor * u_specularStrength * spec * attenuation;
    }
    
    // 4. TV Light (Directional Light with range attenuation)
    if (u_tvLightOn > 0.5) {
      vec3 toLight = v_worldPos - u_tvLightPos;
      if (dot(toLight, u_tvLightDir) > 0.0) {
        float dist = length(toLight);
        vec3 lightDir = normalize(-u_tvLightDir);
        float attenuation = 1.0 / (1.0 + 0.3 * dist + 0.15 * dist * dist);
        float diff = (u_twoSided > 0.5) ? abs(dot(normal, lightDir)) : max(dot(normal, lightDir), 0.0);
        diffuseLight += u_tvLightColor * diff * attenuation;
        
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), max(u_shininess, 1.0));
        specularLight += u_tvLightColor * u_specularStrength * spec * attenuation;
      }
    }
    
    // Soft global ambient
    vec3 globalAmbient = vec3(0.12);
    
    vec3 finalColor = u_color.rgb * mix(globalAmbient + diffuseLight, vec3(1.0), u_emissive) + specularLight;
    gl_FragColor = vec4(finalColor, u_color.a);
  }
`;

// 3. TEXTURED OBJECT SHADERS
const texVertexShaderSource = `
  attribute vec4 a_position;
  attribute vec2 a_texcoord;
  attribute vec3 a_normal;
  uniform mat4 u_matrix;
  uniform mat4 u_worldMatrix;
  uniform mat4 u_worldInverseTranspose;
  uniform mat4 u_lightMatrix;
  varying vec3 v_worldPos;
  varying vec2 v_texcoord;
  varying vec3 v_normal;
  varying vec4 v_lightSpacePos;
  void main() {
    gl_Position = u_matrix * a_position;
    v_worldPos = (u_worldMatrix * a_position).xyz;
    v_texcoord = a_texcoord;
    v_normal = (u_worldInverseTranspose * vec4(a_normal, 0.0)).xyz;
    v_lightSpacePos = u_lightMatrix * u_worldMatrix * a_position;
  }
`;

const texFragmentShaderSource = `
  precision mediump float;
  
  varying vec3 v_worldPos;
  varying vec2 v_texcoord;
  varying vec3 v_normal;
  varying vec4 v_lightSpacePos;
  
  uniform sampler2D u_texture;
  uniform sampler2D u_shadowMap;
  uniform vec2 u_uvScale;
  uniform vec2 u_uvOffset;
  
  // Lighting uniforms
  uniform vec3 u_viewPosition;
  
  // Ambient directional light (pointing to south wall)
  uniform vec3 u_ambientLightDir;
  uniform vec3 u_ambientLightColor;
  
  // Ceiling Light (Point light)
  uniform vec3 u_ceilingLightPos;
  uniform vec3 u_ceilingLightColor;
  uniform float u_ceilingLightOn;
  
  // Lamp Light (Point light)
  uniform vec3 u_lampLightPos;
  uniform vec3 u_lampLightColor;
  uniform float u_lampLightOn;
  
  // TV Light (Directional light)
  uniform vec3 u_tvLightDir;
  uniform vec3 u_tvLightPos;
  uniform vec3 u_tvLightColor;
  uniform float u_tvLightOn;
  
  // Material properties
  uniform float u_shininess;
  uniform float u_specularStrength;
  uniform float u_emissive;
  uniform float u_twoSided;
  
  float unpackDepth(const in vec4 rgbaDepth) {
    const vec4 bitShift = vec4(1.0 / 16777216.0, 1.0 / 65536.0, 1.0 / 256.0, 1.0);
    return dot(rgbaDepth, bitShift);
  }
  
  void main() {
    vec3 normal = normalize(v_normal);
    vec3 viewDir = normalize(u_viewPosition - v_worldPos);
    if (dot(normal, viewDir) < 0.0) {
      normal = -normal;
    }
    
    vec4 baseColor = texture2D(u_texture, fract((v_texcoord * u_uvScale) + u_uvOffset));
    if (baseColor.a < 0.1) discard;
    
    // Shadow map calculation
    vec3 projCoords = v_lightSpacePos.xyz / v_lightSpacePos.w;
    projCoords = projCoords * 0.5 + 0.5;
    float shadow = 0.0;
    if (projCoords.z <= 1.0 && projCoords.x >= 0.0 && projCoords.x <= 1.0 && projCoords.y >= 0.0 && projCoords.y <= 1.0) {
      float closestDepth = unpackDepth(texture2D(u_shadowMap, projCoords.xy));
      float bias = max(0.003 * (1.0 - dot(normal, normalize(-u_ambientLightDir))), 0.0005);
      if (projCoords.z - bias > closestDepth) {
        shadow = 1.0;
      }
    }
    
    vec3 diffuseLight = vec3(0.0);
    vec3 specularLight = vec3(0.0);
    
    float shadowStrength = 1.0;
    if (u_ceilingLightOn > 0.5) shadowStrength -= 0.35;
    if (u_lampLightOn > 0.5) shadowStrength -= 0.35;
    if (u_tvLightOn > 0.5) shadowStrength -= 0.2;
    shadowStrength = max(shadowStrength, 0.3);

    // 1. Ambient Directional Light
    {
      vec3 lightDir = normalize(-u_ambientLightDir);
      float diff = (u_twoSided > 0.5) ? abs(dot(normal, lightDir)) : max(dot(normal, lightDir), 0.0);
      diffuseLight += u_ambientLightColor * diff * (1.0 - shadow * shadowStrength);
      
      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), max(u_shininess, 1.0));
      specularLight += u_ambientLightColor * u_specularStrength * spec * (1.0 - shadow * shadowStrength);
    }
    
    // 2. Ceiling Light (Point Light)
    if (u_ceilingLightOn > 0.5) {
      vec3 lightDir = u_ceilingLightPos - v_worldPos;
      float dist = length(lightDir);
      lightDir = normalize(lightDir);
      
      float attenuation = 1.0 / (1.0 + 0.1 * dist + 0.02 * dist * dist);
      float diff = (u_twoSided > 0.5) ? abs(dot(normal, lightDir)) : max(dot(normal, lightDir), 0.0);
      diffuseLight += u_ceilingLightColor * diff * attenuation;
      
      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), max(u_shininess, 1.0));
      specularLight += u_ceilingLightColor * u_specularStrength * spec * attenuation;
    }
    
    // 3. Lamp Light (Point Light)
    if (u_lampLightOn > 0.5) {
      vec3 lightDir = u_lampLightPos - v_worldPos;
      float dist = length(lightDir);
      lightDir = normalize(lightDir);
      
      float attenuation = 1.0 / (1.0 + 0.1 * dist + 0.02 * dist * dist);
      float diff = (u_twoSided > 0.5) ? abs(dot(normal, lightDir)) : max(dot(normal, lightDir), 0.0);
      diffuseLight += u_lampLightColor * diff * attenuation;
      
      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), max(u_shininess, 1.0));
      specularLight += u_lampLightColor * u_specularStrength * spec * attenuation;
    }
    
    // 4. TV Light (Directional Light with range attenuation)
    if (u_tvLightOn > 0.5) {
      vec3 toLight = v_worldPos - u_tvLightPos;
      if (dot(toLight, u_tvLightDir) > 0.0) {
        float dist = length(toLight);
        vec3 lightDir = normalize(-u_tvLightDir);
        float attenuation = 1.0 / (1.0 + 0.3 * dist + 0.15 * dist * dist);
        float diff = (u_twoSided > 0.5) ? abs(dot(normal, lightDir)) : max(dot(normal, lightDir), 0.0);
        diffuseLight += u_tvLightColor * diff * attenuation;
        
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), max(u_shininess, 1.0));
        specularLight += u_tvLightColor * u_specularStrength * spec * attenuation;
      }
    }
    
    // Soft global ambient
    vec3 globalAmbient = vec3(0.12);
    
    vec3 finalColor = baseColor.rgb * mix(globalAmbient + diffuseLight, vec3(1.0), u_emissive) + specularLight;
    gl_FragColor = vec4(finalColor, baseColor.a);
  }
`;
