import * as React from 'react';
import { Plus, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { auth } from '../lib/firebase';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

async function authedFetch(path: string, opts: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  const res = await fetch(path, { ...opts, headers: { ...opts.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

interface Device {
  id: string;
  name: string;
}

export function ThresholdProfiles() {
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [thresholds, setThresholds] = React.useState<any[]>([]);
  const [presets, setPresets] = React.useState<Record<string, any>>({});
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [addOpen, setAddOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] = React.useState('');
  const [itemName, setItemName] = React.useState('');

  React.useEffect(() => {
    (async () => {
      try {
        const [presetsData] = await Promise.all([authedFetch('/api/thresholds/presets')]);
        setPresets(presetsData);
        const user = auth.currentUser;
        if (user) {
          const { collection, query, where, getDocs } = await import('firebase/firestore');
          const { db } = await import('../lib/firebase');
          const snap = await getDocs(query(collection(db, 'devices'), where('userId', '==', user.uid)));
          const ds = snap.docs.map(d => ({ id: d.id, name: (d.data() as any).name || d.id }));
          setDevices(ds);
          if (ds.length > 0 && !selectedDeviceId) setSelectedDeviceId(ds[0].id);
        }
      } catch (err) {
        toast.error('Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!selectedDeviceId) return;
    (async () => {
      try {
        const data = await authedFetch(`/api/thresholds/${selectedDeviceId}`);
        setThresholds(data);
      } catch (err) {
        setThresholds([]);
      }
    })();
  }, [selectedDeviceId]);

  const handleAdd = async () => {
    if (!selectedPreset || !selectedDeviceId) { toast.error('Pick a preset and device'); return; }
    try {
      await authedFetch('/api/thresholds', {
        method: 'POST',
        body: JSON.stringify({ deviceId: selectedDeviceId, presetId: selectedPreset, name: itemName || selectedPreset, enabled: true }),
      });
      toast.success('Threshold added');
      setAddOpen(false); setSelectedPreset(''); setItemName('');
      const data = await authedFetch(`/api/thresholds/${selectedDeviceId}`);
      setThresholds(data);
    } catch (err) {
      toast.error(`Failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="p-8 space-y-6 bg-background min-h-screen animate-in fade-in duration-500">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ShieldAlert className="text-primary" /> Thresholds
        </h1>
        <p className="text-sm text-muted-foreground">Monitoring thresholds with optional auto-healing.</p>
      </motion.div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Label>Device</Label>
          <select
            className="w-full h-10 px-3 rounded-md border border-input bg-background"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            {devices.length === 0 && <option value="">No devices yet</option>}
            {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <Button onClick={() => setAddOpen(true)} disabled={!selectedDeviceId} className="gap-2 mt-6 h-10 rounded-xl font-bold">
          <Plus size={16} /> Add Threshold
        </Button>
      </div>

      {loading && <div className="text-center py-12 text-muted-foreground font-black uppercase tracking-widest">Loading...</div>}
      {!loading && thresholds.length === 0 && (
        <Card className="border-none bg-muted/20 rounded-2xl"><CardContent className="p-12 text-center text-muted-foreground font-bold uppercase tracking-widest flex flex-col items-center gap-4">
          <ShieldAlert className="text-muted-foreground/30" size={48} />
          <p>No thresholds configured for this device.</p>
        </CardContent></Card>
      )}
      {!loading && thresholds.length > 0 && (
        <div className="space-y-4">
          {thresholds.map(t => (
            <Card key={t.id} className="border-none bg-card hover:bg-muted/30 transition-all rounded-2xl overflow-hidden shadow-sm">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-foreground">{t.name || t.presetId}</span>
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter rounded-full border-border/50">{t.presetId}</Badge>
                    <Badge className={cn(
                      "text-[10px] font-black uppercase tracking-tighter rounded-full border-none",
                      presets[t.presetId]?.severity === 'critical' ? 'bg-red-500/10 text-red-600' :
                      presets[t.presetId]?.severity === 'warning' ? 'bg-amber-500/10 text-amber-600' :
                      'bg-primary/10 text-primary'
                    )}>{presets[t.presetId]?.severity || 'info'}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mt-1">{presets[t.presetId]?.description || ''}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-2xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Add Threshold</DialogTitle>
            <DialogDescription className="font-bold text-muted-foreground">Pick a preset to monitor on this device.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Preset</Label>
              <select className="w-full h-12 px-4 rounded-xl border border-border bg-muted/20 focus:bg-background text-foreground transition-all font-bold appearance-none" value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value)}>
                <option value="">Select a preset...</option>
                {Object.entries(presets).map(([key, val]: any) => <option key={key} value={key}>{key} — {val.description}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Name (optional)</Label>
              <Input className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background transition-all font-bold" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Custom name" />
            </div>
          </div>
          <DialogFooter className="pt-6">
            <Button variant="outline" className="rounded-xl h-11 px-6 font-bold text-muted-foreground" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="rounded-xl h-11 px-8 font-black bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleAdd}>Add Threshold</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
