import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// ES modules don't have __dirname, so we need to recreate it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find the source file location and our own public directory
const packageRoot = path.resolve(__dirname, '..');
const sourceFile = path.join(
  packageRoot,
  'public/worklets/source-processor.js'
);
const ownPublicDir = path.join(packageRoot, 'public');

// Look for monorepo apps directory
const monorepoRoot = path.resolve(packageRoot, '../..');
const appsDir = path.join(monorepoRoot, 'apps');

async function copyWorklets() {
  console.log('Checking for apps that use @repo/audiolib...');

  // Skip interactive mode if CI environment is detected
  const isCI = process.env.CI === 'true' || process.env.CI === '1';

  let appPublicDirs = [];

  // Find all app public directories in the monorepo
  if (fs.existsSync(appsDir) && fs.statSync(appsDir).isDirectory()) {
    const appDirs = fs
      .readdirSync(appsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => path.join(appsDir, dirent.name));

    for (const appDir of appDirs) {
      const appPublicDir = path.join(appDir, 'public');
      if (
        fs.existsSync(appPublicDir) &&
        fs.statSync(appPublicDir).isDirectory()
      ) {
        appPublicDirs.push(appPublicDir);
      }
    }
  }

  if (appPublicDirs.length > 0) {
    console.log(
      `Found ${appPublicDirs.length} app public directories in monorepo.`
    );
    for (const publicDir of appPublicDirs) {
      await copyToDirectory(publicDir);
    }
    return;
  }

  // Try to find a top-level public directory in possible locations
  const possiblePaths = [
    // Try the current working directory first (this is usually where npm/pnpm runs from)
    process.cwd(),
    // Try one level up (in case the script is run from node_modules)
    path.join(process.cwd(), '..'),
  ];

  // Try to find a suitable public directory in any of these paths
  let publicDir = null;
  for (const basePath of possiblePaths) {
    const possiblePublicDir = path.join(basePath, 'public');

    // Skip our own public directory
    if (path.resolve(possiblePublicDir) === path.resolve(ownPublicDir)) {
      console.log(`Skipping our own public directory at: ${possiblePublicDir}`);
      continue;
    }

    if (
      fs.existsSync(possiblePublicDir) &&
      fs.statSync(possiblePublicDir).isDirectory()
    ) {
      publicDir = possiblePublicDir;
      console.log(`Found app public directory at: ${publicDir}`);
      break;
    }
  }

  if (publicDir) {
    await copyToDirectory(publicDir);
  } else {
    console.log('Could not automatically find an app public directory.');
    console.log(
      "For audio worklets to function, the source-processor.js file needs to be copied to your app's public/worklets directory."
    );
    console.log('You will need to manually copy the worklet file from:');
    console.log(`   From: ${sourceFile}`);
    console.log('   To: [your-app]/public/worklets/source-processor.js');
  }
}

// Copy files to the specified public directory
function copyToDirectory(publicDir) {
  const workletDir = path.join(publicDir, 'worklets');
  const targetFile = path.join(workletDir, 'source-processor.js');

  try {
    // Create worklets directory if it doesn't exist
    if (!fs.existsSync(workletDir)) {
      console.log(`Creating directory: ${workletDir}`);
      fs.mkdirSync(workletDir, { recursive: true });
    }

    // Copy the file
    fs.copyFileSync(sourceFile, targetFile);
    console.log(`Successfully copied source-processor.js to ${targetFile}`);
    return true;
  } catch (error) {
    console.error(`Error copying to ${publicDir}: ${error.message}`);
    return false;
  }
}

// Run the main function
copyWorklets();
