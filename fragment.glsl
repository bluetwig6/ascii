#version 300 es
precision mediump float;

uniform sampler2D u_image0; // original image
uniform sampler2D u_image1; // ascii image

// the texCoords passed in from the vertex shader.
in vec2 v_texCoord;
uniform vec2 u_resolution2; // resolution eg: (1024,1024)
uniform vec2 u_cellSize; // cellsize eg: (8,8)
uniform float u_charCount;
uniform float u_displayMode;
out vec4 outColor;

vec3 greyscale(vec3 color, float strength) {
    float g = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(color, vec3(g), strength);
}

vec3 greyscale(vec3 color) {
    return greyscale(color, 1.0);
}

void main() { 
  vec2 uv = v_texCoord; // current pixel
  vec2 cell = u_resolution2 / u_cellSize; // number of cells
  vec2 grid = 1.0 / cell; // 
  vec2 pixelizedUV = grid * (0.5 + floor(uv / grid));
  vec4 pixelized = texture(u_image0, pixelizedUV);

  float greyscaled = greyscale(pixelized.rgb).r; // give a number between 0 & 1
  
  float characterIndex = floor((u_charCount - 1.0) * greyscaled);
  
  // convert 0,1 range position to pixel position  
  vec2 pxUV = uv * u_resolution2;

  vec2 characterOffsets = vec2(mod( pxUV, u_cellSize)); // gives you the remainder of pxUV/cellsize

  // give the positions is pixels
  float xPos = characterOffsets.x  + (characterIndex * u_cellSize.x);
  float yPos = -characterOffsets.y;

  // convert pixel positions to 0,1 range 
  float spaceXPos = xPos/u_resolution2.x;
  float spaceYPos = -yPos/u_resolution2.y;

  vec2 charUV = vec2(spaceXPos, spaceYPos);
  vec4 asciiCharacter = texture(u_image1, charUV);

  if (u_displayMode == 0.0) {
        outColor = asciiCharacter;
  } else if(u_displayMode == 1.0) {
        outColor = mix(asciiCharacter, pixelized , 0.5);
  } else if(u_displayMode == 2.0) {
    outColor = vec4(
      min(asciiCharacter.r, pixelized.r),
      min(asciiCharacter.g, pixelized.g),
      min(asciiCharacter.b, pixelized.b),
      1.0
    );
  }else if(u_displayMode == 3.0) {
    outColor = vec4(
      asciiCharacter.r * pixelized.r,
      asciiCharacter.g * pixelized.g,
      asciiCharacter.b * pixelized.b,
      1.0
    );
  }
}