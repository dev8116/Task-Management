const path = require("path");
const faceapi = require("face-api.js");
const tf = require("@tensorflow/tfjs");
const canvas = require("canvas");

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const MODEL_PATH = path.join(__dirname, "..", "models", "face-api");
let modelsLoaded = false;

async function loadModels() {
  if (modelsLoaded) return;
  await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
  modelsLoaded = true;
}

async function getDescriptor(buffer) {
  await loadModels();
  const img = await canvas.loadImage(buffer);
  const detection = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;
  return detection.descriptor;
}

async function compareFaces(selfieBuffer, referenceBuffer, threshold = 0.55) {
  const [selfieDesc, refDesc] = await Promise.all([
    getDescriptor(selfieBuffer),
    getDescriptor(referenceBuffer),
  ]);

  if (!selfieDesc || !refDesc) {
    return { matched: false, distance: null, reason: "Face not detected" };
  }

  const distance = faceapi.euclideanDistance(selfieDesc, refDesc);
  return { matched: distance <= threshold, distance, reason: null };
}

module.exports = { compareFaces };