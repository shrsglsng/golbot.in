const fs = require('fs');
const path = require('path');

const environment = process.argv[2] || 'local';
const rootDir = path.resolve(__dirname, '..');

const envFiles = {
  development: '.env.local',
  local: '.env.local',
  stage: '.env.stage',
  prod: '.env.prod'
};

// Validate environment argument
if (!envFiles[environment]) {
  console.error(`Error: Invalid environment "${environment}"`);
  console.error(`Valid environments: local, stage, prod`);
  process.exit(1);
}

const sourceFile = path.join(rootDir, envFiles[environment]);
const targetFile = path.join(rootDir, '.env');

if (!fs.existsSync(sourceFile)) {
  console.error(`Error: ${envFiles[environment]} not found!`);
  console.error(`Please create ${sourceFile} first.`);
  process.exit(1);
}

try {
  fs.copyFileSync(sourceFile, targetFile);

  // Post-copy domain check to ensure 'app.golbot.in' is never re-introduced
  try {
    let content = fs.readFileSync(targetFile, 'utf8');
    if (content.includes('app.golbot.in')) {
      const updatedContent = content.replace(/https?:\/\/app\.golbot\.in/g, (match) => {
        return match.replace('app.', '');
      });
      fs.writeFileSync(targetFile, updatedContent);
      console.log('✨ Domain corrected: app.golbot.in -> golbot.in');
    }
  } catch (err) {
    console.error('⚠️  Warning: Domain integrity check failed');
  }

  console.log(`✓ Environment set to: ${environment.toUpperCase()}`);
  console.log(`✓ Copied ${envFiles[environment]} to .env`);
} catch (error) {
  console.error(`Error copying environment file: ${error.message}`);
  process.exit(1);
}
