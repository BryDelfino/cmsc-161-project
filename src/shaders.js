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
  uniform mat4 u_matrix;
  uniform mat4 u_worldMatrix;
  varying vec3 v_worldPos;
  void main() {
    gl_Position = u_matrix * a_position;
    v_worldPos = (u_worldMatrix * a_position).xyz;
  }
`;

const solidFragmentShaderSource = `
  #extension GL_OES_standard_derivatives : enable
  precision mediump float;
  
  varying vec3 v_worldPos;
  uniform vec4 u_color;
  
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
  
  void main() {
    vec3 normal = normalize(cross(dFdx(v_worldPos), dFdy(v_worldPos)));
    vec3 viewDir = normalize(u_viewPosition - v_worldPos);
    if (dot(normal, viewDir) < 0.0) {
      normal = -normal;
    }
    
    vec3 diffuseLight = vec3(0.0);
    vec3 specularLight = vec3(0.0);
    
    // 1. Ambient Directional Light
    {
      vec3 lightDir = normalize(-u_ambientLightDir);
      float diff = (u_twoSided > 0.5) ? abs(dot(normal, lightDir)) : max(dot(normal, lightDir), 0.0);
      diffuseLight += u_ambientLightColor * diff;
      
      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), max(u_shininess, 1.0));
      specularLight += u_ambientLightColor * u_specularStrength * spec;
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
    
    // 4. TV Light (Directional Light)
    if (u_tvLightOn > 0.5) {
      if (dot(v_worldPos - u_tvLightPos, u_tvLightDir) > 0.0) {
        vec3 lightDir = normalize(-u_tvLightDir);
        float diff = (u_twoSided > 0.5) ? abs(dot(normal, lightDir)) : max(dot(normal, lightDir), 0.0);
        diffuseLight += u_tvLightColor * diff;
        
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), max(u_shininess, 1.0));
        specularLight += u_tvLightColor * u_specularStrength * spec;
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
  uniform mat4 u_matrix;
  uniform mat4 u_worldMatrix;
  varying vec3 v_worldPos;
  varying vec2 v_texcoord;
  void main() {
    gl_Position = u_matrix * a_position;
    v_worldPos = (u_worldMatrix * a_position).xyz;
    v_texcoord = a_texcoord;
  }
`;

const texFragmentShaderSource = `
  #extension GL_OES_standard_derivatives : enable
  precision mediump float;
  
  varying vec3 v_worldPos;
  varying vec2 v_texcoord;
  
  uniform sampler2D u_texture;
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
  
  void main() {
    vec3 normal = normalize(cross(dFdx(v_worldPos), dFdy(v_worldPos)));
    vec3 viewDir = normalize(u_viewPosition - v_worldPos);
    if (dot(normal, viewDir) < 0.0) {
      normal = -normal;
    }
    
    vec4 baseColor = texture2D(u_texture, fract((v_texcoord * u_uvScale) + u_uvOffset));
    if (baseColor.a < 0.1) discard;
    
    vec3 diffuseLight = vec3(0.0);
    vec3 specularLight = vec3(0.0);
    
    // 1. Ambient Directional Light
    {
      vec3 lightDir = normalize(-u_ambientLightDir);
      float diff = (u_twoSided > 0.5) ? abs(dot(normal, lightDir)) : max(dot(normal, lightDir), 0.0);
      diffuseLight += u_ambientLightColor * diff;
      
      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), max(u_shininess, 1.0));
      specularLight += u_ambientLightColor * u_specularStrength * spec;
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
    
    // 4. TV Light (Directional Light)
    if (u_tvLightOn > 0.5) {
      if (dot(v_worldPos - u_tvLightPos, u_tvLightDir) > 0.0) {
        vec3 lightDir = normalize(-u_tvLightDir);
        float diff = (u_twoSided > 0.5) ? abs(dot(normal, lightDir)) : max(dot(normal, lightDir), 0.0);
        diffuseLight += u_tvLightColor * diff;
        
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), max(u_shininess, 1.0));
        specularLight += u_tvLightColor * u_specularStrength * spec;
      }
    }
    
    // Soft global ambient
    vec3 globalAmbient = vec3(0.12);
    
    vec3 finalColor = baseColor.rgb * mix(globalAmbient + diffuseLight, vec3(1.0), u_emissive) + specularLight;
    gl_FragColor = vec4(finalColor, baseColor.a);
  }
`;
