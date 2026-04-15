import * as React from 'react';
import { Shield, AlertCircle, CheckCircle2, Clock, Search, Filter, Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { toast } from 'sonner';

import { firestoreService } from '../services/firestoreService';

import { auth } from '../lib/firebase';

export function PatchManagement() {
  const [patches, setPatches] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = firestoreService.subscribeToPatches(user.uid, (data) => {
      setPatches(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRunPatching = async () => {
    setIsSubmitting(true);
    toast.info("Initiating patch deployment across all devices...");
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Patch deployment started successfully");
    }, 2000);
  };

  const criticalCount = patches.filter(p => p.severity === 'critical').length;
  const securityCount = patches.filter(p => p.severity === 'security' || p.severity === 'moderate').length;

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patch Management</h1>
          <p className="text-sm text-muted-foreground">Monitor and automate OS and 3rd party software patching across all devices.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-full px-6 border-border font-bold bg-card text-muted-foreground hover:bg-muted/50">Automation Profiles</Button>
          <Button 
            onClick={handleRunPatching}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 gap-2"
          >
            {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} />}
            {isSubmitting ? 'Running...' : 'Run Patching Now'}
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6">
        {[
          { label: 'Critical Patches', value: criticalCount.toString(), desc: 'Immediate attention required', color: 'rose' },
          { label: 'Security Patches', value: securityCount.toString(), desc: 'Action required on devices', color: 'amber' },
          { label: 'Fully Patched', value: '112', desc: '72% of total fleet', color: 'emerald' },
          { label: 'Pending Reboot', value: '5', desc: 'Scheduled for tonight', color: 'blue' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className={cn(
              "border-none shadow-sm h-full",
              stat.color === 'rose' ? "bg-rose-500/10 border-rose-500/20" :
              stat.color === 'amber' ? "bg-amber-500/10 border-amber-500/20" :
              stat.color === 'emerald' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-blue-500/10 border-blue-500/20"
            )}>
              <CardContent className="p-6">
                <p className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  stat.color === 'rose' ? "text-rose-500" :
                  stat.color === 'amber' ? "text-amber-500" :
                  stat.color === 'emerald' ? "text-emerald-500" : "text-blue-500"
                )}>{stat.label}</p>
                <h3 className={cn(
                  "text-3xl font-bold mt-1",
                  stat.color === 'rose' ? "text-rose-600" :
                  stat.color === 'amber' ? "text-amber-600" :
                  stat.color === 'emerald' ? "text-emerald-600" : "text-blue-600"
                )}>{stat.value}</h3>
                <p className={cn(
                  "text-[10px] font-bold mt-2",
                  stat.color === 'rose' ? "text-rose-500/80" :
                  stat.color === 'amber' ? "text-amber-500/80" :
                  stat.color === 'emerald' ? "text-emerald-500/80" : "text-blue-500/80"
                )}>{stat.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Tabs defaultValue="os" className="w-full">
          <TabsList className="bg-card border border-border p-1 rounded-xl h-12 shadow-sm">
            <TabsTrigger value="os" className="rounded-lg px-8 font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary">OS Patches</TabsTrigger>
            <TabsTrigger value="software" className="rounded-lg px-8 font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary">3rd Party Software</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg px-8 font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Patch History</TabsTrigger>
          </TabsList>

          <TabsContent value="os" className="mt-6">
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input className="pl-9 rounded-xl border-border bg-muted/20 text-foreground" placeholder="Search patches..." />
                    </div>
                    <Button variant="outline" size="sm" className="rounded-full gap-2 border-border text-muted-foreground hover:bg-muted/50 bg-card">
                      <Filter size={14} />
                      Filter
                    </Button>
                  </div>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold">Approve All Critical</Button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 text-left">
                      <th className="py-4 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">Patch ID</th>
                      <th className="py-4 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">Title</th>
                      <th className="py-4 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">Severity</th>
                      <th className="py-4 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">Affected Devices</th>
                      <th className="py-4 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </td>
                      </tr>
                    ) : patches.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground font-bold uppercase tracking-widest">
                          No patches found.
                        </td>
                      </tr>
                    ) : (
                      patches.map((patch, i) => (
                        <motion.tr 
                          key={patch.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + (i * 0.05) }}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="py-4 px-6 font-mono text-xs font-bold text-primary whitespace-nowrap">{patch.kbId || patch.id}</td>
                          <td className="py-4 px-6 font-bold text-foreground whitespace-nowrap">{patch.title}</td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <Badge className={cn(
                              "text-[10px] font-bold border-none",
                              patch.severity === 'critical' ? "bg-rose-500/10 text-rose-500" : 
                              patch.severity === 'moderate' || patch.severity === 'security' ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                            )}>
                              {patch.severity}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-muted-foreground font-medium whitespace-nowrap">{patch.deviceCount || 0} devices</td>
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/10">Approve</Button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
