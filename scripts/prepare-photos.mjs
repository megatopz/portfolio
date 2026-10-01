import sharp from 'sharp';

// Crops remove the t-shirt logo at the bottom of each photo (see spec: Inventário).
const jobs = [
  { input: 'assets-src/eu.jpeg', output: 'src/assets/photos/eu.jpg', height: 1340 },
  { input: 'assets-src/eu2.jpeg', output: 'src/assets/photos/eu2.jpg', height: 1370 },
];

for (const { input, output, height } of jobs) {
  const { width } = await sharp(input).metadata();
  await sharp(input)
    .extract({ left: 0, top: 0, width, height })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(output);
  console.log(`✓ ${output} (${width}×${height})`);
}
