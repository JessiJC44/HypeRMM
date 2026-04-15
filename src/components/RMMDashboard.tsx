import * as React from 'react';
import { Monitor, Terminal, FileText, Activity, Send, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { auth } from '../lib/firebase';
import { supabaseService } from '../services/supabaseService';
import { SupabaseDevice, SupabaseCommand, SupabaseLog } from '../types/supabase';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export function RMMDashboard() {
  const [devices, setDevices] = React.useState<SupabaseDevice[]>([]);
  const [commands, setCommands] = React.useState<SupabaseCommand[]>([]);
  const [logs, setLogs] = React.useState<SupabaseLog[]>([]);
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = React.useState<string>('');
  const [commandType, setCommandType] = React.useState<string>('ping');
  const [commandPayload, setCommandPayload] = React.useState<string>('');
  const [sendingCommand, setSendingCommand] = React.useState(false);
  const [addingDevice, setAddingDevice] = React.useState(false);

  React.useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Safety timeout: stop loading after 10 seconds no matter what
    const timeout = setTimeout(() => {
      setLoading(false);
      setError("Connection timed out. Please ensure your Supabase tables are created in the SQL Editor.");
    }, 10000);

    const loadStats = async () => {
      try {
        const data = await supabaseService.getDashboardStats(user.uid);
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    };

    let unsubDevices = () => {};
    let unsubCommands = () => {};
    let unsubLogs = () => {};

    try {
      unsubDevices = supabaseService.subscribeToDevices(user.uid, (data) => {
        setDevices(data);
        setLoading(false);
        setError(null);
        clearTimeout(timeout);
      });

      unsubCommands = supabaseService.subscribeToCommands(user.uid, setCommands);
      unsubLogs = supabaseService.subscribeToLogs(user.uid, setLogs);
      loadStats();
    } catch (err: any) {
      console.error("Subscription error:", err);
      setError(err.message || "Failed to connect to Supabase");
      setLoading(false);
      clearTimeout(timeout);
    }

    return () => {
      unsubDevices();
      unsubCommands();
      unsubLogs();
      clearTimeout(timeout);
    };
  }, []);

  const handleSendCommand = async () => {
    const user = auth.currentUser;
    if (!user || !selectedDevice) return;

    setSendingCommand(true);
    try {
      await supabaseService.sendCommand(
        user.uid,
        selectedDevice,
        commandType as any,
        commandPayload || undefined
      );
      toast.success('Command sent successfully');
      setCommandPayload('');
      
      // Refresh stats
      const data = await supabaseService.getDashboardStats(user.uid);
      setStats(data);
    } catch (error) {
      toast.error('Failed to send command');
      console.error(error);
    } finally {
      setSendingCommand(false);
    }
  };

  const handleAddTestDevice = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setAddingDevice(true);
    try {
      await supabaseService.addDevice(user.uid, {
        name: `Test-PC-${Math.floor(Math.random() * 1000)}`,
        user_id: user.uid,
        os: ['Windows', 'Linux', 'macOS'][Math.floor(Math.random() * 3)],
        ip_address: `192.168.1.${Math.floor(Math.random() * 254)}`,
        status: Math.random() > 0.3 ? 'online' : 'offline'
      });
      toast.success('Test device added');
      
      // Refresh stats
      const data = await supabaseService.getDashboardStats(user.uid);
      setStats(data);
    } catch (error) {
      toast.error('Failed to add device');
      console.error(error);
    } finally {
      setAddingDevice(false);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      await supabaseService.deleteDevice(deviceId);
      toast.success('Device deleted');
      
      // Refresh stats
      const user = auth.currentUser;
      if (user) {
        const data = await supabaseService.getDashboardStats(user.uid);
        setStats(data);
      }
    } catch (error) {
      toast.error('Failed to delete device');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[calc(100vh-64px)] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
        <p className="text-muted-foreground animate-pulse">Connecting to Supabase...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[calc(100vh-64px)] space-y-6 text-center max-w-md mx-auto">
        <div className="p-4 bg-rose-500/10 rounded-full">
          <Monitor size={48} className="text-rose-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Connection Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <div className="bg-muted p-4 rounded-lg text-left w-full space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Fix:</p>
          <p className="text-sm">Go to Supabase SQL Editor and run the script I provided to create the tables.</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw size={16} className="mr-2" />
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-8 bg-background min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">RMM Dashboard</h1>
          <p className="text-muted-foreground text-sm">Powered by Supabase • Real-time monitoring</p>
        </div>
        <Button onClick={handleAddTestDevice} variant="outline" disabled={addingDevice}>
          {addingDevice ? (
            <RefreshCw size={16} className="animate-spin mr-2" />
          ) : (
            <Plus size={16} className="mr-2" />
          )}
          Add Test Device
        </Button>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Devices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDevices}</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Online</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats.onlineDevices}</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Commands</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">{stats.pendingCommands}</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Critical Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-500">{stats.criticalLogs}</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Devices List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor size={20} />
              Devices ({devices.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
            {devices.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No devices yet. Click "Add Test Device" to get started.
              </p>
            ) : (
              devices.map((device) => (
                <div 
                  key={device.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors ${selectedDevice === device.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedDevice(device.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-rose-500'}`} />
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-xs text-muted-foreground">{device.os} • {device.ip_address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                      {device.status}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-rose-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDevice(device.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Send Command */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal size={20} />
              Send Command
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Device</label>
              <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a device" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name} ({device.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Command Type</label>
              <Select value={commandType} onValueChange={setCommandType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ping">Ping</SelectItem>
                  <SelectItem value="restart">Restart</SelectItem>
                  <SelectItem value="shutdown">Shutdown</SelectItem>
                  <SelectItem value="run_script">Run Script</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {commandType === 'run_script' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Script / Payload</label>
                <Input 
                  value={commandPayload}
                  onChange={(e) => setCommandPayload(e.target.value)}
                  placeholder="Enter script or command..."
                />
              </div>
            )}

            <Button 
              onClick={handleSendCommand}
              disabled={!selectedDevice || sendingCommand}
              className="w-full"
            >
              {sendingCommand ? (
                <span className="flex items-center gap-2">
                  <RefreshCw size={16} className="animate-spin" />
                  Sending...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send size={16} />
                  Send Command
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Commands */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity size={20} />
              Recent Commands
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[250px] overflow-y-auto">
            {commands.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No commands sent yet.</p>
            ) : (
              commands.slice(0, 10).map((cmd) => (
                <div key={cmd.id} className="flex items-center justify-between p-2 rounded border">
                  <div>
                    <p className="font-medium text-sm">{cmd.command_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(cmd.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={
                    cmd.status === 'completed' ? 'default' :
                    cmd.status === 'failed' ? 'destructive' :
                    cmd.status === 'running' ? 'secondary' : 'outline'
                  }>
                    {cmd.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} />
              Recent Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[250px] overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No logs yet.</p>
            ) : (
              logs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-start gap-2 p-2 rounded border">
                  <Badge variant={
                    log.level === 'critical' ? 'destructive' :
                    log.level === 'error' ? 'destructive' :
                    log.level === 'warning' ? 'secondary' : 'outline'
                  } className="shrink-0">
                    {log.level}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm truncate">{log.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.source} • {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
