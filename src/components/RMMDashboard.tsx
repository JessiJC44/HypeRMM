import * as React from 'react';
import { Monitor, Terminal, FileText, Activity, Send, RefreshCw, Plus, Trash2, Server, ExternalLink } from 'lucide-react';
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
import { firestoreService } from '../services/firestoreService';
import { Device, Command, DeviceLog } from '../types';
import { toast } from 'sonner';
import { motion } from 'motion/react';

const AppleIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.1 2.48-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.24-1.99 1.1-3.15-1.04.04-2.3.69-3.05 1.56-.67.77-1.26 1.97-1.1 3.1 1.16.09 2.32-.68 3.05-1.51z"/>
  </svg>
);

export function RMMDashboard() {
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [commands, setCommands] = React.useState<Command[]>([]);
  const [logs, setLogs] = React.useState<DeviceLog[]>([]);
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = React.useState<string>('');
  const [commandType, setCommandType] = React.useState<string>('ping');
  const [commandPayload, setCommandPayload] = React.useState<string>('');
  const [sendingCommand, setSendingCommand] = React.useState(false);

  React.useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const loadStats = async () => {
      try {
        const data = await firestoreService.getDashboardStats(user.uid);
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    };

    let unsubDevices = () => {};
    let unsubCommands = () => {};
    let unsubLogs = () => {};

    try {
      unsubDevices = firestoreService.subscribeToDevices(user.uid, (data) => {
        setDevices(data);
        setLoading(false);
        setError(null);
      });

      unsubCommands = firestoreService.subscribeToCommands(user.uid, setCommands);
      unsubLogs = firestoreService.subscribeToDeviceLogs(user.uid, setLogs);
      loadStats();
    } catch (err: any) {
      console.error("Subscription error:", err);
      setError(err.message || "Failed to connect to monitoring service");
      setLoading(false);
    }

    return () => {
      unsubDevices();
      unsubCommands();
      unsubLogs();
    };
  }, []);

  const handleSendCommand = async () => {
    const user = auth.currentUser;
    if (!user || !selectedDevice) return;

    setSendingCommand(true);
    try {
      await firestoreService.sendCommand(
        selectedDevice,
        commandType,
        commandPayload || undefined
      );
      toast.success('Command queued successfully');
      setCommandPayload('');
      
      // Refresh stats
      const data = await firestoreService.getDashboardStats(user.uid);
      setStats(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send command');
      console.error(error);
    } finally {
      setSendingCommand(false);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      await firestoreService.deleteDevice(deviceId);
      toast.success('Device deletion requested');
      
      // Refresh stats
      const user = auth.currentUser;
      if (user) {
        const data = await firestoreService.getDashboardStats(user.uid);
        setStats(data);
      }
    } catch (error) {
      toast.error('Failed to delete device (Admin required)');
      console.error(error);
    }
  };

  const handleFluxConnect = (fluxId: string) => {
    if (!fluxId) {
      toast.error('Remote access not available. Flux is not installed on this device.');
      return;
    }
    // Open Flux/RustDesk with the device ID
    window.open(`rustdesk://connect/${fluxId}`, '_blank');
    toast.info('Opening remote connection...');
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[calc(100vh-64px)] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
        <p className="text-muted-foreground animate-pulse">Loading dashboard...</p>
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
          <p className="text-muted-foreground text-sm">Secure Remote Management • Real-time</p>
        </div>
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
                <div className="text-2xl font-bold">{stats.managedDevices}</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-blue">{stats.openTickets}</div>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-500">{stats.activeAlerts}</div>
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
                    <div className="relative">
                      <div className={`absolute -right-1 -bottom-1 w-3 h-3 rounded-full border-2 border-background ${device.status === 'online' ? 'bg-green-500' : 'bg-rose-500'}`} />
                      <div className="p-2 bg-muted rounded-lg">
                        {device.os.toLowerCase().includes('windows') ? <Monitor size={18} className="text-blue-500" /> : 
                         device.os.toLowerCase().includes('linux') ? <Server size={18} className="text-orange-500" /> : 
                         <AppleIcon size={18} className="text-slate-700" />}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-xs text-muted-foreground">{device.os} • {device.ipAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                      {device.status}
                    </Badge>
                    {(device.flux_id || device.fluxId) && (
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-1 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFluxConnect(device.flux_id || device.fluxId || '');
                        }}
                      >
                        <Monitor size={14} />
                        Connect
                      </Button>
                    )}
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
                    <p className="font-medium text-sm">{cmd.commandType}</p>
                    <p className="text-xs text-muted-foreground">
                      {cmd.createdAt?.seconds ? new Date(cmd.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
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
                      {log.source} • {log.createdAt?.seconds ? new Date(log.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
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
