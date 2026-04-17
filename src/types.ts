export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  customer: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo: string;
  userId: string;
  createdAt: string;
}

export type DeviceStatus = 'online' | 'offline' | 'warning';
export type DeviceType = 'workstation' | 'server' | 'laptop' | 'mobile';

export interface Device {
  id: string;
  name: string;
  userId: string;
  type: DeviceType;
  os: string;
  ipAddress: string;
  status: DeviceStatus;
  lastSeen: string;
  customer?: string;
  fluxId?: string;
  flux_id?: string;
  createdAt?: string;
}

export interface Alert {
  id: string;
  deviceId: string;
  deviceName: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  userId: string;
  timestamp: string;
}

export interface Site {
  id: string;
  name: string;
  address?: string;
  userId: string;
  createdAt?: string;
}

export interface Command {
  id: string;
  userId: string;
  deviceId: string;
  commandType: 'ping' | 'restart' | 'shutdown' | 'run_script' | 'get_info' | 'install_flux' | 'scan_patches' | 'install_patch';
  payload: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: string | null;
  createdAt: any;
  completedAt: any | null;
}

export interface DeviceLog {
  id: string;
  userId: string;
  deviceId: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source: 'agent' | 'system' | 'command';
  createdAt: any;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
