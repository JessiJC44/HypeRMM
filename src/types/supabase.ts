export interface SupabaseDevice {
  id: string;
  name: string;
  user_id: string;
  os: string;
  ip_address: string;
  status: 'online' | 'offline';
  flux_id?: string;
  hostname?: string;
  cpu?: string;
  ram_total?: number;
  ram_used?: number;
  disk_total?: number;
  disk_used?: number;
  agent_version?: string;
  public_ip?: string;
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
