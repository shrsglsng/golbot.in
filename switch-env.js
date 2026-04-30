const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const environment = process.argv[2];

if (!environment || !['development', 'production'].includes(environment)) {
  console.error('\n❌ Usage: node switch-env.js [development|production]\n');
  console.error('Examples:');
  console.error('  node switch-env.js development   # Switch to local development');
  console.error('  node switch-env.js production    # Switch to production\n');
  process.exit(1);
}

console.log(`\n🔄 Switching to ${environment.toUpperCase()} environment...\n`);

const projects = [
  { name: 'Server', path: './server' },
  { name: 'User Web', path: './user_web' },
  { name: 'Admin Web', path: './admin_web' }
];

let hasErrors = false;

/**
 * Cleanup function to ensure 'app.golbot.in' is never re-introduced
 */
function cleanupEnvironmentFiles() {
  console.log('🧹 Running domain integrity check...');
  
  projects.forEach(project => {
    const envPath = path.resolve(__dirname, project.path, '.env');
    if (fs.existsSync(envPath)) {
      try {
        let content = fs.readFileSync(envPath, 'utf8');
        if (content.includes('app.golbot.in')) {
          console.log(`✨ Correcting domain in ${project.name}/.env...`);
          const updatedContent = content.replace(/https?:\/\/app\.golbot\.in/g, (match) => {
            return match.replace('app.', '');
          });
          fs.writeFileSync(envPath, updatedContent);
        }
      } catch (error) {
        console.error(`⚠️  Warning: Could not check domain in ${project.name}/.env`);
      }
    }
  });
}

projects.forEach(project => {
  const projectPath = path.resolve(__dirname, project.path);
  const scriptPath = path.join(projectPath, 'scripts', 'env-setup.js');

  if (!fs.existsSync(projectPath)) {
    console.error(`❌ ${project.name}: Directory not found at ${projectPath}`);
    hasErrors = true;
    return;
  }

  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ ${project.name}: env-setup.js not found`);
    hasErrors = true;
    return;
  }

  try {
    console.log(`📦 ${project.name}:`);
    execSync(`node scripts/env-setup.js ${environment}`, {
      cwd: projectPath,
      stdio: 'inherit'
    });
    console.log('');
  } catch (error) {
    console.error(`❌ ${project.name}: Failed to switch environment`);
    hasErrors = true;
  }
});

// Run domain cleanup after all projects are switched
cleanupEnvironmentFiles();

if (hasErrors) {
  console.error('\n❌ Environment switch completed with errors.\n');
  process.exit(1);
} else {
  console.log('\n✅ Successfully switched all projects to ' + environment.toUpperCase() + ' environment!\n');
  console.log('Next steps:');
  if (environment === 'development') {
    console.log('  cd server && npm run dev');
    console.log('  cd user_web && npm run dev\n');
  } else {
    console.log('  cd server && npm run start:production');
    console.log('  cd user_web && npm run build:production && npm start\n');
  }
}
