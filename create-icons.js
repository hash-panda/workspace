const fs = require('fs');
const path = require('path');

// Simple PNG generator - creates basic colored square icons
// This is a minimal implementation for placeholder icons

function writePngHeader(width, height) {
  const buf = Buffer.alloc(8);
  buf.writeUInt8(0x89, 0); // PNG signature
  buf.writeUInt8(0x50, 1);
  buf.writeUInt8(0x4E, 2);
  buf.writeUInt8(0x47, 3);
  buf.writeUInt8(0x0D, 4);
  buf.writeUInt8(0x0A, 5);
  buf.writeUInt8(0x1A, 6);
  buf.writeUInt8(0x0A, 7);
  return buf;
}

function writeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');

  const crc = require('zlib').crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function writeIHDR(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data.writeUInt8(8, 8);  // bit depth
  data.writeUInt8(2, 9);  // color type (RGB)
  data.writeUInt8(0, 10); // compression
  data.writeUInt8(0, 11); // filter
  data.writeUInt8(0, 12); // interlace
  return writeChunk('IHDR', data);
}

function createSimplePng(width, height, color) {
  const ihdr = writeIHDR(width, height);

  // Create pixel data (solid color)
  const row = Buffer.alloc(width * 3);
  for (let i = 0; i < width; i++) {
    row[i * 3] = color.r;
    row[i * 3 + 1] = color.g;
    row[i * 3 + 2] = color.b;
  }

  let pixelData = Buffer.alloc(0);
  for (let i = 0; i < height; i++) {
    const filter = Buffer.from([0]); // None filter
    const deflated = require('zlib').deflateSync(Buffer.concat([filter, row]));
    pixelData = Buffer.concat([pixelData, deflated]);
  }

  const idat = writeChunk('IDAT', pixelData);
  const iend = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([writePngHeader(width, height), ihdr, idat, iend]);
}

// Create icons
const iconsDir = path.join(__dirname, 'article-illustrator', 'images');

// icon-home.png (gray)
const homeIcon = createSimplePng(81, 81, { r: 102, g: 102, b: 102 });
fs.writeFileSync(path.join(iconsDir, 'icon-home.png'), homeIcon);

// icon-home-active.png (blue)
const homeActive = createSimplePng(81, 81, { r: 74, g: 144, b: 226 });
fs.writeFileSync(path.join(iconsDir, 'icon-home-active.png'), homeActive);

// icon-preview.png (gray)
const previewIcon = createSimplePng(81, 81, { r: 102, g: 102, b: 102 });
fs.writeFileSync(path.join(iconsDir, 'icon-preview.png'), previewIcon);

// icon-preview-active.png (blue)
const previewActive = createSimplePng(81, 81, { r: 74, g: 144, b: 226 });
fs.writeFileSync(path.join(iconsDir, 'icon-preview-active.png'), previewActive);

console.log('✅ Icons created successfully!');
console.log('📁 Location:', iconsDir);
console.log('📝 Note: These are placeholder icons. Replace them with proper icon designs for production.');
