const fs = require('fs');
const path = require('path');

const srcRenderer = path.join(__dirname, '..', 'src', 'renderer');
const distRenderer = path.join(__dirname, '..', 'dist', 'renderer');

const copyFile = (src, dest) => {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log(`Copied: ${path.relative(process.cwd(), src)} -> ${path.relative(process.cwd(), dest)}`);
};

const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) {
    return;
  }
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
};

// Copy index.html
copyFile(
  path.join(srcRenderer, 'index.html'),
  path.join(distRenderer, 'index.html')
);

// Copy styles directory
copyDir(
  path.join(srcRenderer, 'styles'),
  path.join(distRenderer, 'styles')
);

// Copy assets directory
copyDir(
  path.join(srcRenderer, 'assets'),
  path.join(distRenderer, 'assets')
);

// Copy gsap for renderer usage
const gsapSrc = path.join(__dirname, '..', 'node_modules', 'gsap', 'dist', 'gsap.min.js');
const gsapDest = path.join(distRenderer, 'vendor', 'gsap.min.js');
if (fs.existsSync(gsapSrc)) {
  copyFile(gsapSrc, gsapDest);
}

// Copy config window assets
const srcConfig = path.join(srcRenderer, 'config');
const distConfig = path.join(distRenderer, 'config');

// Copy config window HTML
const configHtmlSrc = path.join(srcConfig, 'index.html');
if (fs.existsSync(configHtmlSrc)) {
  copyFile(configHtmlSrc, path.join(distConfig, 'index.html'));
}

// Copy config window styles
copyDir(
  path.join(srcConfig, 'styles'),
  path.join(distConfig, 'styles')
);

// Copy config window assets (logo, etc.)
copyDir(
  path.join(srcConfig, 'assets'),
  path.join(distConfig, 'assets')
);

console.log('Assets copied successfully.');
