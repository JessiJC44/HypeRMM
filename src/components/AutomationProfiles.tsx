import * as React from 'react';
import { Plus, Workflow, Trash2, Play } from 'lucide-react';
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

export function AutomationProfiles() {
  const [profiles, setProfiles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    windowsPatches: false,
    wingetUpdate: false,
    chocoUpdate: false,
    macRecommended: false,
    homebrewUpdate: false,
    linuxUpgrade: false,
    tempCleanup: false,
    defrag: false,
  });

  const load = async () => {
    try {
      setLoading(true);
      const data = await authedFetch('/api/automation/profiles');
      setProfiles(data);
    } catch (err) {
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    try {
      const tasks: any = {
        windows: {
          patches: { critical: form.windowsPatches },
          winget: { updateAllSoftware: form.wingetUpdate },
          chocolatey: { updateAllSoftware: form.chocoUpdate },
        },
        mac: {
          recommended: form.macRecommended,
          homebrew: { updateAllSoftware: form.homebrewUpdate },
        },
        linux: { upgradePackages: form.linuxUpgrade },
        maintenance: { deleteTempFiles: form.tempCleanup },
        diskManagement: { defrag: form.defrag },
      };
      await authedFetch('/api/automation/profiles', {
        method: 'POST',
        body: JSON.stringify({ name: form.name, active: true, tasks, schedules: [] }),
      });
      toast.success('Profile created');
      setAddOpen(false);
      setForm({ name: '', windowsPatches: false, wingetUpdate: false, chocoUpdate: false, macRecommended: false, homebrewUpdate: false, linuxUpgrade: false, tempCleanup: false, defrag: false });
      await load();
    } catch (err) {
      toast.error(`Failed: ${(err as Error).message}`);
    }
  };

  const handleRunNow = async (id: string) => {
    try {
      await authedFetch(`/api/automation/profiles/${id}/run-now`, { method: 'POST' });
      toast.success('Profile execution queued');
    } catch (err) {
      toast.error(`Failed: ${(err as Error).message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this profile?')) return;
    try {
      await authedFetch(`/api/automation/profiles/${id}`, { method: 'DELETE' });
      toast.success('Deleted');
      await load();
    } catch (err) {
      toast.error(`Failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="p-8 space-y-6 bg-background min-h-screen animate-in fade-in duration-500">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Workflow className="text-primary" /> Automation Profiles
          </h1>
          <p className="text-sm text-muted-foreground font-medium">Scheduled maintenance tasks across your devices.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2 h-11 rounded-xl px-6 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/10 transition-all hover:scale-[1.02]"><Plus size={16} /> New Profile</Button>
      </motion.div>

      {loading && <div className="text-center py-12 text-muted-foreground font-black uppercase tracking-widest">Loading...</div>}
      {!loading && profiles.length === 0 && (
        <Card className="border-none bg-muted/20 rounded-2xl"><CardContent className="p-12 text-center text-muted-foreground font-bold uppercase tracking-widest flex flex-col items-center gap-4">
          <Workflow className="text-muted-foreground/30" size={48} />
          <p>No profiles yet. Create one to automate patches, updates, and maintenance.</p>
        </CardContent></Card>
      )}
      {!loading && profiles.length > 0 && (
        <div className="space-y-4">
          {profiles.map(p => (
            <Card key={p.id} className="border-none bg-card hover:bg-muted/30 transition-all rounded-2xl overflow-hidden shadow-sm">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-foreground">{p.name}</span>
                    <Badge className={cn(
                      "text-[10px] font-black uppercase tracking-tighter rounded-full border-none",
                      p.active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                    )}>{p.active ? 'Active' : 'Disabled'}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mt-1">
                    Last run: {p.lastExecution?.toDate ? new Date(p.lastExecution.toDate()).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-emerald-500/10 text-emerald-600" onClick={() => handleRunNow(p.id)}><Play size={16} /></Button>
                  <Button size="sm" variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-rose-500/10 text-rose-500" onClick={() => handleDelete(p.id)}><Trash2 size={16} /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg rounded-2xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">New Automation Profile</DialogTitle>
            <DialogDescription className="font-bold text-muted-foreground">Define what tasks to run on assigned devices.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4 max-h-[500px] overflow-y-auto px-1 custom-scrollbar">
            <div className="space-y-2 px-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Profile Name</Label>
              <Input className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background transition-all font-bold" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Monthly Maintenance" />
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Windows
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded-md border-border bg-muted/20 text-primary focus:ring-primary/50 transition-all cursor-pointer" checked={form.windowsPatches} onChange={(e) => setForm({ ...form, windowsPatches: e.target.checked })} /> 
                    <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">Patches (PSWU)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded-md border-border bg-muted/20 text-primary focus:ring-primary/50 transition-all cursor-pointer" checked={form.wingetUpdate} onChange={(e) => setForm({ ...form, wingetUpdate: e.target.checked })} />
                    <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">WinGet Upgrade</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded-md border-border bg-muted/20 text-primary focus:ring-primary/50 transition-all cursor-pointer" checked={form.chocoUpdate} onChange={(e) => setForm({ ...form, chocoUpdate: e.target.checked })} />
                    <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">Choco Upgrade</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded-md border-border bg-muted/20 text-primary focus:ring-primary/50 transition-all cursor-pointer" checked={form.defrag} onChange={(e) => setForm({ ...form, defrag: e.target.checked })} />
                    <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">Disk Defrag</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> macOS
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded-md border-border bg-muted/20 text-primary focus:ring-primary/50 transition-all cursor-pointer" checked={form.macRecommended} onChange={(e) => setForm({ ...form, macRecommended: e.target.checked })} />
                    <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">macOS Updates</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded-md border-border bg-muted/20 text-primary focus:ring-primary/50 transition-all cursor-pointer" checked={form.homebrewUpdate} onChange={(e) => setForm({ ...form, homebrewUpdate: e.target.checked })} />
                    <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">Brew Upgrade</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Linux
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded-md border-border bg-muted/20 text-primary focus:ring-primary/50 transition-all cursor-pointer" checked={form.linuxUpgrade} onChange={(e) => setForm({ ...form, linuxUpgrade: e.target.checked })} />
                    <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">Package Upgrade</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Maintenance
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded-md border-border bg-muted/20 text-primary focus:ring-primary/50 transition-all cursor-pointer" checked={form.tempCleanup} onChange={(e) => setForm({ ...form, tempCleanup: e.target.checked })} />
                    <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">Temp Cleanup</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-6">
            <Button variant="outline" className="rounded-xl h-11 px-6 font-bold text-muted-foreground" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="rounded-xl h-11 px-8 font-black bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleAdd}>Create Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
