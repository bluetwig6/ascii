import { drawScene } from "./drawScene";
import fragmentSource from "./fragment.glsl?raw";
import { initBuffers } from "./init-buffers";
import { initShaderProgram } from "./initshaderprogram";
import vertexSource from "./vertex.glsl?raw";
let deltaTime = 0;
let copyVideo = false;

const cellSizeInput = document.querySelector("#cellSizeInput");
const fontSizeInput = document.querySelector("#fontSizeInput");

const cellSizeValueSpan = document.querySelector("#cellSizeValue");
const fontSizeValueSpan = document.querySelector("#fontSizeValue");

var CELL_SIZE = cellSizeInput.value;
var FONT_SIZE = fontSizeInput.value;

let myReq; // holds the request animation frame
let video; // hold the video object
let displayMode = 0; // show color in the cell background

var aspectRatioMultiplier = 1;
var imageFit;

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

const imageFitInput = document.querySelector("#fit");
imageFit = imageFitInput.value // set initial value

imageFitInput.addEventListener("change", (event) => {
  if(!video) { return }
  switch (event.target.value) {
    case "fit-to-screen":
      imageFit = 'fit-to-screen'
      setAspectRatioMultiplier();
      cancelAnimationFrame(myReq);
      setupASCIIImage(video);
      break;
    case "original":
      imageFit = 'original'
      resetAspectRatioMultiplier();
      cancelAnimationFrame(myReq);
      setupASCIIImage(video);
      break;
    default:
      imageFit = 'fit-to-screen'
      setAspectRatioMultiplier();
      cancelAnimationFrame(myReq);
      setupASCIIImage(video);
      break
  }
});

const displayModeRadioButtons = document.querySelectorAll("[name=displayMode]");
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
  cancelAnimationFrame(myReq);
  setupASCIIImage(video);
});

fontSizeInput.addEventListener("input", (event) => {
  FONT_SIZE = Number(event.target.value);
  fontSizeValueSpan.innerHTML = FONT_SIZE;
  cancelAnimationFrame(myReq);
  setupASCIIImage(video);
});

// const CHAR_LIST = [' ', '!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?', '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\\', ']', '^', '_', '`', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '{', '|', '}', '~']
const CHAR_LIST = [
  " ",
  "`",
  ".",
  "-",
  "'",
  ":",
  "_",
  ",",
  "^",
  "=",
  ";",
  ">",
  "<",
  "+",
  "!",
  "r",
  "c",
  "*",
  "/",
  "z",
  "?",
  "s",
  "L",
  "T",
  "v",
  ")",
  "J",
  "7",
  "(",
  "|",
  "F",
  "i",
  "{",
  "C",
  "}",
  "f",
  "I",
  "3",
  "1",
  "t",
  "l",
  "u",
  "[",
  "n",
  "e",
  "o",
  "Z",
  "5",
  "Y",
  "x",
  "j",
  "y",
  "a",
  "]",
  "2",
  "E",
  "S",
  "w",
  "q",
  "k",
  "P",
  "6",
  "h",
  "9",
  "d",
  "4",
  "V",
  "p",
  "O",
  "G",
  "b",
  "U",
  "A",
  "K",
  "X",
  "H",
  "m",
  "8",
  "R",
  "D",
  "#",
  "$",
  "B",
  "g",
  "0",
  "M",
  "N",
  "W",
  "Q",
  "%",
  "&",
  "@",
];

const CHAR_COUNT = CHAR_LIST.length;
console.log(CHAR_LIST);

let PREVIOUS_TIME;

window.onresize = () => {
  if (video && (imageFit === 'fit-to-screen')) {
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
  console.log("loading video");

  video.addEventListener(
    "playing",
    () => {
      console.log(video);
      console.log("playing video");
      setAspectRatioMultiplier();
      setupASCIIImage(video);
      playing = true;
      checkReady();
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

  // setup GLSL program
  const shaderProgram = initShaderProgram(gl, vertexSource, fragmentSource);
  const programInfo = {
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
  };

  gl.useProgram(shaderProgram);

  const buffers = initBuffers(
    gl,
    video.videoWidth * aspectRatioMultiplier,
    video.videoHeight * aspectRatioMultiplier
  );

  var texture = initTexture(gl);
  var asciiTexture = initTexture(gl);
  updateTexture(gl, asciiTexture, asciiImage);

  // Draw the scene repeatedly
  function render() {
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

  myReq = requestAnimationFrame(render);
}

const fileInput = document.querySelector("#fileInput");
console.log(fileInput.file);

fileInput.addEventListener("change", () => {
  if (fileInput.files.length === 1) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.addEventListener(
      "load",
      () => {
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
