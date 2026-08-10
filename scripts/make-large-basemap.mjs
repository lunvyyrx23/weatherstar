import sharp from "sharp";

const input = "public/bg/us-gray-blue-map.webp";
const output = "public/bg/us-gray-blue-map-large.webp";

await sharp(input)
  .resize({
    width: 8192,
    withoutEnlargement: false,
    kernel: "lanczos3"
  })
  .webp({
    quality: 95,
    effort: 6
  })
  .toFile(output);

console.log("Created", output);
