// audioworklet-plugin.js
import { resolve } from 'path';
import { build } from 'vite';
import fs from 'fs';
import path from 'path';

export default function audioWorkletPlugin() {
  return {
    name: 'vite-audioworklet-plugin',

    // Build processors during dev server start and production build
    async buildStart() {
      console.log('Building AudioWorklet processors...');
      
      // Trigger separate build for processor code
      await build({
        configFile: false,
        build: {
          lib: {
            entry: resolve(__dirname, 'src/audio/processors/index.ts'),
            formats: ['es'],
            fileName: 'processors',
          },
          outDir: 'public/processors',
          emptyOutDir: true,
        },
        resolve: {
          // Add any special resolvers if needed
        },
      });
    },
    
    // Copy processors to consuming app's public directory in monorepo setup
    closeBundle() {
      // Handle paths for a monorepo setup
      try {
        const srcPath = resolve(__dirname, 'public/processors');
        
        // Try to copy to web app's public directory for development
        const possibleDestDirs = [
          resolve(__dirname, '../../apps/web/public/processors'),
          resolve(__dirname, '../web/public/processors'),
        ];
        
        for (const destDir of possibleDestDirs) {
          try {
            // Create destination directory if it doesn't exist
            const dirPath = path.dirname(destDir);
            if (!fs.existsSync(dirPath)) {
              fs.mkdirSync(dirPath, { recursive: true });
            }
            
            // Copy the processors directory
            if (fs.existsSync(destDir)) {
              // Remove existing directory
              fs.rmSync(destDir, { recursive: true, force: true });
            }
            
            // Create processors directory
            fs.mkdirSync(destDir, { recursive: true });
            
            // Copy files
            const files = fs.readdirSync(srcPath);
            for (const file of files) {
              const srcFile = path.join(srcPath, file);
              const destFile = path.join(destDir, file);
              fs.copyFileSync(srcFile, destFile);
            }
            
            console.log(`Copied AudioWorklet processors to ${destDir}`);
            break;
          } catch (err) {
            console.warn(`Failed to copy processors to ${destDir}:`, err);
          }
        }
      } catch (err) {
        console.warn('Error during processor copying:', err);
      }
    }
  };
}
