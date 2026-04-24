import * as React from 'react';
import { Printer, Wifi, Server, Activity, Plus, Search, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { auth, db } from '@/src/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

async function authedFetch(path: string, opts: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  const res = await fetch(path, {
    ...opts,
    headers: { ...opts.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`${res.status}: ${err}`);
  }
  return res.json();
}

interface SnmpDevice {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  snmpVersion: string;
  deviceType: string;
  status: string;
  lastSeen?: any;
  templateId?: string;
  proxyAgentId?: string;
}

interface SnmpTemplate {
  id: string;
  name: string;
  deviceType: string;
  oids: Array<{ name: string; oid: string; valueType: string; unit?: string; isMonitored?: boolean }>;
}

interface ProxyAgent {
  id: string;
  name: string;
  os: string;
  status: string;
}

function deviceTypeIcon(type: string) {
  const t = (type || '').toLowerCase();
  if (t.includes('printer')) return Printer;
  if (t.includes('router') || t.includes('switch') || t.includes('ap') || t.includes('wifi')) return Wifi;
  return Server;
}

function formatRelative(timestamp: any): string {
  if (!timestamp) return 'Never';
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function SNMP() {
  const [devices, setDevices] = React.useState<SnmpDevice[]>([]);
  const [templates, setTemplates] = React.useState<SnmpTemplate[]>([]);
  const [proxyAgents, setProxyAgents] = React.useState<ProxyAgent[]>([]);
  const [tab, setTab] = React.useState<'devices' | 'templates'>('devices');
  const [search, setSearch] = React.useState('');
  const [addDeviceOpen, setAddDeviceOpen] = React.useState(false);
  const [addTemplateOpen, setAddTemplateOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // Form state for add device
  const [formDevice, setFormDevice] = React.useState({
    name: '', ipAddress: '', port: 161, snmpVersion: 'v2c' as 'v1' | 'v2c' | 'v3',
    communityString: '', deviceType: 'printer', templateId: '', proxyAgentId: '',
  });

  // Form state for add template
  const [formTemplate, setFormTemplate] = React.useState({
    name: '', deviceType: 'printer', description: '',
  });

  React.useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubDevices = onSnapshot(
      query(collection(db, 'snmp_devices'), where('userId', '==', user.uid)),
      (snap) => {
        setDevices(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
        setLoading(false);
      }
    );
    const unsubTemplates = onSnapshot(
      query(collection(db, 'snmp_templates'), where('userId', '==', user.uid)),
      (snap) => setTemplates(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
    const unsubDevicesRmm = onSnapshot(
      query(collection(db, 'devices'), where('userId', '==', user.uid), where('status', '==', 'online')),
      (snap) => setProxyAgents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );

    return () => {
      unsubDevices();
      unsubTemplates();
      unsubDevicesRmm();
    };
  }, []);

  const filtered = devices.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.ipAddress.includes(q) || (d.deviceType || '').toLowerCase().includes(q);
  });

  const stats = {
    total: devices.length,
    online: devices.filter((d) => d.status === 'online').length,
    offline: devices.filter((d) => d.status === 'offline').length,
    unknown: devices.filter((d) => !d.status || d.status === 'unknown').length,
  };

  const handleAddDevice = async () => {
    if (!formDevice.name || !formDevice.ipAddress || !formDevice.proxyAgentId) {
      toast.error('Name, IP, and proxy agent are required');
      return;
    }
    try {
      await authedFetch('/api/snmp/devices', {
        method: 'POST',
        body: JSON.stringify(formDevice),
      });
      toast.success('SNMP device added');
      setAddDeviceOpen(false);
      setFormDevice({ name: '', ipAddress: '', port: 161, snmpVersion: 'v2c', communityString: '', deviceType: 'printer', templateId: '', proxyAgentId: '' });
    } catch (err) {
      toast.error(`Failed: ${(err as Error).message}`);
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm('Delete this SNMP device?')) return;
    try {
      await authedFetch(`/api/snmp/devices/${id}`, { method: 'DELETE' });
      toast.success('Deleted');
    } catch (err) {
      toast.error(`Failed: ${(err as Error).message}`);
    }
  };

  const handlePollNow = async (id: string) => {
    try {
      await authedFetch(`/api/snmp/devices/${id}/poll-now`, { method: 'POST' });
      toast.success('Poll queued');
    } catch (err) {
      toast.error(`Failed: ${(err as Error).message}`);
    }
  };

  const handleAddTemplate = async () => {
    if (!formTemplate.name) {
      toast.error('Name required');
      return;
    }
    try {
      await authedFetch('/api/snmp/templates', {
        method: 'POST',
        body: JSON.stringify({ ...formTemplate, oids: [] }),
      });
      toast.success('Template created');
      setAddTemplateOpen(false);
      setFormTemplate({ name: '', deviceType: 'printer', description: '' });
    } catch (err) {
      toast.error(`Failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen animate-in fade-in duration-500">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">SNMP Monitoring</h1>
          <p className="text-sm text-muted-foreground font-medium">Monitor printers, switches, routers and other SNMP-enabled devices.</p>
        </div>
      </motion.div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'devices' | 'templates')}>
        <TabsList>
          <TabsTrigger value="devices">Devices ({devices.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-6 mt-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardContent className="p-6"><div className="text-xs font-bold text-muted-foreground uppercase">Total</div><div className="text-3xl font-black">{stats.total}</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="text-xs font-bold text-emerald-600 uppercase">Online</div><div className="text-3xl font-black">{stats.online}</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="text-xs font-bold text-red-600 uppercase">Offline</div><div className="text-3xl font-black">{stats.offline}</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="text-xs font-bold text-muted-foreground uppercase">Unknown</div><div className="text-3xl font-black">{stats.unknown}</div></CardContent></Card>
          </div>

          {/* Search + Add */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input placeholder="Search devices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Button onClick={() => setAddDeviceOpen(true)} className="gap-2">
              <Plus size={16} /> Add SNMP Device
            </Button>
          </div>

          {/* Devices table */}
          {loading && <div className="text-center py-12 text-muted-foreground">Loading...</div>}
          {!loading && filtered.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-sm text-muted-foreground">{devices.length === 0 ? 'No SNMP devices yet. Add your first one to start monitoring.' : 'No matches for your search.'}</p>
              </CardContent>
            </Card>
          )}
          {!loading && filtered.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left text-xs font-bold uppercase p-3"></th>
                      <th className="text-left text-xs font-bold uppercase p-3">Name</th>
                      <th className="text-left text-xs font-bold uppercase p-3">Address</th>
                      <th className="text-left text-xs font-bold uppercase p-3">Type</th>
                      <th className="text-left text-xs font-bold uppercase p-3">Version</th>
                      <th className="text-left text-xs font-bold uppercase p-3">Last Seen</th>
                      <th className="text-right text-xs font-bold uppercase p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d) => {
                      const Icon = deviceTypeIcon(d.deviceType);
                      return (
                        <tr key={d.id} className="border-b border-border hover:bg-muted/20">
                          <td className="p-3">
                            <div className={cn('w-2 h-2 rounded-full', d.status === 'online' ? 'bg-emerald-500' : d.status === 'offline' ? 'bg-red-500' : 'bg-muted-foreground')} />
                          </td>
                          <td className="p-3 font-medium">{d.name}</td>
                          <td className="p-3 text-sm text-muted-foreground font-mono">{d.ipAddress}:{d.port}</td>
                          <td className="p-3"><div className="flex items-center gap-2"><Icon size={16} /> <span className="text-sm">{d.deviceType}</span></div></td>
                          <td className="p-3"><Badge variant="outline" className="text-xs">{d.snmpVersion.toUpperCase()}</Badge></td>
                          <td className="p-3 text-sm text-muted-foreground">{formatRelative(d.lastSeen)}</td>
                          <td className="p-3 text-right">
                            <Button size="sm" variant="ghost" onClick={() => handlePollNow(d.id)}><RefreshCw size={14} /></Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteDevice(d.id)}><Trash2 size={14} /></Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">OID templates define what to monitor on each device type.</p>
            <Button onClick={() => setAddTemplateOpen(true)} className="gap-2">
              <Plus size={16} /> New Template
            </Button>
          </div>
          {templates.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-sm text-muted-foreground">No templates yet. Create one to define reusable OID sets.</p>
              </CardContent>
            </Card>
          )}
          {templates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-1">{t.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{t.deviceType}</p>
                    <Badge>{(t.oids || []).length} OIDs</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Device Dialog */}
      <Dialog open={addDeviceOpen} onOpenChange={setAddDeviceOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add SNMP Device</DialogTitle>
            <DialogDescription>Configure monitoring for a network device.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={formDevice.name} onChange={(e) => setFormDevice({ ...formDevice, name: e.target.value })} placeholder="Office Printer" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>IP Address</Label><Input value={formDevice.ipAddress} onChange={(e) => setFormDevice({ ...formDevice, ipAddress: e.target.value })} placeholder="192.168.1.100" /></div>
              <div><Label>Port</Label><Input type="number" value={formDevice.port} onChange={(e) => setFormDevice({ ...formDevice, port: parseInt(e.target.value) || 161 })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>SNMP Version</Label>
                <select className="w-full h-10 px-3 rounded-md border border-input bg-background" value={formDevice.snmpVersion} onChange={(e) => setFormDevice({ ...formDevice, snmpVersion: e.target.value as 'v1' | 'v2c' | 'v3' })}>
                  <option value="v1">v1</option>
                  <option value="v2c">v2c</option>
                  <option value="v3">v3</option>
                </select>
              </div>
              <div>
                <Label>Device Type</Label>
                <select className="w-full h-10 px-3 rounded-md border border-input bg-background" value={formDevice.deviceType} onChange={(e) => setFormDevice({ ...formDevice, deviceType: e.target.value })}>
                  <option value="printer">Printer</option>
                  <option value="switch">Switch</option>
                  <option value="router">Router</option>
                  <option value="firewall">Firewall</option>
                  <option value="wifi_ap">Wi-Fi Access Point</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            {(formDevice.snmpVersion === 'v1' || formDevice.snmpVersion === 'v2c') && (
              <div><Label>Community String</Label><Input type="password" value={formDevice.communityString} onChange={(e) => setFormDevice({ ...formDevice, communityString: e.target.value })} placeholder="public" /></div>
            )}
            <div>
              <Label>Template (optional)</Label>
              <select className="w-full h-10 px-3 rounded-md border border-input bg-background" value={formDevice.templateId} onChange={(e) => setFormDevice({ ...formDevice, templateId: e.target.value })}>
                <option value="">No template</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Proxy Agent (which device polls this SNMP target)</Label>
              <select className="w-full h-10 px-3 rounded-md border border-input bg-background" value={formDevice.proxyAgentId} onChange={(e) => setFormDevice({ ...formDevice, proxyAgentId: e.target.value })}>
                <option value="">Select an online agent...</option>
                {proxyAgents.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.os})</option>)}
              </select>
              {proxyAgents.length === 0 && <p className="text-xs text-amber-600 mt-1">No online agents. Install one first on a device in the same network as your SNMP target.</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDeviceOpen(false)}>Cancel</Button>
            <Button onClick={handleAddDevice}>Add Device</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Template Dialog */}
      <Dialog open={addTemplateOpen} onOpenChange={setAddTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New SNMP Template</DialogTitle>
            <DialogDescription>Define a reusable OID template.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={formTemplate.name} onChange={(e) => setFormTemplate({ ...formTemplate, name: e.target.value })} /></div>
            <div>
              <Label>Device Type</Label>
              <select className="w-full h-10 px-3 rounded-md border border-input bg-background" value={formTemplate.deviceType} onChange={(e) => setFormTemplate({ ...formTemplate, deviceType: e.target.value })}>
                <option value="printer">Printer</option>
                <option value="switch">Switch</option>
                <option value="router">Router</option>
                <option value="firewall">Firewall</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div><Label>Description</Label><Input value={formTemplate.description} onChange={(e) => setFormTemplate({ ...formTemplate, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTemplateOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTemplate}>Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
