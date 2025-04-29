import { createServer } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function startDevServer() {
  const server = await createServer({
    // Configure Vite
    configFile: resolve(__dirname, '../vite.config.ts'),
    root: resolve(__dirname, '..'),
    server: {
      port: 3001,
      open: '/public/index.html',
    },
    build: {
      watch: {},
    },
  });

  await server.listen();
  server.printUrls();
}

startDevServer().catch((err) => {
  console.error('Error starting dev server:', err);
  process.exit(1);
});
