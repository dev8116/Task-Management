const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const { compareFaces } = require('./faceMatch');

const readRemote = (url) =>
  new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib
      .get(url, (res) => {
        const data = [];
        res.on('data', (c) => data.push(c));
        res.on('end', () => resolve(Buffer.concat(data)));
      })
      .on('error', reject);
  });

async function getAvatarBuffer(avatar) {
  if (!avatar) return null;

  if (avatar.startsWith('http')) return readRemote(avatar);

  const safePath = avatar.replace(/^\//, '');
  const filePath = path.join(__dirname, '..', safePath);

  if (!fs.existsSync(filePath)) return null;
  return fs.promises.readFile(filePath);
}

/**
 * Modular helper (as requested).
 * You can later replace internals with face-api.js service, CompreFace, python API etc.
 */
async function verifyEmployeeFace(profileImage, selfieImageBuffer) {
  if (!selfieImageBuffer) {
    return { ok: false, reason: 'Selfie image is required' };
  }

  const refBuffer = await getAvatarBuffer(profileImage);
  if (!refBuffer) {
    return { ok: false, reason: 'Profile photo not found on server. Please upload avatar first.' };
  }

  const result = await compareFaces(selfieImageBuffer, refBuffer);
  if (!result.matched) {
    return { ok: false, reason: result.reason || 'Face not matched' };
  }

  return { ok: true, reason: '' };
}

module.exports = {
  verifyEmployeeFace,
};