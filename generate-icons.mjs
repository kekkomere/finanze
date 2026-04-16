import sharp from 'sharp'

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="115" fill="#7F77DD"/>
  <rect x="140" y="140" width="50" height="232" rx="10" fill="white"/>
  <rect x="321" y="140" width="50" height="232" rx="10" fill="white"/>
  <polygon points="140,140 165,140 256,260 347,140 372,140 372,175 256,295 140,175" fill="white"/>
</svg>`

const buf = Buffer.from(svg)
await sharp(buf).resize(192,192).png().toFile('public/icon-192.png')
await sharp(buf).resize(512,512).png().toFile('public/icon-512.png')
console.log('Icone generate!')