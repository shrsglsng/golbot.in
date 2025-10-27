import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const environment = process.argv[2] || 'development';
const rootDir = path.resolve(__dirname, '..');

const envFiles = {
  development: '.env.development',
  production: '.env.production'
};

const sourceFile = path.join(rootDir, envFiles[environment]);
const targetFile = path.join(rootDir, '.env');

if (!fs.existsSync(sourceFile)) {
  console.error(`Error: ${envFiles[environment]} not found!`);
  console.error(`Please create ${sourceFile} first.`);
  process.exit(1);
}

try {
  fs.copyFileSync(sourceFile, targetFile);
  console.log(`✓ Environment set to: ${environment.toUpperCase()}`);
  console.log(`✓ Copied ${envFiles[environment]} to .env`);
} catch (error) {
  console.error(`Error copying environment file: ${error.message}`);
  process.exit(1);
}
