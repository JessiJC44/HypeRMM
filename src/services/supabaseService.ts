import { supabase } from '../lib/supabase';
import { SupabaseDevice, SupabaseCommand, SupabaseLog } from '../types/supabase';
import { auth } from '../lib/firebase';

const FLUX_SERVER_URL = (import.meta as any).env?.VITE_FLUX_SERVER_URL || '';

export const supabaseService = {
  // ============== DEVICES ==============
  
  getDevices: async (userId: string): Promise<SupabaseDevice[]> => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Supabase getDevices error:', error);
        throw error;
      }
      return data || [];
    } catch (err) {
      console.error('Failed to fetch devices:', err);
      throw err;
    }
  },

  subscribeToDevices: (userId: string, callback: (devices: SupabaseDevice[]) => void) => {
    // Initial fetch
    supabaseService.getDevices(userId)
      .then(callback)
      .catch(err => console.error('Initial device fetch failed:', err));

    // Real-time subscription
    const channel = supabase
      .channel('devices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Real-time device change:', payload);
          supabaseService.getDevices(userId).then(callback);
        }
      )
      .subscribe((status) => {
        console.log('Supabase subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },

  addDevice: async (userId: string, device: Omit<SupabaseDevice, 'id' | 'created_at' | 'last_seen'>): Promise<SupabaseDevice> => {
    const { data, error } = await supabase
      .from('devices')
      .insert({
        ...device,
        user_id: userId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  updateDevice: async (deviceId: string, updates: Partial<SupabaseDevice>): Promise<SupabaseDevice> => {
    const { data, error } = await supabase
      .from('devices')
      .update(updates)
      .eq('id', deviceId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  deleteDevice: async (deviceId: string): Promise<void> => {
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', deviceId);
    
    if (error) throw error;
  },

  // ============== COMMANDS ==============

  getCommands: async (userId: string): Promise<SupabaseCommand[]> => {
    const { data, error } = await supabase
      .from('commands')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  getCommandsByDevice: async (deviceId: string): Promise<SupabaseCommand[]> => {
    const { data, error } = await supabase
      .from('commands')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  subscribeToCommands: (userId: string, callback: (commands: SupabaseCommand[]) => void) => {
    supabaseService.getCommands(userId).then(callback);

    const channel = supabase
      .channel('commands-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'commands',
          filter: `user_id=eq.${userId}`
        },
        () => {
          supabaseService.getCommands(userId).then(callback);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  sendCommand: async (
    userId: string, 
    deviceId: string, 
    commandType: SupabaseCommand['command_type'], 
    payload?: string
  ): Promise<SupabaseCommand> => {
    const { data, error } = await supabase
      .from('commands')
      .insert({
        user_id: userId,
        device_id: deviceId,
        command_type: commandType,
        payload: payload || null,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  updateCommandStatus: async (
    commandId: string, 
    status: SupabaseCommand['status'], 
    result?: string
  ): Promise<void> => {
    const { error } = await supabase
      .from('commands')
      .update({ status, result: result || null })
      .eq('id', commandId);
    
    if (error) throw error;
  },

  // ============== LOGS ==============

  getLogs: async (userId: string, limit: number = 100): Promise<SupabaseLog[]> => {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  getLogsByDevice: async (deviceId: string, limit: number = 50): Promise<SupabaseLog[]> => {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  subscribeToLogs: (userId: string, callback: (logs: SupabaseLog[]) => void) => {
    supabaseService.getLogs(userId).then(callback);

    const channel = supabase
      .channel('logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'logs',
          filter: `user_id=eq.${userId}`
        },
        () => {
          supabaseService.getLogs(userId).then(callback);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  addLog: async (
    userId: string,
    deviceId: string,
    level: SupabaseLog['level'],
    message: string,
    source: SupabaseLog['source']
  ): Promise<SupabaseLog> => {
    const { data, error } = await supabase
      .from('logs')
      .insert({
        user_id: userId,
        device_id: deviceId,
        level,
        message,
        source
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ============== DASHBOARD STATS ==============

  getDashboardStats: async (userId: string) => {
    const [devicesResult, commandsResult, logsResult] = await Promise.all([
      supabase
        .from('devices')
        .select('id, status', { count: 'exact' })
        .eq('user_id', userId),
      supabase
        .from('commands')
        .select('id, status', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'pending'),
      supabase
        .from('logs')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .in('level', ['error', 'critical'])
    ]);

    const devices = devicesResult.data || [];
    const onlineDevices = devices.filter(d => d.status === 'online').length;

    return {
      totalDevices: devicesResult.count || 0,
      onlineDevices,
      offlineDevices: (devicesResult.count || 0) - onlineDevices,
      pendingCommands: commandsResult.count || 0,
      criticalLogs: logsResult.count || 0
    };
  },

  // ============== FLUX INTEGRATION ==============

  // Send command via Flux server
  sendFluxCommand: async (deviceId: string, action: string, payload: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const response = await fetch(`${FLUX_SERVER_URL}/flux/devices/${deviceId}/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': user.uid,
      },
      body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send command');
    }

    return response.json();
  },

  // Get command result
  getFluxCommandResult: async (commandId: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const response = await fetch(`${FLUX_SERVER_URL}/flux/commands/${commandId}`, {
      headers: {
        'X-Tenant-ID': user.uid,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get command result');
    }

    return response.json();
  },

  // Get connected devices from Flux
  getFluxDevices: async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const response = await fetch(`${FLUX_SERVER_URL}/flux/devices`, {
      headers: {
        'X-Tenant-ID': user.uid,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch Flux devices');
    }

    return response.json();
  }
};
