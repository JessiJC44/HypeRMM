import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Setup
const SUPABASE_URL = process.env.SUPABASE_URL || "https://vyrnbsybajwqajwmishy.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY!);

// Flux state
interface ConnectedDevice {
  device_id: string;
  tenant_id: string;
  hostname: string;
  os: string;
  status: "online" | "offline";
  last_seen: string;
  ws: WebSocket;
}

const connectedDevices = new Map<string, ConnectedDevice>();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = createServer(app);

  app.use(express.json());

  // === Flux REST API ===

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok",
      flux: {
        connected_devices: connectedDevices.size,
        uptime: process.uptime()
      }
    });
  });

  // List connected devices for a tenant
  app.get("/flux/devices", async (req, res) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    if (!tenantId) return res.status(401).json({ error: "Missing Tenant ID" });

    const devices = Array.from(connectedDevices.values())
      .filter((d) => d.tenant_id === tenantId)
      .map(({ ws, ...rest }) => rest);

    res.json(devices);
  });

  // Send command to device
  app.post("/flux/devices/:deviceId/command", async (req, res) => {
    const { deviceId } = req.params;
    const { action, payload } = req.body;
    const tenantId = req.headers["x-tenant-id"] as string;

    if (!tenantId) return res.status(401).json({ error: "Missing Tenant ID" });

    const device = connectedDevices.get(deviceId);
    if (!device) return res.status(404).json({ error: "Device not connected" });
    if (device.tenant_id !== tenantId) return res.status(403).json({ error: "Access denied" });

    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Store in Supabase
    const { error } = await supabase.from("commands").insert({
      id: commandId,
      device_id: deviceId,
      user_id: tenantId,
      command_type: action,
      payload: JSON.stringify({ command: payload }),
      status: "pending",
    });

    if (error) {
      console.error("❌ Command create error:", error);
      return res.status(500).json({ error: "Failed to create command" });
    }

    // Send via WebSocket
    device.ws.send(JSON.stringify({
      type: "command",
      command_id: commandId,
      action,
      payload,
    }));

    // Update status to sent
    await supabase.from("commands").update({ status: "running" }).eq("id", commandId);

    res.json({ command_id: commandId, status: "sent" });
  });

  // Get command result
  app.get("/flux/commands/:commandId", async (req, res) => {
    const { commandId } = req.params;
    const tenantId = req.headers["x-tenant-id"] as string;

    if (!tenantId) return res.status(401).json({ error: "Missing Tenant ID" });

    const { data, error } = await supabase
      .from("commands")
      .select("*")
      .eq("id", commandId)
      .eq("user_id", tenantId)
      .single();

    if (error || !data) return res.status(404).json({ error: "Command not found" });
    res.json(data);
  });

  // === WebSocket Server ===
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : "";

    if (pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      // Vite handles its own HMR websockets, but we can ignore them if they are handled by vite middleware
      // In this environment HMR is often disabled or handled via the proxy, but vite.middlewares handles it.
      // If we don't handle it, it will be destroyed. Let's see if Vite needs it.
    }
  });

  wss.on("connection", (ws: WebSocket, req) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const deviceId = req.headers["x-device-id"] as string;

    if (!tenantId || !deviceId) {
      console.log("🔌 Rejected connection: missing headers");
      ws.close(1008, "Missing Headers");
      return;
    }

    console.log(`🔌 New connection: ${deviceId} (tenant: ${tenantId})`);

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleFluxMessage(ws, message, tenantId, deviceId);
      } catch (err) {
        console.error("❌ Message parse error:", err);
      }
    });

    ws.on("close", async () => {
      console.log(`🔌 Disconnected: ${deviceId}`);
      connectedDevices.delete(deviceId);
      
      await supabase
        .from("devices")
        .update({ status: "offline", last_seen: new Date().toISOString() })
        .eq("id", deviceId);
    });
  });

  async function handleFluxMessage(ws: WebSocket, message: any, tenantId: string, deviceId: string) {
    switch (message.type) {
      case "register":
        const device: ConnectedDevice = {
          device_id: deviceId,
          tenant_id: tenantId,
          hostname: message.hostname,
          os: message.os,
          status: "online",
          last_seen: new Date().toISOString(),
          ws,
        };
        connectedDevices.set(deviceId, device);

        await supabase.from("devices").upsert({
          id: deviceId,
          user_id: tenantId,
          name: message.hostname,
          hostname: message.hostname,
          os: message.os,
          status: "online",
          last_seen: new Date().toISOString(),
          flux_id: deviceId,
          agent_version: message.version || "1.0.0",
        }, { onConflict: "id" });

        console.log(`✅ Device registered: ${message.hostname} (${deviceId})`);
        ws.send(JSON.stringify({ type: "registered", device_id: deviceId }));
        break;

      case "heartbeat":
        const connected = connectedDevices.get(deviceId);
        if (connected) connected.last_seen = new Date().toISOString();

        await supabase.from("devices").update({
          status: "online",
          last_seen: new Date().toISOString(),
          cpu: message.cpu.toString(),
          ram_used: message.ram,
          disk_used: message.disk_used,
          disk_total: message.disk_total,
        }).eq("id", deviceId);
        break;

      case "result":
        console.log(`📥 Result for command ${message.command_id}: ${message.status}`);
        await supabase.from("commands").update({
          status: message.status === "success" ? "completed" : "failed",
          result: message.output,
        }).eq("id", message.command_id);

        await supabase.from("logs").insert({
          device_id: deviceId,
          user_id: tenantId,
          level: message.status === "success" ? "info" : "error",
          message: `Command ${message.command_id} ${message.status}: ${message.output.substring(0, 100)}...`,
          source: "command",
        });
        break;
    }
  }

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
