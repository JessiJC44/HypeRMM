export interface SupabaseDevice {
  id: string;
  name: string;
  user_id: string;
  os: string;
  ip_address: string;
  status: 'online' | 'offline';
  last_seen: string;
  created_at: string;
}

export interface SupabaseCommand {
  id: string;
  device_id: string;
  user_id: string;
  command_type: 'ping' | 'restart' | 'shutdown' | 'run_script';
  payload?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  created_at: string;
}

export interface SupabaseLog {
  id: string;
  device_id: string;
  user_id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source: 'agent' | 'system' | 'command';
  created_at: string;
}
