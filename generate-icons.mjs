import sharp from 'sharp'

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="115" fill="#7F77DD"/>
  <text x="256" y="340" font-family="Arial,sans-serif" font-size="280" font-weight="700" fill="white" text-anchor="middle">M</text>
</svg>`

const buf = Buffer.from(svg)

await sharp(buf).resize(192,192).png().toFile('public/icon-192.png')
await sharp(buf).resize(512,512).png().toFile('public/icon-512.png')

console.log('Icone generate!')