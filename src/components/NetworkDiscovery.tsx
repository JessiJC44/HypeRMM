import * as React from 'react';
import { Search, Network, Shield, AlertCircle, CheckCircle2, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

import { firestoreService } from '../services/firestoreService';
import { toast } from 'sonner';

import { auth } from '../lib/firebase';

export function NetworkDiscovery() {
  const [isScanning, setIsScanning] = React.useState(false);
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [showPermissionDialog, setShowPermissionDialog] = React.useState(false);
  const [discoveredDevices, setDiscoveredDevices] = React.useState<any[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');

  const fetchPermissionStatus = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/network/status', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      const data = await response.json();
      setHasPermission(data.permissionsGranted);
    } catch (error) {
      console.error("Failed to fetch permission status:", error);
    }
  };

  React.useEffect(() => {
    fetchPermissionStatus();
  }, []);

  const handleGrantPermission = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/network/grant-permission', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (response.ok) {
        setHasPermission(true);
        setShowPermissionDialog(false);
        startScan();
      }
    } catch (error) {
      toast.error("Failed to grant network permission");
    }
  };

  const startScan = async () => {
    if (!hasPermission) {
      setShowPermissionDialog(true);
      return;
    }

    setIsScanning(true);
    setDiscoveredDevices([]);
    toast.info("Scanning network for new devices...");
    
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/network/discover', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!response.ok) throw new Error('Scan failed');
      const data = await response.json();
      setDiscoveredDevices(data);
      toast.success(`Scan complete! Found ${data.length} devices.`);
    } catch (error) {
      toast.error("Network scan failed. Ensure the server is reachable.");
    } finally {
      setIsScanning(false);
    }
  };

  const filteredDevices = discoveredDevices.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.ip.includes(searchQuery) ||
    d.os.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const installAgent = async (name: string, ip: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Agents must be installed manually or via remote shell using the enrollment token.
      toast.info(`To install on ${name} (${ip}), use the "Installer un agent" command in Assets to get an enrollment token.`);
    } catch (error) {
      toast.error("Failed to initiate agent installation");
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
          <h1 className="text-2xl font-bold text-foreground">Network Discovery</h1>
          <p className="text-sm text-muted-foreground">Scan your network to find and manage unmanaged devices.</p>
        </div>
        <Button 
          onClick={startScan} 
          disabled={isScanning}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 gap-2"
        >
          {isScanning ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
          {isScanning ? 'Scanning Network...' : 'Start New Scan'}
        </Button>
      </motion.div>

      {showPermissionDialog && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex flex-col items-center text-center gap-4"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <Network size={32} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-blue-900">Autorisation Requise</h2>
            <p className="text-sm text-blue-700 max-w-md mx-auto mt-1">
              HypeRemote a besoin de votre autorisation pour accéder au réseau local afin de découvrir les appareils connectés (ordinateurs, imprimantes, serveurs).
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowPermissionDialog(false)} className="rounded-xl">Plus tard</Button>
            <Button onClick={handleGrantPermission} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">Autoriser l'accès</Button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {[
          { icon: CheckCircle2, label: 'Discovered Devices', value: isScanning ? '...' : filteredDevices.length.toString(), desc: 'Ready for agent install', color: 'emerald' },
          { icon: Shield, label: 'Managed Devices', value: '156', desc: '86% coverage', color: 'blue' },
          { icon: AlertCircle, label: 'Security Risks', value: filteredDevices.length > 3 ? '1' : '0', desc: 'Unrecognized devices found', color: 'rose' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="border-none shadow-sm h-full bg-card">
              <CardContent className="p-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-3xl font-bold text-foreground mt-1">{stat.value}</h3>
                <p className={cn(
                  "text-[10px] font-bold mt-2 flex items-center gap-1",
                  stat.color === 'emerald' ? "text-emerald-500" :
                  stat.color === 'blue' ? "text-primary" : "text-rose-500"
                )}>
                  <stat.icon size={12} />
                  {stat.desc}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-2xl shadow-sm border border-border overflow-x-auto"
      >
        <div className="min-w-[800px]">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-foreground">Discovered Devices List</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                className="pl-9 rounded-xl border-border bg-muted/20 text-foreground" 
                placeholder="Filter devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 text-left">
                <th className="py-4 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">Device Name</th>
                <th className="py-4 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">IP Address</th>
                <th className="py-4 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">System</th>
                <th className="py-4 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">Manufacturer</th>
                <th className="py-4 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDevices.length > 0 ? (
                filteredDevices.map((device, i) => (
                  <motion.tr 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-4 px-6 font-bold text-foreground whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{device.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{device.mac}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground font-medium whitespace-nowrap">{device.ip}</td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex flex-col">
                        <Badge variant="secondary" className="bg-muted text-muted-foreground border-none text-[10px] font-bold w-fit">{device.type}</Badge>
                        <span className="text-[10px] text-muted-foreground mt-0.5">{device.os}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground font-medium whitespace-nowrap">{device.mfg}</td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => installAgent(device.name, device.ip)}
                        className="text-primary font-bold hover:bg-primary/10 gap-2"
                      >
                        <Plus size={14} />
                        Install Agent
                      </Button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground font-medium italic">
                    {isScanning ? 'Scan en cours...' : 'Aucun appareil découvert. Lancez un scan pour commencer.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
