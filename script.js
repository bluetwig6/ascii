import { chars } from "./charlist";
import { drawScene } from "./drawScene";
import fragmentSource from "./fragment.glsl?raw";
import { initBuffers } from "./init-buffers";
import { initShaderProgram } from "./initshaderprogram";
import vertexSource from "./vertex.glsl?raw";

const cellSizeInput = document.querySelector("#cellSizeInput");
const fontSizeInput = document.querySelector("#fontSizeInput");
const cellSizeValueSpan = document.querySelector("#cellSizeValue");
const fontSizeValueSpan = document.querySelector("#fontSizeValue");
const imageFitInput = document.querySelector("#fit");
const pauseButton = document.querySelector("#pause");
const displayModeRadioButtons = document.querySelectorAll("[name=displayMode]");

let pauseRender = false

var CELL_SIZE = cellSizeInput.value;
var FONT_SIZE = fontSizeInput.value;
const CHAR_LIST = chars
const CHAR_COUNT = CHAR_LIST.length;
let deltaTime = 0;
let copyVideo = false;

let myReq; // holds the request animation frame
let video; // hold the video object
let displayMode = 0; // show color in the cell background
var aspectRatioMultiplier = 1;
var imageFit;
imageFit = imageFitInput.value; // set initial value
var videoHasStartedPlaying = false;
let PREVIOUS_TIME;

pauseButton.addEventListener("click", () => {
  if (video.paused) {
    pauseButton.innerHTML = "PAUSE";
    video.play();
  } else {
    pauseButton.innerHTML = "RESUME";
    video.pause();
  }
});

const setAspectRatioMultiplier = () => {
  const canvasWrapper = document.querySelector("#canvasWrapper");
  const wrapperHeight = canvasWrapper.offsetHeight;
  const wrapperWidth = canvasWrapper.offsetWidth;
  const videoHeight = video.videoHeight;
  const videoWidth = video.videoWidth;
  const heightRunoffPerc = (videoHeight - wrapperHeight) / videoHeight;
  const widthRunoffPerc = (videoWidth - wrapperWidth) / videoWidth;
  const outPercentage = Math.min(
    1,
    1 - Math.max(heightRunoffPerc, widthRunoffPerc)
  );
  aspectRatioMultiplier = outPercentage;
};

const resetAspectRatioMultiplier = () => {
  aspectRatioMultiplier = 1;
};

imageFitInput.addEventListener("change", (event) => {
  if (!video) {
    return;
  }
  switch (event.target.value) {
    case "fit-to-screen":
      imageFit = "fit-to-screen";
      setAspectRatioMultiplier();
      cancelAnimationFrame(myReq);
      setupASCIIImage(video);
      break;
    case "original":
      imageFit = "original";
      resetAspectRatioMultiplier();
      cancelAnimationFrame(myReq);
      setupASCIIImage(video);
      break;
    default:
      imageFit = "fit-to-screen";
      setAspectRatioMultiplier();
      cancelAnimationFrame(myReq);
      setupASCIIImage(video);
      break;
  }
});

displayModeRadioButtons.forEach((input) => {
  input.addEventListener("change", (e) => {
    switch (e.target.value) {
      case "default":
        displayMode = 0.0;
        return;
      case "colorCellBackground":
        displayMode = 1.0;
        return;
      case "colorText":
        displayMode = 2.0;
      case "multiply":
        displayMode = 3.0;
        return;
    }
  });
});

cellSizeInput.addEventListener("input", (event) => {
  CELL_SIZE = Number(event.target.value);
  cellSizeValueSpan.innerHTML = CELL_SIZE;
  // console.log('stopping render', myReq)
  cancelAnimationFrame(myReq); // this does not stop the queued reqAnimationFrames. Need pauseRender flag to pause them
  pauseRender = true
  setupASCIIImage(video);
});

fontSizeInput.addEventListener("input", (event) => {
  FONT_SIZE = Number(event.target.value);
  fontSizeValueSpan.innerHTML = FONT_SIZE;
  // console.log('stopping render', myReq)
  cancelAnimationFrame(myReq);
  pauseRender = true
  setupASCIIImage(video);
});


window.onresize = () => {
  if (video && imageFit === "fit-to-screen") {
    setAspectRatioMultiplier();
    cancelAnimationFrame(myReq);
    setupASCIIImage(video);
  }
};

function setupVideo(url = "./video.mp4") {
  PREVIOUS_TIME = null;
  video = document.createElement("video");

  let playing = false;
  let timeupdate = false;

  video.playsInline = true;
  // video.muted = true;
  video.loop = true;

  // Waiting for these 2 events ensures
  // there is data in the video
  // console.log("loading video");
  videoHasStartedPlaying = false;
  video.addEventListener(
    "playing",
    () => {
      if (videoHasStartedPlaying) {
      } else {
        videoHasStartedPlaying = true;
        // console.log("playing video");
        setAspectRatioMultiplier();
        setupASCIIImage(video);
        playing = true;
        checkReady();
      }
    },
    true
  );

  video.addEventListener(
    "timeupdate",
    (e) => {
      timeupdate = true;
      checkReady();
    },
    true
  );

  video.src = url;
  video.muted = true;
  video.play();

  function checkReady() {
    if (playing && timeupdate) {
      copyVideo = true;
    }
  }

  return video;
}

function initTexture(gl) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because video has to be download over the internet
  // they might take a moment until it's ready so
  // put a single pixel in the texture so we can
  // use it immediately.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel
  );

  // Turn off mips and set wrapping to clamp to edge so it
  // will work regardless of the dimensions of the video.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  return texture;
}

function updateTexture(gl, texture, video) {
  const level = 0;
  const internalFormat = gl.RGBA;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    srcFormat,
    srcType,
    video
  );
}

const setupASCIIImage = (video) => {
  // setup ascii texture
  /** @type {HTMLCanvasElement} */
  var c = document.querySelector("#canvas2");
  var ctx = c.getContext("2d");
  c.height = video.videoHeight * aspectRatioMultiplier;
  c.width = video.videoWidth * aspectRatioMultiplier;
  ctx.scale(aspectRatioMultiplier, aspectRatioMultiplier); // scale down the canvas

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, video.videoWidth, video.videoHeight);
  // setup ascii texture
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.font = `${FONT_SIZE}px arial`;
  CHAR_LIST.forEach((char, idx) => {
    ctx.fillText(char, idx * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2);
  });
  const asciiImage = new Image();
  asciiImage.src = c
    .toDataURL("image/png")
    .replace("image/png", "image/octet-stream"); // here is the most important part because if you dont replace you will get a DOM 18 exception.
  asciiImage.onload = function () {
    main(video, asciiImage);
  };
  return asciiImage;
};

let shaderProgram
let programInfo
  var texture
  var asciiTexture
function main(video, asciiImage) {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  canvas.width = video.videoWidth * aspectRatioMultiplier;
  canvas.height = video.videoHeight * aspectRatioMultiplier;

  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  if(!shaderProgram) {

  // setup GLSL program
  shaderProgram = initShaderProgram(gl, vertexSource, fragmentSource);
  programInfo = {
    program: shaderProgram,
    attriblocations: {
      positionLocation: gl.getAttribLocation(shaderProgram, "a_position"),
      texcoordLocation: gl.getAttribLocation(shaderProgram, "a_texCoord"),
    },
    uniformLocations: {
      textureSizeLocation: gl.getUniformLocation(
        shaderProgram,
        "u_textureSize"
      ),
      cellSizeLocation: gl.getUniformLocation(shaderProgram, "u_cellSize"),
      charCountLocation: gl.getUniformLocation(shaderProgram, "u_charCount"),
      displayModeLocation: gl.getUniformLocation(
        shaderProgram,
        "u_displayMode"
      ),
      u_image0Location: gl.getUniformLocation(shaderProgram, "u_image0"),
      u_image1Location: gl.getUniformLocation(shaderProgram, "u_image1"),
      resolutionLocation: gl.getUniformLocation(shaderProgram, "u_resolution"),
      resolutionLocation2: gl.getUniformLocation(
        shaderProgram,
        "u_resolution2"
      ),
    },
  }

  };

  gl.useProgram(shaderProgram);

  const buffers = initBuffers(
    gl,
    video.videoWidth * aspectRatioMultiplier,
    video.videoHeight * aspectRatioMultiplier
  );

    texture = initTexture(gl);
    asciiTexture = initTexture(gl);
  
  // console.log('updating texture',gl,asciiTexture,asciiImage)
  updateTexture(gl, asciiTexture, asciiImage);

  // Draw the scene repeatedly
  function render() {
    if(pauseRender) { return }
    // console.log('rendering')
    // run only when video frame changes
    if (PREVIOUS_TIME !== video.currentTime) {
      PREVIOUS_TIME = video.currentTime;
      if (copyVideo) {
        updateTexture(gl, texture, video);
      }
      drawScene(
        gl,
        programInfo,
        buffers,
        texture,
        asciiTexture,
        video,
        CELL_SIZE * aspectRatioMultiplier,
        CHAR_COUNT,
        displayMode
      );
    }

    myReq = requestAnimationFrame(render);
  }
    // console.log('starting render')
    pauseRender = false
  requestAnimationFrame(render);
}

const fileInput = document.querySelector("#fileInput");
// console.log(fileInput.file);

fileInput.addEventListener("change", () => {
  if (fileInput.files.length === 1) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.addEventListener(
      "load",
      () => {
        cancelAnimationFrame(myReq)
        // convert image file to base64 string
        setupVideo(reader.result);
      },
      false
    );

    if (file) {
      reader.readAsDataURL(file);
    }
  }
});
