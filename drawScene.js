const drawScene = (gl, programInfo, buffers, texture, asciiTexture, video, CELL_SIZE, CHAR_COUNT, displayMode) => {
  console.log('dm: ',displayMode)
    // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Turn on the position attribute
  gl.enableVertexAttribArray(programInfo.attriblocations.positionLocation);

  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

  // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
    programInfo.attriblocations.positionLocation, size, type, normalize, stride, offset);

  // Turn on the texcoord attribute
  gl.enableVertexAttribArray(programInfo.attriblocations.texcoordLocation);

  // bind the texcoord buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);

  // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
    programInfo.attriblocations.texcoordLocation, size, type, normalize, stride, offset);

  // set the resolution
  gl.uniform2f(programInfo.uniformLocations.resolutionLocation, gl.canvas.width, gl.canvas.height);
  gl.uniform2f(programInfo.uniformLocations.resolutionLocation2, gl.canvas.width, gl.canvas.height);

  // set the size of the image
  gl.uniform2f(programInfo.uniformLocations.textureSizeLocation, video.videoWidth, video.videoHeight);

  // set the cell size
  gl.uniform2f(programInfo.uniformLocations.cellSizeLocation, parseFloat(CELL_SIZE), parseFloat(CELL_SIZE));
  gl.uniform1f(programInfo.uniformLocations.charCountLocation, CHAR_COUNT);
  gl.uniform1f(programInfo.uniformLocations.displayModeLocation, displayMode);

  // set which texture units to render with.
  gl.uniform1i(programInfo.uniformLocations.u_image0Location, 0);  // texture unit 0
  gl.uniform1i(programInfo.uniformLocations.u_image1Location, 1);  // texture unit 1

  // Set each texture unit to use a particular texture.
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, asciiTexture);
  // Draw the rectangle.
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 6;
  gl.drawArrays(primitiveType, offset, count);
}

export { drawScene }