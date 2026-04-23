const http = require('http');
const https = require('https');
const os = require('os');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG_FILE = path.join(os.homedir(), '.flux-agent.json');

class FluxAgent {
    constructor() {
        this.config = this.loadConfig();
        this.serverUrl = process.argv[2] || this.config.serverUrl;
        this.token = process.argv[3] || this.config.token;
        this.jwt = this.config.jwt;
        this.agentId = this.config.agentId;
        this.heartbeatInterval = null;
        this.commandPollInterval = null;
    }

    loadConfig() {
        if (fs.existsSync(CONFIG_FILE)) {
            try {
                return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            } catch (e) {
                return {};
            }
        }
        return {};
    }

    saveConfig() {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({
            serverUrl: this.serverUrl,
            token: this.token,
            jwt: this.jwt,
            agentId: this.agentId
        }, null, 2));
    }

    async request(url, method = 'GET', data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const isHttps = url.startsWith('https');
            const lib = isHttps ? https : http;
            const urlObj = new URL(url);

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            };

            if (this.jwt) {
                options.headers['Authorization'] = `Bearer ${this.jwt}`;
            }

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

    async enroll() {
        if (this.jwt && this.agentId) {
            console.log(`\x1b[32m[FLUX] Session active for Agent ID: ${this.agentId}\x1b[0m`);
            return;
        }

        console.log('\x1b[34m[FLUX] Initializing Secure Enrollment...\x1b[0m');
        try {
            const res = await this.request(`${this.serverUrl}/api/agent/enroll`, 'POST', {
                enrollment_token: this.token,
                hostname: os.hostname(),
                os: `${os.type()} ${os.release()} ${os.arch()}`,
                agentVersion: '1.0.0-production'
            });

            this.jwt = res.token;
            this.agentId = res.agent_id;
            this.saveConfig();
            console.log(`\x1b[32m[FLUX] Enrollment Successful! Agent ID: ${this.agentId}\x1b[0m`);
        } catch (err) {
            console.error('\x1b[31m[FLUX] Enrollment Failed:\x1b[0m', err.error || err.message || err);
            process.exit(1);
        }
    }

    async sendHeartbeat() {
        try {
            const metrics = {
                hostname: os.hostname(),
                os: `${os.type()} ${os.release()}`,
                cpu: Math.floor(os.loadavg()[0] * 10),
                ram_total: os.totalmem(),
                ram_used: os.totalmem() - os.freemem(),
                disk_total: 100 * 1024 * 1024 * 1024,
                disk_used: 40 * 1024 * 1024 * 1024,
                agent_version: '1.0.0-production',
                status: 'online'
            };

            await this.request(`${this.serverUrl}/api/agent/heartbeat`, 'POST', { metrics });
            console.log(`[FLUX] Heartbeat sent at ${new Date().toLocaleTimeString()}`);
        } catch (err) {
            console.error('[FLUX] Heartbeat error:', err.message);
        }
    }

    async pollCommands() {
        try {
            const commands = await this.request(`${this.serverUrl}/api/agent/commands`, 'GET');
            if (Array.isArray(commands)) {
                for (const cmd of commands) {
                    console.log(`\x1b[33m[FLUX] Incoming Task: ${cmd.commandType}\x1b[0m`);
                    this.executeCommand(cmd);
                }
            }
        } catch (err) {
            // Silently retry
        }
    }

    async executeCommand(cmd) {
        let result = '';
        let status = 'completed';

        try {
            if (cmd.commandType === 'run_script') {
                result = await this.shellExec(cmd.payload);
            } else {
                result = `Unsupported command: ${cmd.commandType}`;
                status = 'failed';
            }
        } catch (err) {
            result = err.message || String(err);
            status = 'failed';
        }

        try {
            await this.request(`${this.serverUrl}/api/agent/commands/${cmd.id}/result`, 'POST', {
                status,
                result
            });
            console.log(`[FLUX] Task ${cmd.id} report sent.`);
        } catch (err) {
            console.error('[FLUX] Result report failed:', err.message);
        }
    }

    shellExec(code) {
        return new Promise((resolve) => {
            const shell = os.platform() === 'win32' ? 'powershell.exe' : 'sh';
            const child = exec(code, { shell });
            let output = '';
            child.stdout.on('data', (data) => output += data);
            child.stderr.on('data', (data) => output += data);
            child.on('close', () => resolve(output));
        });
    }

    start() {
        if (!this.serverUrl || !this.token) {
            console.error('\x1b[31m[FLUX] Error: Configuration Missing.\x1b[0m');
            console.log('Usage: node flux-agent.js <server_url> <enrollment_token>');
            process.exit(1);
        }

        this.enroll().then(() => {
            console.log('\x1b[36m[FLUX] Agent Active & Monitoring System Health...\x1b[0m');
            
            // Initial heartbeat
            this.sendHeartbeat();
            
            // Scheduling
            this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 30000);
            this.commandPollInterval = setInterval(() => this.pollCommands(), 5000);
        });
    }
}

const agent = new FluxAgent();
agent.start();
