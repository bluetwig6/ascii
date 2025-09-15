function initBuffers(gl, width, height) {
  const positionBuffer = initPositionBuffer(gl, 0, 0, width, height);
  const textureCoordBuffer = initTextureBuffer(gl);

  return {
    position: positionBuffer,
    textureCoord: textureCoordBuffer,
  };
}


const initPositionBuffer = (gl, x = 0, y = 0, width, height) => {
  // Create a buffer to put three 2d clip space points in
  const positionBuffer = gl.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    x1, y1,
    x2, y1,
    x1, y2,
    x1, y2,
    x2, y1,
    x2, y2,
  ]), gl.STATIC_DRAW);
  return positionBuffer
}

const initTextureBuffer = (gl) => {
      // provide texture coordinates for the rectangle.
  var textureCoordBuffer  = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    0.0, 1.0,
    1.0, 0.0,
    1.0, 1.0,
  ]), gl.STATIC_DRAW);
  return textureCoordBuffer
}

export { initBuffers}