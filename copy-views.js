import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('src/views');
const destDir = path.resolve('dist/src/views');

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach(element => {
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else if (stat.isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

try {
  copyFolderSync(srcDir, destDir);
  console.log('Successfully copied src/views to dist/src/views');
} catch (err) {
  console.error('Error copying views:', err);
  process.exit(1);
}
