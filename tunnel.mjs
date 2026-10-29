import { spawn } from 'node:child_process';
import path from 'node:path';

const npxCmd = path.resolve('..', 'nodejs', 'node-v20.18.0-win-x64', 'npx.cmd');

function startTunnel() {
  console.log('[Tunnel] Starting localtunnel on port 3000 (subdomain: tatadana-id)...');
  const proc = spawn(npxCmd, ['localtunnel', '--port', '3000', '--subdomain', 'tatadana-id'], {
    stdio: 'inherit',
    shell: true,
  });

  proc.on('close', (code) => {
    console.log(`[Tunnel] Process exited with code ${code}. Reconnecting in 3 seconds...`);
    setTimeout(startTunnel, 3000);
  });

  proc.on('error', (err) => {
    console.error(`[Tunnel] Error: ${err.message}. Reconnecting in 3 seconds...`);
    setTimeout(startTunnel, 3000);
  });
}

startTunnel();
