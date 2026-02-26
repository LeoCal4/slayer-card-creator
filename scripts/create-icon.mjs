/**
 * Generates resources/icon.ico — a multi-size solid-indigo placeholder.
 * Sizes: 16, 32, 48, 256 px.  Format: DIB (32-bit BGRA) embedded in ICO.
 *
 * Run once: node scripts/create-icon.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'

const [R, G, B] = [0x4f, 0x46, 0xe5] // indigo #4f46e5
const SIZES = [16, 32, 48, 256]

function makeDib(size) {
  // BITMAPINFOHEADER — 40 bytes
  const hdr = Buffer.alloc(40)
  hdr.writeUInt32LE(40, 0)              // biSize
  hdr.writeInt32LE(size, 4)             // biWidth
  hdr.writeInt32LE(size * 2, 8)         // biHeight: image + mask stacked
  hdr.writeUInt16LE(1, 12)              // biPlanes
  hdr.writeUInt16LE(32, 14)             // biBitCount
  hdr.writeUInt32LE(0, 16)              // biCompression (BI_RGB)
  hdr.writeUInt32LE(size * size * 4, 20) // biSizeImage

  // XOR (image) data: rows bottom-to-top, BGRA
  const pixels = Buffer.alloc(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    pixels[i * 4 + 0] = B
    pixels[i * 4 + 1] = G
    pixels[i * 4 + 2] = R
    pixels[i * 4 + 3] = 255
  }

  // AND (transparency) mask: 0 = opaque, rows bottom-to-top
  // Row stride padded to 4-byte boundary
  const maskStride = Math.ceil(Math.ceil(size / 8) / 4) * 4
  const andMask = Buffer.alloc(maskStride * size, 0)

  return Buffer.concat([hdr, pixels, andMask])
}

const images = SIZES.map(makeDib)
const count = images.length

// ICO header (6 bytes)
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)      // reserved
header.writeUInt16LE(1, 2)      // type = ICO
header.writeUInt16LE(count, 4)  // image count

// Directory entries (16 bytes × count)
const dirSize = count * 16
const dirs = Buffer.alloc(dirSize)
let offset = 6 + dirSize
for (let i = 0; i < count; i++) {
  const sz = SIZES[i]
  const imgSize = images[i].length
  dirs.writeUInt8(sz === 256 ? 0 : sz, i * 16 + 0)  // bWidth  (0 = 256)
  dirs.writeUInt8(sz === 256 ? 0 : sz, i * 16 + 1)  // bHeight (0 = 256)
  dirs.writeUInt8(0, i * 16 + 2)                     // bColorCount
  dirs.writeUInt8(0, i * 16 + 3)                     // bReserved
  dirs.writeUInt16LE(1, i * 16 + 4)                  // wPlanes
  dirs.writeUInt16LE(32, i * 16 + 6)                 // wBitCount
  dirs.writeUInt32LE(imgSize, i * 16 + 8)            // dwBytesInRes
  dirs.writeUInt32LE(offset, i * 16 + 12)            // dwImageOffset
  offset += imgSize
}

mkdirSync('resources', { recursive: true })
const ico = Buffer.concat([header, dirs, ...images])
writeFileSync('resources/icon.ico', ico)
console.log(`Created resources/icon.ico  (${ico.length} bytes, sizes: ${SIZES.join(', ')}px)`)
