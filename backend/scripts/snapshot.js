import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '../src');
const v1Dir = path.join(srcDir, 'v1');
const v2Dir = path.join(srcDir, 'v2');

console.log('Starting snapshot: copying v2 to v1...');

try {
  if (!fs.existsSync(v2Dir)) {
    console.error('Error: src/v2 directory does not exist.');
    process.exit(1);
  }

  // Remove v1 if it exists
  if (fs.existsSync(v1Dir)) {
    console.log('Removing existing src/v1...');
    fs.rmSync(v1Dir, { recursive: true, force: true });
  }

  // Copy v2 to v1
  console.log('Copying src/v2 to src/v1...');
  fs.cpSync(v2Dir, v1Dir, { recursive: true });

  console.log('Successfully snapshotted src/v2 to src/v1!');
} catch (error) {
  console.error('Failed to snapshot:', error);
  process.exit(1);
}
