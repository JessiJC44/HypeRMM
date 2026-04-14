export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Ticket {
  id: string;
  title: string;
  customer: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo: string;
  createdAt: string;
}

export type DeviceStatus = 'online' | 'offline' | 'warning';

export interface Device {
  id: string;
  name: string;
  type: 'workstation' | 'server' | 'laptop' | 'mobile';
  os: string;
  status: DeviceStatus;
  lastSeen: string;
  ip: string;
  customer?: string;
  anydeskId?: string;
  splashtopId?: string;
}

export interface Alert {
  id: string;
  deviceId: string;
  deviceName: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
