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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
