const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const SAMPLE_URL =
  'https://raw.githubusercontent.com/rive-app/rive-unity-examples/main/demos/Assets/Demos/Buildings/RiveFiles/cylinder_sign2.riv';
const TARGET_PATH = path.resolve(
  __dirname,
  '..',
  'src',
  'renderer',
  'assets',
  'mascot.riv'
);
const TEMP_PATH = `${TARGET_PATH}.tmp`;
const MAX_REDIRECTS = 5;

const downloadToFile = (url, redirects = 0) =>
  new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;

    const request = client.get(
      url,
      { headers: { 'User-Agent': 'rive-sample-fetch' } },
      (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          if (redirects >= MAX_REDIRECTS) {
            reject(new Error('Too many redirects while downloading sample.'));
            response.resume();
            return;
          }
          const nextUrl = new URL(response.headers.location, url).href;
          response.resume();
          downloadToFile(nextUrl, redirects + 1).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Download failed with status ${response.statusCode || 'unknown'}.`
            )
          );
          response.resume();
          return;
        }

        const fileStream = fs.createWriteStream(TEMP_PATH);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close(() => {
            try {
              fs.renameSync(TEMP_PATH, TARGET_PATH);
            } catch (error) {
              reject(error);
              return;
            }
            resolve();
          });
        });

        fileStream.on('error', (error) => {
          response.resume();
          reject(error);
        });
      }
    );

    request.on('error', reject);
  });

const main = async () => {
  try {
    fs.mkdirSync(path.dirname(TARGET_PATH), { recursive: true });
    if (fs.existsSync(TEMP_PATH)) {
      fs.unlinkSync(TEMP_PATH);
    }
    await downloadToFile(SAMPLE_URL);
    console.log(`Downloaded Rive sample to ${TARGET_PATH}`);
  } catch (error) {
    if (fs.existsSync(TEMP_PATH)) {
      fs.unlinkSync(TEMP_PATH);
    }
    console.error(`Failed to download Rive sample: ${error.message}`);
    process.exitCode = 1;
  }
};

main();
