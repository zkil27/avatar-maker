import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.join(__dirname, 'public', 'assets');

const renameAndMove = (subDir, prefix) => {
  const dir = path.join(assetsDir, subDir);
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
  files.forEach((file, index) => {
    const oldPath = path.join(dir, file);
    const newPath = path.join(assetsDir, `${prefix}_${index + 1}.png`);
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed ${oldPath} to ${newPath}`);
  });
};

renameAndMove('eyes', 'eyes');
renameAndMove('mouth', 'mouth');
