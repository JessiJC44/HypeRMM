import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import dotenv from "dotenv";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import jwt from "jsonwebtoken";
import crypto from "crypto";

dotenv.config();

// Firebase Admin Setup (using Application Default Credentials)
initializeApp();
const firestore = getFirestore();

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
    const decodedToken = await getAuth().verifyIdToken(idToken);
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

      if (!enrollmentDoc.exists) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const enrollmentData = enrollmentDoc.data()!;
      if (enrollmentData.used || enrollmentData.expiresAt.toDate() < new Date()) {
        return res.status(401).json({ error: "Token used or expired" });
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

      // Mark token as used
      await firestore.collection("agent_enrollment_tokens").doc(tokenHash).update({
        used: true
      });

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
  const AGENT_RELEASES_BASE = "https://github.com/JessiJC44/HypeRMM/releases/latest/download";
  app.get("/api/agent/download/windows", (req, res) => res.redirect(`${AGENT_RELEASES_BASE}/hyperemote-agent-windows.exe`));
  app.get("/api/agent/download/linux", (req, res) => res.redirect(`${AGENT_RELEASES_BASE}/hyperemote-agent-linux`));
  app.get("/api/agent/download/mac", (req, res) => res.redirect(`${AGENT_RELEASES_BASE}/hyperemote-agent-mac-arm`)); // Default to arm, or could check user agent

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

      await firestore.collection("devices").doc(agentId).update(data);

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

  app.post("/api/scripts/ai-generate", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { description, language, targetOs } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key not configured" });
      }
      
      const genAI = new (await import("@google/genai")).GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "missing" });
      const response = await genAI.models.generateContent({ 
        model: "gemini-3-flash-preview",
        contents: description,
        config: {
          systemInstruction: `You are an expert IT administrator. Generate a ${language} script for ${targetOs} that does: ${description}. Return ONLY the script code, no explanations, no markdown code blocks. The script must be safe, idempotent if possible, and include basic error handling. Use variables like {variable_name} for values that should be configurable.`
        }
      });
      
      let text = response.text || "";
      
      // Clean up common markdown if model ignored the instruction
      text = text.replace(/^```[a-z]*\n/i, "").replace(/\n```$/i, "");
      
      res.json({ content: text });
    } catch (error) {
      console.error("❌ AI script generation error:", error);
      res.status(500).json({ error: "Failed to generate AI script" });
    }
  });

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

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
