import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import dotenv from "dotenv";
import { initializeApp as initializeAdminApp, getApps as getAdminApps } from "firebase-admin/app";
import { getFirestore as getAdminFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { 
  getFirestore as getClientFirestore, 
  collection as clientCollection, 
  query as clientQuery, 
  where as clientWhere, 
  getDocs as clientGetDocs,
  doc as clientDoc,
  getDoc as clientGetDoc,
  setDoc as clientSetDoc,
  updateDoc as clientUpdateDoc,
  addDoc as clientAddDoc,
  serverTimestamp as clientServerTimestamp,
  writeBatch as clientWriteBatch,
  limit as clientLimit
} from "firebase/firestore";
import { initializeApp as initializeClientApp } from "firebase/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import cron from "node-cron";
import { AGENT_RELEASES_BASE } from './server/config';
import { encrypt as snmpEncrypt, decrypt as snmpDecrypt } from './src/lib/snmpCrypto.ts';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

dotenv.config();

// Firebase Admin Setup
if (!firebaseConfig.projectId) {
  console.error("❌ ERROR: firebase-applet-config.json is missing projectId.");
}

const clientApp = initializeClientApp(firebaseConfig);
const clientFirestore = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);

// Admin SDK Setup
try {
  if (getAdminApps().length === 0) {
    // initializeAdminApp() without args is the most reliable way in Cloud Run/Compute Engine 
    // to pick up Application Default Credentials (ADC).
    initializeAdminApp();
  }
} catch (e) {
  console.error("❌ Admin SDK Initialization Error:", e);
}

// We rely on the Admin SDK for background workers to bypass security rules.
// If the named database fails, we'll log it but we must use it if that's where the data is.
const firestore = getAdminFirestore(firebaseConfig.firestoreDatabaseId);

console.log(`📡 Initializing Firestore Admin SDK with DB ID: "${firebaseConfig.firestoreDatabaseId || '(default)'}"`);

let isAdminFirestoreHealthy = false;

// Verify Firestore connectivity
(async () => {
  try {
    // Try a simple read or list to check health
    await firestore.collection('_system').get();
    console.log(`✅ Firestore Admin SDK: Connected to "${firebaseConfig.firestoreDatabaseId || '(default)'}"`);
    isAdminFirestoreHealthy = true;
  } catch (err: any) {
    console.error(`⚠️ Firestore Admin SDK: Connection check failed for DB "${firebaseConfig.firestoreDatabaseId}". Error: ${err.message}`);
    isAdminFirestoreHealthy = false;
    
    if (err.message.includes('permission') || err.message.includes('PERMISSION_DENIED')) {
      console.error("👉 This usually means the service account lacks 'Cloud Datastore User' permissions or the Firebase Terms of Service haven't been accepted.");
    }
  }

  try {
    const healthRef = clientDoc(clientFirestore, '_system', 'health');
    await clientGetDoc(healthRef);
    console.log(`✅ Firestore Client SDK: Connected to "${firebaseConfig.firestoreDatabaseId}"`);
  } catch (err: any) {
    console.error(`❌ Firestore Client SDK: Failed to reach Firestore: ${err.message}`);
  }
})();

const THRESHOLD_PRESETS: Record<string, any> = {
  cpu_high: { category: 'performance', severity: 'warning', operator: '>', threshold: 90, duration: 300 },
  memory_high: { category: 'performance', severity: 'warning', operator: '>', threshold: 85, duration: 300 },
  disk_low: { category: 'disk', severity: 'critical', operator: '<', threshold: 10, duration: 0 },
  service_stopped: { category: 'availability', severity: 'critical', duration: 0 },
  software_installed: { category: 'security', severity: 'information', duration: 0 },
  software_uninstalled: { category: 'security', severity: 'information', duration: 0 },
  failed_login_attempts: { category: 'security', severity: 'warning', operator: '>', threshold: 3, duration: 300 },
  machine_offline: { category: 'availability', severity: 'critical', duration: 300 },
  antivirus_disabled: { category: 'security', severity: 'critical', duration: 0 },
  high_ram_pressure: { category: 'performance', severity: 'warning', operator: '>', threshold: 90, duration: 300 },
};

async function evaluateThresholds(deviceId: string, userId: string, metrics: any) {
  try {
    const thresholdsSnap = await firestore.collection('device_thresholds')
      .where('deviceId', '==', deviceId)
      .where('enabled', '==', true)
      .get();

    for (const doc of thresholdsSnap.docs) {
      const threshold = doc.data();
      const preset = THRESHOLD_PRESETS[threshold.presetId];
      if (!preset) continue;

      let value: number | null = null;
      if (threshold.presetId === 'cpu_high') value = metrics.cpu;
      else if (threshold.presetId === 'memory_high' || threshold.presetId === 'high_ram_pressure') {
        if (metrics.ramTotal > 0) value = (metrics.ramUsed / metrics.ramTotal) * 100;
      } else if (threshold.presetId === 'disk_low') {
        if (metrics.diskTotal > 0) value = ((metrics.diskTotal - metrics.diskUsed) / metrics.diskTotal) * 100;
      }

      if (value !== null) {
        const triggered = preset.operator === '>' ? value > preset.threshold : value < preset.threshold;
        if (triggered) {
          // Check if we should create an alert (deduplication/duration logic could go here)
          await firestore.collection('alerts').add({
            userId, deviceId,
            type: threshold.presetId,
            severity: preset.severity,
            message: `${threshold.name || threshold.presetId} triggered: ${value.toFixed(1)}% ${preset.operator} ${preset.threshold}%`,
            status: 'active',
            createdAt: FieldValue.serverTimestamp(),
          });
        }
      }
    }
  } catch (err) {
    console.error("Threshold evaluation error:", err);
  }
}

function handleCronError(label: string, err: any) {
  const projectId = firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId;
  if (err?.message?.includes('Cloud Firestore API has not been used')) {
    console.error(`[NODE-CRON] [ERROR] ${label}: Cloud Firestore API is disabled for project ${projectId}.`);
    console.error(`👉 ENABLE IT HERE: https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=${projectId}`);
  } else if (err?.message?.includes('Missing or insufficient permissions')) {
    console.error(`[NODE-CRON] [ERROR] ${label}: Permission denied. Ensure project "${projectId}" has the Cloud Firestore API enabled and the database "${databaseId}" exists.`);
  } else {
    console.error(`[NODE-CRON] [ERROR] ${label}:`, err.message || err);
  }
}

// Background cleanup worker (every hour)
cron.schedule('0 * * * *', async () => {
  try {
    if (!isAdminFirestoreHealthy) return;
    console.log("Running hourly cleanup...");
    const oneHourAgo = new Date(Date.now() - 3600000);
    
    // Always prefer Admin SDK for background tasks to bypass security rules
    const offlineSnap = await firestore.collection('devices')
      .where('status', '==', 'online')
      .where('lastSeen', '<', Timestamp.fromDate(oneHourAgo))
      .get();
      
    if (!offlineSnap.empty) {
      const batch = firestore.batch();
      offlineSnap.forEach(docSnapshot => {
        batch.update(docSnapshot.ref, { status: 'offline' });
      });
      await batch.commit();
      console.log(`Marked ${offlineSnap.size} devices as offline.`);
    }
  } catch (err) {
    handleCronError('Cleanup worker', err);
  }
});

// SNMP Polling worker (every minute)
cron.schedule("* * * * *", async () => {
  try {
    if (!isAdminFirestoreHealthy) return;
    const devicesSnap = await firestore.collection('snmp_devices')
      .where('enabled', '==', true)
      .get();
      
    for (const docSnapshot of devicesSnap.docs) {
      const device = docSnapshot.data();
      const lastPolled = device.lastPolledAt?.toDate() || new Date(0);
      const intervalMs = (device.pollingInterval || 300) * 1000;
      
      if (Date.now() - lastPolled.getTime() >= intervalMs) {
        const agentSnap = await firestore.collection('devices')
          .where('userId', '==', device.userId)
          .where('status', '==', 'online')
          .limit(1)
          .get();
          
        if (!agentSnap.empty) {
          const agentId = agentSnap.docs[0].id;
          const config = JSON.parse(snmpDecrypt(device.encryptedConfig));
          
          await firestore.collection('commands').add({
            deviceId: agentId,
            userId: device.userId,
            commandType: 'snmp_poll',
            payload: JSON.stringify({
              snmpDeviceId: docSnapshot.id,
              host: device.host,
              port: device.port || 161,
              version: device.version || 'v2c',
              community: config.community,
              v3Config: config.v3Config,
              oids: device.oids || [],
            }),
            status: 'pending',
            createdAt: FieldValue.serverTimestamp(),
          });
          
          await firestore.collection('snmp_devices').doc(docSnapshot.id).update({ 
            lastPolledAt: FieldValue.serverTimestamp() 
          });
        }
      }
    }
  } catch (err) {
    handleCronError('SNMP polling worker', err);
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AGENT_JWT_SECRET = process.env.AGENT_JWT_SECRET || "fallback_secret_change_me_in_production";

// Middlewares
async function verifyFirebaseToken(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const idToken = authHeader.split(" ")[1];
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

async function verifyAgentJWT(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, AGENT_JWT_SECRET) as any;
    req.agent = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid agent token" });
  }
}

async function requireAdmin(req: any, res: any, next: any) {
  const { uid } = req.user;
  try {
    const userDoc = await firestore.collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return res.status(403).json({ error: "Admin role required" });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

// Agent state
const connectedAgents = new Map<string, { lastSeen: Date }>();

// Helper to produce CSV strings
function rowsToCsv(headers: string[], rows: (string | number | null)[][]): string {
  const escape = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
}

// Helper — requires admin role
async function isUserAppAdmin(uid: string): Promise<boolean> {
  const userDoc = await firestore.collection('users').doc(uid).get();
  return userDoc.data()?.role === 'admin';
}

// ===== SNMP Polling Helper =====

async function queueSnmpPoll(snmpDeviceId: string, device: any) {
  const agentQ = clientQuery(
    clientCollection(clientFirestore, 'devices'),
    clientWhere('userId', '==', device.userId),
    clientWhere('status', '==', 'online'),
    clientLimit(1)
  );
  const agentSnap = await clientGetDocs(agentQ);
    
  if (!agentSnap.empty) {
    const agentId = agentSnap.docs[0].id;
    const config = JSON.parse(snmpDecrypt(device.encryptedConfig));
    
    await clientAddDoc(clientCollection(clientFirestore, 'commands'), {
      deviceId: agentId,
      userId: device.userId,
      commandType: 'snmp_poll',
      payload: JSON.stringify({
        snmpDeviceId: snmpDeviceId,
        host: device.host,
        port: device.port || 161,
        version: device.version || 'v2c',
        community: config.community,
        v3Config: config.v3Config,
        oids: device.oids || [],
      }),
      status: 'pending',
      createdAt: clientServerTimestamp(),
    });
    
    // We update via admin SDK if possible for consistency
    await firestore.collection('snmp_devices').doc(snmpDeviceId).update({ 
      lastPolledAt: FieldValue.serverTimestamp() 
    });
  }
}

// ===== Automation Profiles =====

function computeNextExecution(schedules: any[]): Timestamp | null {
  if (!schedules || schedules.length === 0) return null;
  const now = new Date();
  let nextDate: Date | null = null;
  for (const s of schedules) {
    let candidate: Date | null = null;
    if (s.type === 'one_time' && s.oneTimeDate) {
      candidate = new Date(s.oneTimeDate);
      if (candidate <= now) continue;
    } else if (s.type === 'weekly' && s.weeklyDays && s.weeklyTime) {
      const [hh, mm] = s.weeklyTime.split(':').map(Number);
      for (let i = 0; i < 8; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        d.setHours(hh, mm, 0, 0);
        if (d > now && s.weeklyDays.includes(d.getDay())) { candidate = d; break; }
      }
    } else if (s.type === 'monthly' && s.monthlyDayOfMonth && s.monthlyTime) {
      const [hh, mm] = s.monthlyTime.split(':').map(Number);
      const d = new Date(now.getFullYear(), now.getMonth(), s.monthlyDayOfMonth, hh, mm);
      if (d <= now) d.setMonth(d.getMonth() + 1);
      candidate = d;
    }
    if (candidate && (!nextDate || candidate < nextDate)) nextDate = candidate;
  }
  return nextDate ? Timestamp.fromDate(nextDate) : null;
}

async function queueAutomationProfile(profileId: string, profile: any, immediate: boolean) {
  const deviceIds = new Set<string>(profile.assignedTo?.deviceIds || []);
  
  // Helper to run query via Admin or Client
  const getDevices = async (field: string, values: string[]) => {
    try {
      const snap = await firestore.collection('devices')
        .where('userId', '==', profile.userId)
        .where(field, 'in', values.slice(0, 10)).get();
      return snap.docs;
    } catch (e) {
      // Fallback to client if Admin fails
      const q = clientQuery(
        clientCollection(clientFirestore, 'devices'),
        clientWhere('userId', '==', profile.userId),
        clientWhere(field, 'in', values.slice(0, 10))
      );
      const snap = await clientGetDocs(q);
      return snap.docs;
    }
  };

  if (profile.assignedTo?.folderIds?.length) {
    const docs = await getDevices('folderId', profile.assignedTo.folderIds);
    docs.forEach(d => deviceIds.add(d.id));
  }
  if (profile.assignedTo?.siteIds?.length) {
    const docs = await getDevices('siteId', profile.assignedTo.siteIds);
    docs.forEach(d => deviceIds.add(d.id));
  }

  for (const deviceId of deviceIds) {
    try {
      const execRef = await firestore.collection('automation_executions').add({
        userId: profile.userId, profileId, deviceId,
        status: 'running', startedAt: FieldValue.serverTimestamp(),
        completedAt: null, tasksCompleted: [], tasksFailed: [], output: '',
      });
      await firestore.collection('commands').add({
        deviceId, userId: profile.userId,
        commandType: 'run_automation_profile',
        payload: JSON.stringify({ executionId: execRef.id, tasks: profile.tasks }),
        status: 'pending', createdAt: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      // Fallback to client
      try {
        const execRef = await clientAddDoc(clientCollection(clientFirestore, 'automation_executions'), {
          userId: profile.userId, profileId, deviceId,
          status: 'running', startedAt: clientServerTimestamp(),
          completedAt: null, tasksCompleted: [], tasksFailed: [], output: '',
        });
        await clientAddDoc(clientCollection(clientFirestore, 'commands'), {
          deviceId, userId: profile.userId,
          commandType: 'run_automation_profile',
          payload: JSON.stringify({ executionId: execRef.id, tasks: profile.tasks }),
          status: 'pending', createdAt: clientServerTimestamp(),
        });
      } catch (inner) {
        console.error("Queue automation failed on both Admin and Client:", inner);
      }
    }
  }

  if (!immediate) {
    const updates = {
      lastExecution: FieldValue.serverTimestamp(),
      nextExecution: computeNextExecution(profile.schedules || []),
    };
    try {
      await firestore.collection('automation_profiles').doc(profileId).update(updates);
    } catch (e) {
      try {
        const docRef = clientDoc(clientFirestore, 'automation_profiles', profileId);
        await clientUpdateDoc(docRef, {
          lastExecution: clientServerTimestamp(),
          nextExecution: computeNextExecution(profile.schedules || []),
        });
      } catch (inner) {
        console.error("Update profile failed on both Admin and Client:", inner);
      }
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = createServer(app);

  app.use(express.json());

  // === Agent API ===

  // Generate enrollment token (Admins only)
  app.get("/api/agent/enrollment-token", verifyFirebaseToken, requireAdmin, async (req: any, res) => {
    try {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      
      await firestore.collection("agent_enrollment_tokens").doc(tokenHash).set({
        tokenHash,
        userId: req.user.uid,
        used: false,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // 24h
      });

      res.json({ enrollment_token: token });
    } catch (error) {
      console.error("❌ Token storage error:", error);
      res.status(500).json({ error: "Failed to generate token" });
    }
  });

  // Exchange enrollment token for Agent JWT
  app.post("/api/agent/enroll", async (req, res) => {
    try {
      const { enrollment_token, token, hostname, os } = req.body;
      const actualToken = enrollment_token || token;
      
      if (!actualToken) return res.status(400).json({ error: "Missing token" });

      const tokenHash = crypto.createHash("sha256").update(actualToken).digest("hex");
      const enrollmentDoc = await firestore.collection("agent_enrollment_tokens").doc(tokenHash).get();

      let enrollmentData: any;

      if (!enrollmentDoc.exists) {
        // Fallback: Check if the token is a valid User ID
        const userDoc = await firestore.collection("users").doc(actualToken).get();
        if (userDoc.exists) {
          enrollmentData = { userId: actualToken, used: false, expiresAt: Timestamp.fromDate(new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)) };
        } else {
          return res.status(401).json({ error: "Invalid token or User ID" });
        }
      } else {
        enrollmentData = enrollmentDoc.data();
        if (enrollmentData.used || enrollmentData.expiresAt.toDate() < new Date()) {
          return res.status(401).json({ error: "Token used or expired" });
        }
      }

      const agentId = crypto.randomUUID();

      // Register device in Firestore
      await firestore.collection("devices").doc(agentId).set({
        id: agentId,
        userId: enrollmentData.userId,
        name: hostname || "New Agent",
        hostname: hostname || "unknown",
        os: os || "unknown",
        status: "online",
        createdAt: FieldValue.serverTimestamp(),
        lastSeen: FieldValue.serverTimestamp(),
      });

      // Mark token as used if it exists in DB
      if (enrollmentDoc.exists) {
        await firestore.collection("agent_enrollment_tokens").doc(tokenHash).update({
          used: true
        });
      }

      // Issue JWT
      const agentJwt = jwt.sign({
        agentId: agentId,
        tenantId: enrollmentData.userId
      }, AGENT_JWT_SECRET, { expiresIn: '1y' });

      res.json({ 
        agent_id: agentId, 
        token: agentJwt 
      });
    } catch (error) {
      console.error("❌ Agent registration error:", error);
      res.status(500).json({ error: "Failed to register agent" });
    }
  });

  // Agent download redirects
  const handleAgentDownload = (req: express.Request, res: express.Response, binaryName: string) => {
    // FORCE PRODUCTION REDIRECTS - The Go binaries are hosted in the GitHub releases
    const downloadUrl = `${AGENT_RELEASES_BASE}/${binaryName}`;
    console.log(`[AGENT] Redirecting to Production Binary: ${downloadUrl}`);
    res.redirect(downloadUrl);
  };

  app.get("/api/agent/download/windows", (req, res) => {
    handleAgentDownload(req, res, 'hyperemote-agent-windows.exe');
  });
  
  app.get("/api/agent/download/linux", (req, res) => {
    handleAgentDownload(req, res, 'hyperemote-agent-linux');
  });
  
  app.get("/api/agent/download/mac", (req, res) => {
    const isArm = req.query.arch === 'arm' || !req.query.arch;
    const binary = isArm ? 'hyperemote-agent-mac-arm' : 'hyperemote-agent-mac-intel';
    handleAgentDownload(req, res, binary);
  });

  // Alias for backward compatibility
  app.post("/api/flux/agent-enroll", (req, res) => res.redirect(307, "/api/agent/enroll"));
  app.get("/api/flux/agent-enrollment-token", (req, res) => res.redirect(307, "/api/agent/enrollment-token"));

  // Agent heartbeats
  app.post("/api/agent/heartbeat", verifyAgentJWT, async (req: any, res) => {
    try {
      const { hostname, os, cpu, ramTotal, ramUsed, diskTotal, diskUsed, fluxId, agentVersion, metrics } = req.body;
      const { agentId } = req.agent;

      // Map metrics if provided (agent sends them in a sub-object)
      const data = {
        status: "online",
        hostname: hostname || metrics?.hostname,
        os: os || metrics?.os,
        cpu: cpu || metrics?.cpu,
        ramTotal: ramTotal || metrics?.ram_total,
        ramUsed: ramUsed || metrics?.ram_used,
        diskTotal: diskTotal || metrics?.disk_total,
        diskUsed: diskUsed || metrics?.disk_used,
        // Reserved for MeshCentral/Flux integration (see Étape 6)
        fluxId: fluxId || metrics?.flux_id,
        agentVersion: agentVersion || metrics?.agent_version,
        lastSeen: FieldValue.serverTimestamp(),
      };

      const deviceDoc = await firestore.collection("devices").doc(agentId).get();
      if (deviceDoc.exists) {
        const deviceData = deviceDoc.data();
        await firestore.collection("device_heartbeats").add({
          userId: deviceData?.userId,
          deviceId: agentId,
          timestamp: FieldValue.serverTimestamp(),
          cpu: cpu || metrics?.cpu || 0,
          ram: (ramUsed || metrics?.ram_used) && (ramTotal || metrics?.ram_total) 
               ? ((ramUsed || metrics?.ram_used) / (ramTotal || metrics?.ram_total)) * 100 
               : 0,
          diskUsed: diskUsed || metrics?.disk_used || 0,
          diskTotal: diskTotal || metrics?.disk_total || 0,
          networkRx: metrics?.network_rx || 0,
          networkTx: metrics?.network_tx || 0,
        });
      }

      await firestore.collection("devices").doc(agentId).update(data);

      // Trigger threshold evaluation
      void evaluateThresholds(agentId, req.agent.tenantId, data);

      res.json({ status: "ok" });
    } catch (error) {
      console.error("❌ Heartbeat error:", error);
      res.status(500).json({ error: "Failed to save heartbeat" });
    }
  });

  // Agent poll commands
  app.get("/api/agent/commands", verifyAgentJWT, async (req: any, res) => {
    try {
      const { agentId, tenantId } = req.agent;
      const snapshot = await firestore.collection("commands")
        .where("deviceId", "==", agentId)
        .where("status", "==", "pending")
        .where("userId", "==", tenantId)
        .orderBy("createdAt", "asc")
        .get();

      const commands = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(commands);
    } catch (error) {
      console.error("❌ Fetch commands error:", error);
      res.status(500).json({ error: "Failed to fetch commands" });
    }
  });

  // Agent update command result
  app.post("/api/agent/commands/:id/result", verifyAgentJWT, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, result } = req.body;
      const { agentId, tenantId } = req.agent;

      const commandRef = firestore.collection("commands").doc(id);
      const commandDoc = await commandRef.get();

      if (!commandDoc.exists || commandDoc.data()!.deviceId !== agentId || commandDoc.data()!.userId !== tenantId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await commandRef.update({
        status, 
        result,
        completedAt: FieldValue.serverTimestamp()
      });

      // Update script run if applicable
      const scriptRunId = commandDoc.data()?.scriptRunId;
      if (scriptRunId) {
        await firestore.collection("script_runs").doc(scriptRunId).update({
          status: status === "completed" ? "success" : "failed",
          output: result || "",
          exitCode: status === "completed" ? 0 : 1, // Basic assumption, agent could send real exit code
          completedAt: FieldValue.serverTimestamp(),
        });
      }

      // Log the result
      await firestore.collection("device_logs").add({
        userId: tenantId,
        deviceId: agentId,
        level: status === "completed" ? "info" : "error",
        message: `Command ${commandDoc.data()!.commandType} ${status}: ${result ? result.substring(0, 500) : ''}`,
        source: "command",
        createdAt: FieldValue.serverTimestamp(),
      });

      // Handle auto-healing alert resolution
      try {
        const cmd = commandDoc.data();
        if (cmd) {
          let payloadObj: any = {};
          try { payloadObj = JSON.parse(cmd.payload || '{}'); } catch {}
          if (payloadObj.alertId && payloadObj.autoHealing) {
            const alertRef = firestore.collection('alerts').doc(payloadObj.alertId);
            const alertDoc = await alertRef.get();
            if (alertDoc.exists) {
              const thresholdId = alertDoc.data()?.thresholdId || '';
              const thresholdDoc = await firestore.collection('device_thresholds').doc(thresholdId).get();
              const threshold = thresholdDoc.data();

              const chain = await firestore.collection('commands')
                .where('userId', '==', cmd.userId)
                .where('deviceId', '==', cmd.deviceId).get();
              
              const healingCmds = chain.docs.filter((d: any) => {
                try { return JSON.parse(d.data().payload || '{}').alertId === payloadObj.alertId; } catch { return false; }
              });

              // Check if all commands in this healing chain are done
              const allDone = healingCmds.every((c: any) => c.data().status === 'completed' || c.data().status === 'failed');
              if (allDone) {
                const allSucceeded = healingCmds.every((c: any) => c.data().status === 'completed' && (c.data().exitCode === 0 || c.data().exitCode === undefined));
                const output = healingCmds.map((c: any, i: number) => `=== Script ${i+1} ===\n${c.data().result || ''}`).join('\n\n');
                const updates: any = { autoHealingRan: true, autoHealingResult: output };
                if (allSucceeded && threshold?.autoResolveOnHeal) {
                  updates.status = 'resolved';
                  updates.resolvedAt = FieldValue.serverTimestamp();
                  updates.resolvedBy = 'auto-healing';
                }
                await alertRef.update(updates);
              }
            }
          }
        }
      } catch (e) { console.error('Auto-healing wiring error:', e); }

      res.json({ status: "ok" });
    } catch (error) {
      console.error("❌ Update command error:", error);
      res.status(500).json({ error: "Failed to update command" });
    }
  });

  // Agent logs
  app.post("/api/agent/logs", verifyAgentJWT, async (req: any, res) => {
    try {
      const { logs } = req.body; // Array of { level, message, source }
      const { agentId, tenantId } = req.agent;

      const batch = firestore.batch();
      logs.forEach((l: any) => {
        const logRef = firestore.collection("device_logs").doc();
        batch.set(logRef, {
          ...l,
          deviceId: agentId,
          userId: tenantId,
          createdAt: FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();

      res.json({ status: "ok" });
    } catch (error) {
      console.error("❌ Save logs error:", error);
      res.status(500).json({ error: "Failed to save logs" });
    }
  });

  // === Reports API ===

  app.get('/api/reports/executive-summary', verifyFirebaseToken, async (req: any, res) => {
    const { uid } = req.user;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    try {
      const [devicesSnap, ticketsSnap, alertsSnap] = await Promise.all([
        firestore.collection('devices').where('userId', '==', uid).get(),
        firestore.collection('tickets').where('userId', '==', uid).where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)).get(),
        firestore.collection('alerts').where('userId', '==', uid).where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)).get(),
      ]);
      const rows: any[][] = [
        ['Total Managed Devices', devicesSnap.size],
        ['Online Devices', devicesSnap.docs.filter(d => d.data().status === 'online').length],
        ['Tickets (last 30 days)', ticketsSnap.size],
        ['Alerts (last 30 days)', alertsSnap.size],
        ['Critical Alerts', alertsSnap.docs.filter(d => d.data().severity === 'critical').length],
      ];
      const csv = rowsToCsv(['Metric', 'Value'], rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="executive-summary.csv"');
      res.status(200).send(csv);
    } catch (error) {
      console.error("❌ Exec Summary Error:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.get('/api/reports/asset-inventory', verifyFirebaseToken, async (req: any, res) => {
    const { uid } = req.user;
    try {
      const snap = await firestore.collection('devices').where('userId', '==', uid).get();
      const rows = snap.docs.map(d => {
        const x = d.data();
        return [
          x.name || '', 
          x.os || '', 
          x.hostname || '', 
          x.ipAddress || '', 
          x.status || '', 
          x.lastSeen instanceof Timestamp ? x.lastSeen.toDate().toISOString() : (x.lastSeen || '')
        ];
      });
      const csv = rowsToCsv(['Name', 'OS', 'Hostname', 'IP Address', 'Status', 'Last Seen'], rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="asset-inventory.csv"');
      res.status(200).send(csv);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.get('/api/reports/patch-status', verifyFirebaseToken, async (req: any, res) => {
    const { uid } = req.user;
    try {
      const snap = await firestore.collection('patches').where('userId', '==', uid).get();
      const rows = snap.docs.map(d => {
        const x = d.data();
        return [
          x.deviceName || '', 
          x.patchId || '', 
          x.title || '', 
          x.severity || '', 
          x.status || '', 
          x.installedAt instanceof Timestamp ? x.installedAt.toDate().toISOString() : (x.installedAt || '')
        ];
      });
      const csv = rowsToCsv(['Device', 'Patch ID', 'Title', 'Severity', 'Status', 'Installed At'], rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="patch-status.csv"');
      res.status(200).send(csv);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.get('/api/reports/ticket-activity', verifyFirebaseToken, async (req: any, res) => {
    const { uid } = req.user;
    try {
      const snap = await firestore.collection('tickets').where('userId', '==', uid).get();
      const rows = snap.docs.map(d => {
        const x = d.data();
        const createdAt = x.createdAt instanceof Timestamp ? x.createdAt.toDate() : (x.createdAt ? new Date(x.createdAt) : null);
        const ageDays = createdAt ? Math.floor((Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000)) : '';
        return [d.id, x.title || '', x.status || '', x.priority || '', x.assignee || '', ageDays];
      });
      const csv = rowsToCsv(['Ticket ID', 'Title', 'Status', 'Priority', 'Assignee', 'Age (days)'], rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="ticket-activity.csv"');
      res.status(200).send(csv);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // === AppCenter API ===

  // GET /api/app-center/catalog — list all catalog entries
  app.get("/api/app-center/catalog", verifyFirebaseToken, async (req: any, res) => {
    try {
      const snapshot = await firestore.collection('software_catalog')
        .orderBy('name').get(); // Simplified sort
      const items = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json(items);
    } catch (error) {
      console.error("Catalog fetch error:", error);
      res.status(500).json({ error: "Failed to fetch catalog" });
    }
  });

  // === SNMP API ===

  app.get("/api/snmp/devices", verifyFirebaseToken, async (req: any, res) => {
    try {
      const snap = await firestore.collection('snmp_devices')
        .where('userId', '==', req.user.uid).get();
      res.json(snap.docs.map(d => ({ id: d.id, ...d.data(), encryptedConfig: undefined })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch SNMP devices" });
    }
  });

  app.post("/api/snmp/devices", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { name, host, port, version, community, v3Config, oids } = req.body;
      const encryptedConfig = snmpEncrypt(JSON.stringify({ community, v3Config }));
      
      const docRef = await firestore.collection('snmp_devices').add({
        userId: req.user.uid,
        name, host, port, version, oids,
        encryptedConfig,
        enabled: true,
        createdAt: FieldValue.serverTimestamp(),
      });
      res.json({ id: docRef.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to add SNMP device" });
    }
  });

  app.post("/api/agent/snmp-poll-result", verifyAgentJWT, async (req: any, res) => {
    try {
      const { snmpDeviceId, values, error } = req.body;
      const { tenantId } = req.agent;
      
      await firestore.collection('snmp_poll_results').add({
        userId: tenantId,
        snmpDeviceId,
        values,
        error: error || null,
        timestamp: FieldValue.serverTimestamp(),
      });
      
      // Update device last values
      if (values) {
        await firestore.collection('snmp_devices').doc(snmpDeviceId).update({
          lastValues: values,
          lastPolledAt: FieldValue.serverTimestamp(),
          status: 'online'
        });
      } else if (error) {
        await firestore.collection('snmp_devices').doc(snmpDeviceId).update({
          status: 'offline',
          lastError: error
        });
      }
      
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to save SNMP result" });
    }
  });

  // === Thresholds API ===

  app.get("/api/thresholds/presets", verifyFirebaseToken, (req, res) => {
    res.json(THRESHOLD_PRESETS);
  });

  app.get("/api/thresholds/:deviceId", verifyFirebaseToken, async (req: any, res) => {
    try {
      const snap = await firestore.collection('device_thresholds')
        .where('userId', '==', req.user.uid)
        .where('deviceId', '==', req.params.deviceId)
        .get();
      res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch thresholds" });
    }
  });

  app.post("/api/thresholds", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { deviceId, presetId, name, enabled = true } = req.body;
      const docRef = await firestore.collection('device_thresholds').add({
        userId: req.user.uid,
        deviceId, presetId, name, enabled,
        createdAt: FieldValue.serverTimestamp(),
      });
      res.json({ id: docRef.id });
    } catch (err) {
      res.status(500).json({ error: "Failed to save threshold" });
    }
  });

  // GET /api/app-center/installed — aggregate count per catalog entry for current tenant
  app.get("/api/app-center/installed", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { uid } = req.user;
      const snapshot = await firestore.collection('device_installed_software')
        .where('userId', '==', uid).get();
      const counts: Record<string, number> = {};
      const deviceSet: Record<string, Set<string>> = {};
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        if (!data.catalogId) return;
        if (!deviceSet[data.catalogId]) deviceSet[data.catalogId] = new Set();
        deviceSet[data.catalogId].add(data.deviceId);
      });
      for (const catalogId in deviceSet) {
        counts[catalogId] = deviceSet[catalogId].size;
      }
      // Total online devices in tenant for denominator
      const devicesSnap = await firestore.collection('devices')
        .where('userId', '==', uid).get();
      res.json({ counts, totalDevices: devicesSnap.size });
    } catch (error) {
      console.error("Installed fetch error:", error);
      res.status(500).json({ error: "Failed to fetch installed counts" });
    }
  });

  // GET /api/app-center/installed/:deviceId — list installed software for one device
  app.get("/api/app-center/installed/:deviceId", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { uid } = req.user;
      const { deviceId } = req.params;
      const deviceDoc = await firestore.collection('devices').doc(deviceId).get();
      if (!deviceDoc.exists || deviceDoc.data()?.userId !== uid) {
        return res.status(404).json({ error: "Device not found" });
      }
      const snapshot = await firestore.collection('device_installed_software')
        .where('userId', '==', uid)
        .where('deviceId', '==', deviceId)
        .orderBy('name').get();
      const items = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch device software" });
    }
  });

  // POST /api/app-center/install — enqueue install command on selected devices
  app.post("/api/app-center/install", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { uid } = req.user;
      const { catalogId, deviceIds } = req.body;
      if (!catalogId || !Array.isArray(deviceIds) || deviceIds.length === 0) {
        return res.status(400).json({ error: "catalogId and non-empty deviceIds required" });
      }
      const catalogDoc = await firestore.collection('software_catalog').doc(catalogId).get();
      if (!catalogDoc.exists) return res.status(404).json({ error: "Catalog entry not found" });
      const catalog = catalogDoc.data();

      // Validate every device belongs to this user and is online
      const deviceDocs = await Promise.all(
        deviceIds.map((id: string) => firestore.collection('devices').doc(id).get())
      );
      const commandIds: string[] = [];
      for (let i = 0; i < deviceDocs.length; i++) {
        const deviceDoc = deviceDocs[i];
        if (!deviceDoc.exists) continue;
        const device = deviceDoc.data();
        if (device?.userId !== uid) continue;
        if (device?.status !== 'online') continue;
        const os = device?.os || '';
        let installConfig: any = null;
        if (os.toLowerCase().includes('windows')) installConfig = catalog?.installCommands?.windows;
        else if (os.toLowerCase().includes('mac') || os.toLowerCase().includes('darwin')) installConfig = catalog?.installCommands?.mac;
        else if (os.toLowerCase().includes('linux')) installConfig = catalog?.installCommands?.linux;
        if (!installConfig || !installConfig.packageId) continue;

        const cmdRef = await firestore.collection('commands').add({
          deviceId: deviceDoc.id,
          userId: uid,
          commandType: 'install_software',
          payload: JSON.stringify({
            catalogId,
            name: catalog?.name,
            source: installConfig.source,
            packageId: installConfig.packageId,
            customInstallScript: installConfig.customInstallScript || null,
          }),
          status: 'pending',
          createdAt: FieldValue.serverTimestamp(),
        });
        commandIds.push(cmdRef.id);
      }
      res.json({ commandIds, queuedCount: commandIds.length });
    } catch (error) {
      console.error("Install error:", error);
      res.status(500).json({ error: "Failed to queue install" });
    }
  });

  // POST /api/app-center/uninstall — enqueue uninstall command on selected devices
  app.post("/api/app-center/uninstall", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { uid } = req.user;
      const { catalogId, deviceIds } = req.body;
      if (!catalogId || !Array.isArray(deviceIds) || deviceIds.length === 0) {
        return res.status(400).json({ error: "catalogId and non-empty deviceIds required" });
      }
      const catalogDoc = await firestore.collection('software_catalog').doc(catalogId).get();
      if (!catalogDoc.exists) return res.status(404).json({ error: "Catalog entry not found" });
      const catalog = catalogDoc.data();

      const deviceDocs = await Promise.all(
        deviceIds.map((id: string) => firestore.collection('devices').doc(id).get())
      );
      const commandIds: string[] = [];
      for (const deviceDoc of deviceDocs) {
        if (!deviceDoc.exists) continue;
        const device = deviceDoc.data();
        if (device?.userId !== uid) continue;
        if (device?.status !== 'online') continue;
        const os = device?.os || '';
        let installConfig: any = null;
        if (os.toLowerCase().includes('windows')) installConfig = catalog?.installCommands?.windows;
        else if (os.toLowerCase().includes('mac') || os.toLowerCase().includes('darwin')) installConfig = catalog?.installCommands?.mac;
        else if (os.toLowerCase().includes('linux')) installConfig = catalog?.installCommands?.linux;
        if (!installConfig || !installConfig.packageId) continue;

        const cmdRef = await firestore.collection('commands').add({
          deviceId: deviceDoc.id,
          userId: uid,
          commandType: 'uninstall_software',
          payload: JSON.stringify({
            catalogId,
            name: catalog?.name,
            source: installConfig.source,
            packageId: installConfig.packageId,
          }),
          status: 'pending',
          createdAt: FieldValue.serverTimestamp(),
        });
        commandIds.push(cmdRef.id);
      }
      res.json({ commandIds, queuedCount: commandIds.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to queue uninstall" });
    }
  });

  // Admin-only catalog management
  app.post("/api/app-center/catalog", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { uid } = req.user;
      if (!(await isUserAppAdmin(uid))) return res.status(403).json({ error: "Admin only" });
      const { name, category, developer, logo, description, installCommands } = req.body;
      if (!name || !category) return res.status(400).json({ error: "name and category required" });
      const docRef = await firestore.collection('software_catalog').add({
        name, category, developer: developer || '', logo: logo || '',
        description: description || '',
        installCommands: installCommands || {},
        isBuiltIn: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      res.json({ id: docRef.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to create catalog entry" });
    }
  });

  app.patch("/api/app-center/catalog/:id", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { uid } = req.user;
      if (!(await isUserAppAdmin(uid))) return res.status(403).json({ error: "Admin only" });
      const updates: any = { ...req.body, updatedAt: FieldValue.serverTimestamp() };
      delete updates.id; delete updates.createdAt; delete updates.isBuiltIn;
      await firestore.collection('software_catalog').doc(req.params.id).update(updates);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update" });
    }
  });

  app.delete("/api/app-center/catalog/:id", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { uid } = req.user;
      if (!(await isUserAppAdmin(uid))) return res.status(403).json({ error: "Admin only" });
      const doc = await firestore.collection('software_catalog').doc(req.params.id).get();
      if (doc.data()?.isBuiltIn) return res.status(400).json({ error: "Cannot delete built-in entry" });
      await firestore.collection('software_catalog').doc(req.params.id).delete();
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete" });
    }
  });

  // Agent-only — receives the inventory sync after install/uninstall
  app.post("/api/agent/installed-software-sync", verifyAgentJWT, async (req: any, res) => {
    try {
      const { deviceId, userId } = req.agent;
      const { software } = req.body; // Array of { name, version, catalogId?: string }
      if (!Array.isArray(software)) return res.status(400).json({ error: "software array required" });

      // Atomically sync with catalog
      const catalogSnap = await firestore.collection('software_catalog').get();
      const catalogMap = new Map<string, string>();
      catalogSnap.forEach(doc => {
        catalogMap.set(doc.data().name.toLowerCase(), doc.id);
      });

      // Replace the device's inventory atomically
      const batch = firestore.batch();
      const existing = await firestore.collection('device_installed_software')
        .where('userId', '==', userId)
        .where('deviceId', '==', deviceId).get();
      existing.forEach((doc: any) => batch.delete(doc.ref));

      for (const item of software) {
        const ref = firestore.collection('device_installed_software').doc();
        const catalogId = item.catalogId || catalogMap.get(item.name.toLowerCase()) || null;
        batch.set(ref, {
          userId, deviceId,
          catalogId,
          name: item.name,
          version: item.version || '',
          installedAt: item.installedAt ? new Date(item.installedAt) : FieldValue.serverTimestamp(),
          lastSeenAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
      res.json({ ok: true, count: software.length });
    } catch (error) {
      console.error("Inventory sync error:", error);
      res.status(500).json({ error: "Failed to sync inventory" });
    }
  });

  // === KnowledgeBase API ===

  app.get("/api/kb/categories", verifyFirebaseToken, async (req, res) => {
    try {
      const snap = await firestore.collection("kb_articles")
        .where("published", "==", true)
        .get();
      const categories = [...new Set(snap.docs.map(d => d.data().category))];
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/kb/articles", verifyFirebaseToken, async (req, res) => {
    try {
      const { category, search, limit = 20 } = req.query;
      let q: any = firestore.collection("kb_articles").where("published", "==", true);
      
      if (category) q = q.where("category", "==", category);
      
      const snap = await q.orderBy("createdAt", "desc").limit(Number(limit)).get();
      let articles = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      
      if (search) {
        const term = String(search).toLowerCase();
        articles = articles.filter((a: any) => 
          a.title.toLowerCase().includes(term) || a.content.toLowerCase().includes(term)
        );
      }
      
      res.json(articles);
    } catch (error) {
      console.error("❌ KB Articles Error:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  app.get("/api/kb/articles/:id", verifyFirebaseToken, async (req, res) => {
    try {
      const { id } = req.params;
      const articleRef = firestore.collection("kb_articles").doc(id);
      const doc = await articleRef.get();
      
      if (!doc.exists) return res.status(404).json({ error: "Article not found" });
      
      // Increment views
      await articleRef.update({ views: FieldValue.increment(1) });
      
      res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  app.post("/api/kb/articles", verifyFirebaseToken, requireAdmin, async (req: any, res) => {
    try {
      const { title, category, content, published = true } = req.body;
      const articleRef = firestore.collection("kb_articles").doc();
      const now = FieldValue.serverTimestamp();
      
      await articleRef.set({
        title,
        category,
        content,
        published,
        author: req.user.email || 'Admin',
        views: 0,
        createdAt: now,
        updatedAt: now,
      });
      
      res.status(201).json({ id: articleRef.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to create article" });
    }
  });

  // === Scripts API ===

  app.get("/api/scripts", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { uid } = req.user;
      const { category, targetOs } = req.query;
      
      let q: any = firestore.collection("scripts").where("userId", "==", uid);
      
      if (category) q = q.where("category", "==", category);
      if (targetOs) q = q.where("targetOs", "array-contains", targetOs);
      
      const snapshot = await q.orderBy("name", "asc").get();
      const scripts = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json(scripts);
    } catch (error) {
      console.error("❌ Fetch scripts error:", error);
      res.status(500).json({ error: "Failed to fetch scripts" });
    }
  });

  app.post("/api/scripts", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { uid } = req.user;
      const scriptData = req.body;
      
      const scriptRef = firestore.collection("scripts").doc();
      await scriptRef.set({
        ...scriptData,
        userId: uid,
        runCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      res.json({ id: scriptRef.id, status: "created" });
    } catch (error) {
      console.error("❌ Create script error:", error);
      res.status(500).json({ error: "Failed to create script" });
    }
  });

  app.get("/api/scripts/shared", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { category, targetOs } = req.query;
      let q: any = firestore.collection("shared_scripts");
      
      if (category) q = q.where("category", "==", category);
      if (targetOs) q = q.where("targetOs", "array-contains", targetOs);
      
      const snapshot = await q.get();
      const scripts = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json(scripts);
    } catch (error) {
      console.error("❌ Fetch shared scripts error:", error);
      res.status(500).json({ error: "Failed to fetch shared scripts" });
    }
  });

  app.post("/api/scripts/shared/:id/clone", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { uid } = req.user;
      
      const sharedDoc = await firestore.collection("shared_scripts").doc(id).get();
      if (!sharedDoc.exists) return res.status(404).json({ error: "Shared script not found" });
      
      const scriptData = sharedDoc.data()!;
      delete scriptData.userId; // Ensure we don't copy the original owner if any
      
      const scriptRef = firestore.collection("scripts").doc();
      await scriptRef.set({
        ...scriptData,
        userId: uid,
        runCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      res.json({ id: scriptRef.id, status: "cloned" });
    } catch (error) {
      console.error("❌ Clone script error:", error);
      res.status(500).json({ error: "Failed to clone script" });
    }
  });

  app.post("/api/scripts/:id/run", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { uid } = req.user;
      const { deviceIds, variableValues } = req.body;
      
      const scriptDoc = await firestore.collection("scripts").doc(id).get();
      if (!scriptDoc.exists || scriptDoc.data()!.userId !== uid) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const script = scriptDoc.data()!;
      const runIds: string[] = [];
      
      for (const deviceId of deviceIds) {
        const runRef = firestore.collection("script_runs").doc();
        const runId = runRef.id;
        runIds.push(runId);
        
        await runRef.set({
          userId: uid,
          scriptId: id,
          deviceId,
          variableValues: variableValues || {},
          status: "pending",
          startedAt: FieldValue.serverTimestamp(),
        });
        
        // Create command for agent
        const commandId = `script_${runId}`;
        await firestore.collection("commands").doc(commandId).set({
          userId: uid,
          deviceId,
          commandType: "run_script",
          payload: JSON.stringify({
            content: script.content,
            variables: variableValues || {}
          }),
          status: "pending",
          scriptRunId: runId,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      
      await scriptDoc.ref.update({
        runCount: FieldValue.increment(deviceIds.length),
        lastRunAt: FieldValue.serverTimestamp()
      });
      
      res.json({ runIds });
    } catch (error) {
      console.error("❌ Run script error:", error);
      res.status(500).json({ error: "Failed to run script" });
    }
  });

  app.get("/api/scripts/runs", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { uid } = req.user;
      const snapshot = await firestore.collection("script_runs")
        .where("userId", "==", uid)
        .orderBy("startedAt", "desc")
        .limit(50)
        .get();
        
      const runs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json(runs);
    } catch (error) {
      console.error("❌ Fetch script runs error:", error);
      res.status(500).json({ error: "Failed to fetch script runs" });
    }
  });

  // === Network Discovery API ===

  app.get("/api/network/proxy-candidates", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { uid } = req.user;
      const snapshot = await firestore.collection('devices')
        .where('userId', '==', uid)
        .where('status', '==', 'online')
        .get();
      
      const candidates = snapshot.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() }))
        .filter((d: any) => ['Windows', 'Linux', 'macOS'].some(os => d.os?.includes(os)));
        
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch proxy candidates" });
    }
  });

  app.post("/api/network/scan", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { uid } = req.user;
      const { proxyAgentId, scanTypes = ['ping', 'arp', 'mdns', 'portscan'], customSubnet = null } = req.body;
      
      const deviceDoc = await firestore.collection('devices').doc(proxyAgentId).get();
      if (!deviceDoc.exists || deviceDoc.data()?.userId !== uid || deviceDoc.data()?.status !== 'online') {
        return res.status(400).json({ error: "Invalid or offline proxy agent" });
      }

      const scanRef = await firestore.collection('network_scans').add({
        userId: uid,
        proxyAgentId,
        proxyAgentName: deviceDoc.data()?.name || 'Unknown',
        siteId: deviceDoc.data()?.siteId || null,
        status: 'pending',
        subnet: customSubnet || '',
        scanTypes,
        startedAt: FieldValue.serverTimestamp(),
        completedAt: null,
        devicesFound: 0,
        error: null,
        createdBy: uid
      });

      // Insert command for the agent
      await firestore.collection('commands').add({
        deviceId: proxyAgentId,
        userId: uid,
        commandType: 'network_scan',
        payload: JSON.stringify({ scanId: scanRef.id, scanTypes, subnet: customSubnet }),
        status: 'pending',
        createdAt: FieldValue.serverTimestamp()
      });

      res.json({ scanId: scanRef.id, status: 'pending' });
    } catch (error) {
      console.error("❌ Scan start error:", error);
      res.status(500).json({ error: "Failed to start network scan" });
    }
  });

  app.get("/api/network/scans", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { uid } = req.user;
      const snapshot = await firestore.collection('network_scans')
        .where('userId', '==', uid)
        .orderBy('startedAt', 'desc')
        .limit(20)
        .get();
      
      const scans = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json(scans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scans" });
    }
  });

  // ===== Automation Profiles =====

  app.get("/api/automation/profiles", verifyFirebaseToken, async (req: any, res) => {
    try {
      const snap = await firestore.collection('automation_profiles')
        .where('userId', '==', req.user.uid).orderBy('name').get();
      res.json(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  });

  app.post("/api/automation/profiles", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { name, description, active, tasks, schedules, timezone, offlineExecution, notifyEmails, assignedTo } = req.body;
      if (!name) return res.status(400).json({ error: "name required" });
      const ref = await firestore.collection('automation_profiles').add({
        userId: req.user.uid, name, description: description || '',
        active: active !== false, tasks: tasks || {},
        schedules: schedules || [], timezone: timezone || 'account',
        offlineExecution: offlineExecution || 'online_only',
        notifyEmails: notifyEmails || [],
        assignedTo: assignedTo || { siteIds: [], folderIds: [], deviceIds: [] },
        nextExecution: computeNextExecution(schedules || []),
        lastExecution: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      res.json({ id: ref.id });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  });

  app.get("/api/automation/profiles/:id", verifyFirebaseToken, async (req: any, res) => {
    const doc = await firestore.collection('automation_profiles').doc(req.params.id).get();
    if (!doc.exists || doc.data()?.userId !== req.user.uid) return res.status(404).json({ error: "Not found" });
    res.json({ id: doc.id, ...doc.data() });
  });

  app.patch("/api/automation/profiles/:id", verifyFirebaseToken, async (req: any, res) => {
    const doc = await firestore.collection('automation_profiles').doc(req.params.id).get();
    if (!doc.exists || doc.data()?.userId !== req.user.uid) return res.status(404).json({ error: "Not found" });
    const updates: any = { ...req.body, updatedAt: FieldValue.serverTimestamp() };
    delete updates.id; delete updates.userId; delete updates.createdAt;
    if (updates.schedules) updates.nextExecution = computeNextExecution(updates.schedules);
    await doc.ref.update(updates);
    res.json({ ok: true });
  });

  app.delete("/api/automation/profiles/:id", verifyFirebaseToken, async (req: any, res) => {
    const doc = await firestore.collection('automation_profiles').doc(req.params.id).get();
    if (!doc.exists || doc.data()?.userId !== req.user.uid) return res.status(404).json({ error: "Not found" });
    await doc.ref.delete();
    res.json({ ok: true });
  });

  app.post("/api/automation/profiles/:id/run-now", verifyFirebaseToken, async (req: any, res) => {
    const doc = await firestore.collection('automation_profiles').doc(req.params.id).get();
    if (!doc.exists || doc.data()?.userId !== req.user.uid) return res.status(404).json({ error: "Not found" });
    await queueAutomationProfile(doc.id, doc.data(), true);
    res.json({ ok: true });
  });

  app.get("/api/automation/executions", verifyFirebaseToken, async (req: any, res) => {
    const snap = await firestore.collection('automation_executions')
      .where('userId', '==', req.user.uid)
      .orderBy('startedAt', 'desc').limit(50).get();
    res.json(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
  });

  app.post("/api/agent/automation-result", verifyAgentJWT, async (req: any, res) => {
    try {
      const { executionId, status, tasksCompleted, tasksFailed, output } = req.body;
      if (!executionId) return res.status(400).json({ error: "executionId required" });
      await firestore.collection('automation_executions').doc(executionId).update({
        status, tasksCompleted, tasksFailed, output,
        completedAt: FieldValue.serverTimestamp(),
      });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  });

  // ===== SNMP Endpoints =====

  app.delete("/api/snmp/devices/:id", verifyFirebaseToken, async (req: any, res) => {
    const doc = await firestore.collection('snmp_devices').doc(req.params.id).get();
    if (!doc.exists || doc.data()?.userId !== req.user.uid) return res.status(404).json({ error: "Not found" });
    await doc.ref.delete();
    res.json({ ok: true });
  });

  app.post("/api/snmp/devices/:id/poll-now", verifyFirebaseToken, async (req: any, res) => {
    try {
      const doc = await firestore.collection('snmp_devices').doc(req.params.id).get();
      if (!doc.exists || doc.data()?.userId !== req.user.uid) return res.status(404).json({ error: "Not found" });
      await queueSnmpPoll(doc.id, doc.data());
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  });

  app.get("/api/snmp/templates", verifyFirebaseToken, async (req: any, res) => {
    const snap = await firestore.collection('snmp_templates').where('userId', '==', req.user.uid).orderBy('name').get();
    res.json(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
  });

  app.post("/api/snmp/templates", verifyFirebaseToken, async (req: any, res) => {
    const { name, deviceType, description, tags, oids } = req.body;
    if (!name || !deviceType) return res.status(400).json({ error: "name and deviceType required" });
    const ref = await firestore.collection('snmp_templates').add({
      userId: req.user.uid, name, deviceType,
      description: description || '', tags: tags || [], oids: oids || [],
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
    res.json({ id: ref.id });
  });

  app.patch("/api/snmp/templates/:id", verifyFirebaseToken, async (req: any, res) => {
    const doc = await firestore.collection('snmp_templates').doc(req.params.id).get();
    if (!doc.exists || doc.data()?.userId !== req.user.uid) return res.status(404).json({ error: "Not found" });
    const updates: any = { ...req.body, updatedAt: FieldValue.serverTimestamp() };
    delete updates.id; delete updates.userId; delete updates.createdAt;
    await doc.ref.update(updates);
    res.json({ ok: true });
  });

  app.delete("/api/snmp/templates/:id", verifyFirebaseToken, async (req: any, res) => {
    const doc = await firestore.collection('snmp_templates').doc(req.params.id).get();
    if (!doc.exists || doc.data()?.userId !== req.user.uid) return res.status(404).json({ error: "Not found" });
    await doc.ref.delete();
    res.json({ ok: true });
  });

  app.post("/api/snmp/ai-suggest-oid", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { description, deviceType } = req.body;
      const { generateAIResponse } = await import('./src/services/aiService');
      const prompt = `Suggest the most appropriate SNMP OID for this need: ${description} on a ${deviceType}. Return ONLY a JSON object with fields: oid, name, description, valueType ('integer'|'gauge'|'counter'|'string'|'percentage'), unit (string or null). No markdown.`;
      const result = await generateAIResponse(prompt, 'You are an expert in SNMP monitoring.');
      const cleaned = result.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      res.json(JSON.parse(cleaned));
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.post("/api/alerts/:id/rerun-healing", verifyFirebaseToken, async (req: any, res) => {
    try {
      const alertDoc = await firestore.collection('alerts').doc(req.params.id).get();
      if (!alertDoc.exists || alertDoc.data()?.userId !== req.user.uid) return res.status(404).json({ error: "Not found" });
      const threshold = (await firestore.collection('device_thresholds').doc(alertDoc.data()?.thresholdId || '').get()).data();
      if (!threshold?.autoHealingScriptIds?.length) return res.status(400).json({ error: "No healing scripts configured" });

      for (const scriptId of threshold.autoHealingScriptIds) {
        const scriptDoc = await firestore.collection('scripts').doc(scriptId).get();
        if (!scriptDoc.exists) continue;
        await firestore.collection('commands').add({
          deviceId: alertDoc.data()?.deviceId, userId: req.user.uid,
          commandType: 'run_script',
          payload: JSON.stringify({
            content: scriptDoc.data()?.content, variables: {},
            alertId: req.params.id, autoHealing: true,
          }),
          status: 'pending', createdAt: FieldValue.serverTimestamp(),
        });
      }
      await alertDoc.ref.update({ autoHealingRan: false, autoHealingResult: null });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  });

  app.get("/api/network/scans/:scanId", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { uid } = req.user;
      const { scanId } = req.params;
      
      const scanDoc = await firestore.collection('network_scans').doc(scanId).get();
      if (!scanDoc.exists || scanDoc.data()?.userId !== uid) {
        return res.status(404).json({ error: "Scan not found" });
      }

      const resultsSnapshot = await firestore.collection('network_scan_results')
        .where('userId', '==', uid)
        .where('scanId', '==', scanId)
        .get();
      
      const results = resultsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json({ scan: { id: scanDoc.id, ...scanDoc.data() }, results });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scan details" });
    }
  });

  app.post("/api/network/scans/:scanId/cancel", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { uid } = req.user;
      const { scanId } = req.params;
      
      const scanDoc = await firestore.collection('network_scans').doc(scanId).get();
      if (!scanDoc.exists || scanDoc.data()?.userId !== uid) {
        return res.status(404).json({ error: "Scan not found" });
      }

      await firestore.collection('network_scans').doc(scanId).update({
        status: 'cancelled',
        completedAt: FieldValue.serverTimestamp()
      });

      res.json({ status: "cancelled" });
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel scan" });
    }
  });

  app.post("/api/network/results/:resultId/send-invitation", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { uid } = req.user;
      const { resultId } = req.params;
      const { email, message } = req.body;
      
      const resultDoc = await firestore.collection('network_scan_results').doc(resultId).get();
      if (!resultDoc.exists || resultDoc.data()?.userId !== uid) {
        return res.status(404).json({ error: "Result not found" });
      }

      // Here you would normally use a mail service like Resend.
      // Since Resend isn't configured, we'll log it and update Firestore.
      console.log(`📧 Sending invitation to ${email} for device ${resultDoc.data()?.ipAddress}`);
      console.log(`Message: ${message || 'No custom message'}`);
      
      await firestore.collection('network_scan_results').doc(resultId).update({
        invitationSent: true,
        invitationSentAt: FieldValue.serverTimestamp()
      });

      res.json({ status: "sent" });
    } catch (error) {
      res.status(500).json({ error: "Failed to send invitation" });
    }
  });

  app.post("/api/agent/network-scan-result", verifyAgentJWT, async (req: any, res) => {
    try {
      const { deviceId } = req.agent;
      const { scanId, subnet, results, error } = req.body;
      
      const scanDoc = await firestore.collection('network_scans').doc(scanId).get();
      if (!scanDoc.exists) return res.status(404).json({ error: "Scan not found" });
      
      const scanData = scanDoc.data()!;
      if (scanData.proxyAgentId !== deviceId) return res.status(403).json({ error: "Unauthorized proxy agent" });
      
      if (scanData.status === 'cancelled') return res.status(409).json({ error: "Scan was cancelled" });
      if (scanData.status !== 'pending' && scanData.status !== 'running') return res.status(400).json({ error: "Scan is not in a submittable state" });

      if (error) {
        await firestore.collection('network_scans').doc(scanId).update({
          status: 'failed',
          error,
          completedAt: FieldValue.serverTimestamp()
        });
        return res.json({ status: "recorded_error" });
      }

      const userId = scanData.userId;
      const batch = firestore.batch();

      for (const result of results) {
        const resultRef = firestore.collection('network_scan_results').doc();
        
        // Check if managed
        const managedQuery = await firestore.collection('devices')
          .where('userId', '==', userId)
          .where('ip', '==', result.ipAddress)
          .get();
        
        const isManaged = !managedQuery.empty;

        batch.set(resultRef, {
          userId,
          scanId,
          ipAddress: result.ipAddress,
          macAddress: result.macAddress || null,
          hostname: result.hostname || null,
          osGuess: result.osGuess || null,
          openPorts: result.openPorts || [],
          deviceType: result.deviceType || 'unknown',
          vendor: result.vendor || null,
          responseTimeMs: result.responseTimeMs || null,
          isManaged,
          discoveredAt: FieldValue.serverTimestamp(),
          invitationSent: false,
          invitationSentAt: null
        });
      }

      await firestore.collection('network_scans').doc(scanId).update({
        status: 'completed',
        completedAt: FieldValue.serverTimestamp(),
        devicesFound: results.length,
        subnet
      });

      await batch.commit();
      res.json({ status: "success" });
    } catch (error) {
      console.error("❌ Agent scan result error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // === Scripts API ===

  app.get("/api/scripts/:id", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { uid } = req.user;
      
      const scriptDoc = await firestore.collection("scripts").doc(id).get();
      if (!scriptDoc.exists || scriptDoc.data()!.userId !== uid) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json({ id: scriptDoc.id, ...scriptDoc.data() });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch script" });
    }
  });

  app.patch("/api/scripts/:id", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { uid } = req.user;
      const updates = req.body;
      
      const scriptRef = firestore.collection("scripts").doc(id);
      const scriptDoc = await scriptRef.get();
      
      if (!scriptDoc.exists || scriptDoc.data()!.userId !== uid) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await scriptRef.update({
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      res.json({ status: "updated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update script" });
    }
  });

  app.delete("/api/scripts/:id", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { uid } = req.user;
      
      const scriptRef = firestore.collection("scripts").doc(id);
      const scriptDoc = await scriptRef.get();
      
      if (!scriptDoc.exists || scriptDoc.data()!.userId !== uid) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await scriptRef.delete();
      res.json({ status: "deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete script" });
    }
  });

  // Update script run status when command completes
  // (This needs integration into the existing command result endpoint)

  // === Agent Management API (Browser) ===

  // Send command to device (Browser)
  app.post("/api/agent/devices/:deviceId/command", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { deviceId } = req.params;
      const { action, payload } = req.body;
      const { uid } = req.user;

      const deviceDoc = await firestore.collection("devices").doc(deviceId).get();
      if (!deviceDoc.exists || deviceDoc.data()!.userId !== uid) {
        return res.status(403).json({ error: "Access denied" });
      }

      const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      await firestore.collection("commands").doc(commandId).set({
        userId: uid,
        deviceId,
        commandType: action,
        payload: typeof payload === "string" ? payload : JSON.stringify(payload) || null,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
      });

      res.json({ command_id: commandId, status: "sent" });
    } catch (error) {
      console.error("❌ Send command error:", error);
      res.status(500).json({ error: "Failed to send command" });
    }
  });

  // Get command result (Browser)
  app.get("/api/agent/commands/:id", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { uid } = req.user;

      const commandDoc = await firestore.collection("commands").doc(id).get();
      if (!commandDoc.exists || commandDoc.data()!.userId !== uid) {
        return res.status(404).json({ error: "Command not found" });
      }
      res.json({ id: commandDoc.id, ...commandDoc.data() });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete device (Browser - Admin only)
  app.post("/api/agent/devices/:deviceId/delete", verifyFirebaseToken, requireAdmin, async (req: any, res) => {
    try {
      const { deviceId } = req.params;
      
      // Batch delete commands and logs
      const commandsSnap = await firestore.collection("commands").where("deviceId", "==", deviceId).get();
      const logsSnap = await firestore.collection("device_logs").where("deviceId", "==", deviceId).get();
      
      const batch = firestore.batch();
      commandsSnap.docs.forEach(doc => batch.delete(doc.ref));
      logsSnap.docs.forEach(doc => batch.delete(doc.ref));
      batch.delete(firestore.collection("devices").doc(deviceId));
      
      await batch.commit();
      res.json({ status: "deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete device" });
    }
  });

  // === Health & WebSocket API ===

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok",
      uptime: process.uptime()
    });
  });

  // === WebSocket Server ===
  // Currently unused for agents (they use long polling API), but keep for future real-time features
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : "";

    if (pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", (ws: WebSocket, req) => {
    ws.close(1000, "WebSocket communication not yet implemented for standard agents");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Cron: run due automation profiles every minute
  cron.schedule('* * * * *', async () => {
    try {
      if (!isAdminFirestoreHealthy) return; // Skip if we can't talk to DB
      
      const now = Timestamp.now();
      let dueDocs: any[] = [];
      
      try {
        const snap = await firestore.collection('automation_profiles')
          .where('active', '==', true)
          .where('nextExecution', '<=', now)
          .get();
        dueDocs = snap.docs;
      } catch (err: any) {
        const errMsg = err.message || '';
        if (errMsg.includes('index') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('permission')) {
          try {
            const snap = await firestore.collection('automation_profiles')
              .where('active', '==', true)
              .get();
            dueDocs = snap.docs.filter(d => {
              const data = d.data();
              if (!data.nextExecution) return false;
              const nextExec = data.nextExecution.toDate ? data.nextExecution.toDate() : new Date(data.nextExecution);
              return nextExec <= now.toDate();
            });
          } catch (fallbackErr: any) {
            console.error('Automation cron fallback failed:', fallbackErr.message);
          }
        } else {
          throw err;
        }
      }

      if (dueDocs.length > 0) {
        console.log(`🤖 Automation Cron: Found ${dueDocs.length} due profiles.`);
        for (const doc of dueDocs) {
          try {
            await queueAutomationProfile(doc.id, doc.data(), false);
          } catch (queueErr: any) {
            console.error(`Failed to queue profile ${doc.id}:`, queueErr.message);
          }
        }
      }
    } catch (e: any) { 
      console.error('Automation cron error:', e.message);
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Cleanup old heartbeats (30 days)
  cron.schedule('0 0 * * *', async () => {
    if (!isAdminFirestoreHealthy) return;
    console.log('🧹 Cleaning up old heartbeats...');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const snapshot = await firestore.collection('device_heartbeats')
      .where('timestamp', '<', Timestamp.fromDate(thirtyDaysAgo))
      .get();
    
    const batch = firestore.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`✅ Cleaned up ${snapshot.size} heartbeats.`);
  });

  // Seed Catalog
  const seedCatalog = async () => {
    try {
      const snap = await firestore.collection('software_catalog').where('isBuiltIn', '==', true).get();
      if (!snap.empty) return;

      const apps = [
        {
          name: 'Flux', category: 'Remote Access', developer: 'HypeRemote',
          logo: 'Flux', description: 'Remote desktop and management agent.',
          installCommands: {
            windows: { source: 'custom_url', packageId: 'hyperemote-agent-windows.exe',
              customInstallScript: `Invoke-WebRequest ${AGENT_RELEASES_BASE}/hyperemote-agent-windows.exe -OutFile agent.exe; Start-Process agent.exe -Wait` },
            mac: { source: 'custom_url', packageId: 'hyperemote-agent-mac-arm',
              customInstallScript: `curl -sSL ${AGENT_RELEASES_BASE}/hyperemote-agent-mac-arm -o agent && chmod +x agent && ./agent` },
            linux: { source: 'custom_url', packageId: 'hyperemote-agent-linux',
              customInstallScript: `curl -sSL ${AGENT_RELEASES_BASE}/hyperemote-agent-linux -o agent && chmod +x agent && ./agent` },
          },
          isBuiltIn: true,
        },
        {
          name: 'Chocolatey', category: 'Package Manager', developer: 'Chocolatey Software',
          logo: 'Chocolatey', description: 'Package manager for Windows.',
          installCommands: {
            windows: { source: 'custom_url', packageId: 'chocolatey-bootstrap',
              customInstallScript: "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" },
          },
          isBuiltIn: true,
        },
        {
          name: 'Homebrew', category: 'Package Manager', developer: 'Homebrew',
          logo: 'Homebrew', description: 'Package manager for macOS and Linux.',
          installCommands: {
            mac: { source: 'custom_url', packageId: 'homebrew-bootstrap',
              customInstallScript: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"' },
            linux: { source: 'custom_url', packageId: 'homebrew-bootstrap',
              customInstallScript: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"' },
          },
          isBuiltIn: true,
        },
        {
          name: 'Node.js LTS', category: 'Runtime', developer: 'OpenJS Foundation',
          logo: 'NodeJS', description: 'JavaScript runtime built on V8.',
          installCommands: {
            windows: { source: 'winget', packageId: 'OpenJS.NodeJS.LTS' },
            mac: { source: 'homebrew', packageId: 'node@20' },
            linux: { source: 'apt', packageId: 'nodejs' },
          },
          isBuiltIn: true,
        },
        {
          name: 'Python 3', category: 'Runtime', developer: 'Python Software Foundation',
          logo: 'Python', description: 'Python programming language.',
          installCommands: {
            windows: { source: 'winget', packageId: 'Python.Python.3.12' },
            mac: { source: 'homebrew', packageId: 'python@3.12' },
            linux: { source: 'apt', packageId: 'python3' },
          },
          isBuiltIn: true,
        },
        {
          name: 'Git', category: 'Version Control', developer: 'Git',
          logo: 'Git', description: 'Distributed version control system.',
          installCommands: {
            windows: { source: 'winget', packageId: 'Git.Git' },
            mac: { source: 'homebrew', packageId: 'git' },
            linux: { source: 'apt', packageId: 'git' },
          },
          isBuiltIn: true,
        },
        {
          name: 'Visual Studio Code', category: 'IDE', developer: 'Microsoft',
          logo: 'VSCode', description: 'Code editor redefined.',
          installCommands: {
            windows: { source: 'winget', packageId: 'Microsoft.VisualStudioCode' },
            mac: { source: 'homebrew_cask', packageId: 'visual-studio-code' },
            linux: { source: 'snap', packageId: 'code' },
          },
          isBuiltIn: true,
        },
        {
          name: '7-Zip', category: 'Utility', developer: 'Igor Pavlov',
          logo: '7Zip', description: 'File archiver with high compression ratio.',
          installCommands: {
            windows: { source: 'winget', packageId: '7zip.7zip' },
          },
          isBuiltIn: true,
        },
        {
          name: 'Firefox', category: 'Browser', developer: 'Mozilla',
          logo: 'Firefox', description: 'Free and open-source web browser.',
          installCommands: {
            windows: { source: 'winget', packageId: 'Mozilla.Firefox' },
            mac: { source: 'homebrew_cask', packageId: 'firefox' },
            linux: { source: 'apt', packageId: 'firefox' },
          },
          isBuiltIn: true,
        },
        {
          name: 'Google Chrome', category: 'Browser', developer: 'Google',
          logo: 'Chrome', description: 'Fast, secure, free web browser.',
          installCommands: {
            windows: { source: 'winget', packageId: 'Google.Chrome' },
            mac: { source: 'homebrew_cask', packageId: 'google-chrome' },
            linux: { source: 'custom_url', packageId: 'chrome-deb',
              customInstallScript: 'wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && sudo apt install -y ./google-chrome-stable_current_amd64.deb' },
          },
          isBuiltIn: true,
        },
        {
          name: '1Password', category: 'Security', developer: 'AgileBits',
          logo: '1Password', description: 'Password manager.',
          installCommands: {
            windows: { source: 'winget', packageId: 'AgileBits.1Password' },
            mac: { source: 'homebrew_cask', packageId: '1password' },
            linux: { source: 'custom_url', packageId: '1password-linux',
              customInstallScript: 'curl -sS https://downloads.1password.com/linux/keys/1password.asc | sudo gpg --dearmor --output /usr/share/keyrings/1password-archive-keyring.gpg && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/1password-archive-keyring.gpg] https://downloads.1password.com/linux/debian/amd64 stable main" | sudo tee /etc/apt/sources.list.d/1password.list && sudo apt update && sudo apt install -y 1password' },
          },
          isBuiltIn: true,
        },
        {
          name: 'Bitwarden', category: 'Security', developer: 'Bitwarden',
          logo: 'Bitwarden', description: 'Open-source password manager.',
          installCommands: {
            windows: { source: 'winget', packageId: 'Bitwarden.Bitwarden' },
            mac: { source: 'homebrew_cask', packageId: 'bitwarden' },
            linux: { source: 'snap', packageId: 'bitwarden' },
          },
          isBuiltIn: true,
        },
        {
          name: 'Wireshark', category: 'Network', developer: 'Wireshark Foundation',
          logo: 'Wireshark', description: 'Network protocol analyzer.',
          installCommands: {
            windows: { source: 'winget', packageId: 'WiresharkFoundation.Wireshark' },
            mac: { source: 'homebrew_cask', packageId: 'wireshark' },
            linux: { source: 'apt', packageId: 'wireshark' },
          },
          isBuiltIn: true,
        },
        {
          name: 'Notion', category: 'Productivity', developer: 'Notion Labs',
          logo: 'Notion', description: 'All-in-one workspace.',
          installCommands: {
            windows: { source: 'winget', packageId: 'Notion.Notion' },
            mac: { source: 'homebrew_cask', packageId: 'notion' },
          },
          isBuiltIn: true,
        },
        {
          name: 'Docker Desktop', category: 'Developer Tools', developer: 'Docker Inc.',
          logo: 'Docker', description: 'Containers for everyone.',
          installCommands: {
            windows: { source: 'winget', packageId: 'Docker.DockerDesktop' },
            mac: { source: 'homebrew_cask', packageId: 'docker' },
          },
          isBuiltIn: true,
        },
      ];

      for (const appData of apps) {
        await clientAddDoc(clientCollection(clientFirestore, "software_catalog"), {
          ...appData,
          createdAt: clientServerTimestamp(),
          updatedAt: clientServerTimestamp()
        });
      }
      console.log("Software catalog seeded.");
    } catch (e) {
      console.error("Failed to seed catalog", e);
    }
  };
  seedCatalog();
}

startServer();
