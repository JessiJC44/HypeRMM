#!/usr/bin/env node

/**
 * FLUX MOCK AGENT
 * This is a lightweight simulator for the HypeRemote/FLUX platform.
 * It connects to your dashboard and simulates a real machine.
 */

import http from 'http';
import https from 'https';
import { execSync } from 'child_process';
import os from 'os';

const args = process.argv.slice(2);
const SERVER_URL = args[0] || 'http://localhost:3000';
const ENROLL_TOKEN = args[1];

if (!ENROLL_TOKEN) {
  console.error('\x1b[31m[FLUX] Error: Enrollment Token is required.\x1b[0m');
  console.log('Usage: flux-agent <server_url> <enrollment_token>');
  process.exit(1);
}

console.log('\x1b[34m[FLUX] Initializing Agent Engine...\x1b[0m');
console.log(`[FLUX] Targeting Server: ${SERVER_URL}`);

let agentJwt = null;
let agentId = null;

async function request(url, method, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const lib = isHttps ? https : http;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400) reject(parsed);
          else resolve(parsed);
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function enroll() {
  console.log('[FLUX] Attempting enrollment...');
  try {
    const res = await request(`${SERVER_URL}/api/agent/enroll`, 'POST', {
      enrollment_token: ENROLL_TOKEN,
      hostname: os.hostname(),
      os: `${os.type()} ${os.release()}`
    });
    
    agentJwt = res.token;
    agentId = res.agent_id;
    console.log('\x1b[32m[FLUX] SUCCESS: Agent enrolled and verified.\x1b[0m');
    console.log(`[FLUX] Agent ID: ${agentId}`);
  } catch (err) {
    console.error('\x1b[31m[FLUX] Enrollment failed:\x1b[0m', err.error || err.message);
    process.exit(1);
  }
}

async function sendHeartbeat() {
  if (!agentJwt) return;

  const metrics = {
    cpu: Math.floor(Math.random() * 30) + 5,
    ram_total: os.totalmem(),
    ram_used: os.totalmem() - os.freemem(),
    disk_total: 512 * 1024 * 1024 * 1024,
    disk_used: 120 * 1024 * 1024 * 1024,
    status: 'online',
    agent_version: '1.0.0-mock'
  };

  try {
    await request(`${SERVER_URL}/api/agent/heartbeat`, 'POST', { metrics }, {
      'Authorization': `Bearer ${agentJwt}`
    });
    console.log(`[FLUX] Heartbeat sent (${new Date().toLocaleTimeString()}): CPU ${metrics.cpu}%`);
  } catch (err) {
    console.error('[FLUX] Heartbeat failed:', err.message);
  }
}

async function run() {
  await enroll();
  
  // Send heartbeat every 30 seconds
  setInterval(sendHeartbeat, 30000);
  sendHeartbeat();

  console.log('\x1b[36m[FLUX] Remote Control Protocol: LISTENING (Unattended)\x1b[0m');
  console.log('[FLUX] Keep this terminal open to remain online in HypeRemote.');
}

run().catch(console.error);
