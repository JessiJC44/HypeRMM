import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock Data (Moved from constants.ts)
let tickets = [
  {
    id: 'T-1001',
    title: 'VPN Connection Issues',
    customer: 'Acme Corp',
    status: 'open',
    priority: 'high',
    assignedTo: 'John Doe',
    createdAt: '2024-03-20T10:00:00Z',
  },
  {
    id: 'T-1002',
    title: 'Printer Setup Request',
    customer: 'Global Logistics',
    status: 'pending',
    priority: 'low',
    assignedTo: 'Jane Smith',
    createdAt: '2024-03-20T11:30:00Z',
  },
  {
    id: 'T-1003',
    title: 'Server Disk Space Low',
    customer: 'Nexus IT',
    status: 'open',
    priority: 'critical',
    assignedTo: 'John Doe',
    createdAt: '2024-03-20T09:15:00Z',
  },
];

let devices = [
  {
    id: 'D-001',
    name: 'SRV-PROD-01',
    type: 'server',
    os: 'Windows Server 2022',
    status: 'online',
    lastSeen: '2024-03-20T12:00:00Z',
    ip: '192.168.1.10',
    customer: 'Pescespada Island',
    anydeskId: '123456789',
    splashtopId: 'ST-987654',
  },
  {
    id: 'D-002',
    name: 'WS-MKT-05',
    type: 'workstation',
    os: 'Windows 11 Pro',
    status: 'warning',
    lastSeen: '2024-03-20T11:45:00Z',
    ip: '192.168.1.55',
    customer: 'Acme Corp',
    anydeskId: '987654321',
  },
  {
    id: 'D-003',
    name: 'LAP-CEO-01',
    type: 'laptop',
    os: 'macOS Sonoma',
    status: 'offline',
    lastSeen: '2024-03-19T18:30:00Z',
    ip: '10.0.0.12',
    customer: 'Global Logistics',
    splashtopId: 'ST-112233',
  },
];

let alerts = [
  {
    id: 'A-001',
    deviceId: 'D-001',
    deviceName: 'SRV-PROD-01',
    message: 'CPU usage exceeded 90%',
    severity: 'critical',
    timestamp: '2024-03-20T11:55:00Z',
  },
  {
    id: 'A-002',
    deviceId: 'D-002',
    deviceName: 'WS-MKT-05',
    message: 'Antivirus out of date',
    severity: 'warning',
    timestamp: '2024-03-20T10:20:00Z',
  },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/tickets", (req, res) => {
    res.json(tickets);
  });

  app.post("/api/tickets", (req, res) => {
    const newTicket = {
      ...req.body,
      id: `T-${Math.floor(Math.random() * 10000)}`,
      createdAt: new Date().toISOString(),
      status: 'open'
    };
    tickets.push(newTicket);
    res.status(201).json(newTicket);
  });

  app.get("/api/devices", (req, res) => {
    res.json(devices);
  });

  app.post("/api/devices", (req, res) => {
    const newDevice = {
      ...req.body,
      id: `D-${Math.floor(Math.random() * 10000)}`,
      lastSeen: new Date().toISOString(),
      status: 'online'
    };
    devices.push(newDevice);
    res.status(201).json(newDevice);
  });

  app.get("/api/alerts", (req, res) => {
    res.json(alerts);
  });

  app.get("/api/stats", (req, res) => {
    res.json({
      openTickets: tickets.filter(t => t.status === 'open').length,
      managedDevices: devices.length,
      activeAlerts: alerts.length,
      slaCompliance: "98.2%"
    });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
