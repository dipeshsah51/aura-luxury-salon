import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n======================================================');
console.log('✨ Launching AURA Salon & Beauty Full-Stack System');
console.log('======================================================\n');

// 1. Start Server
const serverCwd = path.join(__dirname, 'server');
const serverProcess = spawn('node', ['server.js'], {
  cwd: serverCwd,
  stdio: 'inherit',
  shell: true
});

// 2. Start Client
const clientCwd = path.join(__dirname, 'client');
const clientVite = path.join('node_modules', 'vite', 'bin', 'vite.js');
const clientProcess = spawn('node', [clientVite], {
  cwd: clientCwd,
  stdio: 'inherit',
  shell: true
});

process.on('SIGINT', () => {
  console.log('\nStopping AURA Salon services...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit(0);
});
