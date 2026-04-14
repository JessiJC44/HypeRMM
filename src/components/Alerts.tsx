import * as React from 'react';
import { Bell, AlertTriangle, Info, CheckCircle2, Search, Filter, MoreVertical, Ticket, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export function Alerts() {
  const [alerts, setAlerts] = React.useState([
    { id: 1, device: 'SRV-PROD-01', type: 'CPU Usage High', severity: 'Critical', date: '10 mins ago', status: 'New' },
    { id: 2, device: 'WS-MARKETING-05', type: 'Disk Space Low', severity: 'Warning', date: '25 mins ago', status: 'New' },
    { id: 3, device: 'SRV-BACKUP-02', type: 'Backup Failed', severity: 'Critical', date: '1 hour ago', status: 'New' },
    { id: 4, device: 'WS-DEV-12', type: 'Antivirus Outdated', severity: 'Information', date: '2 hours ago', status: 'New' },
    { id: 5, device: 'PRINTER-OFFICE', type: 'Offline', severity: 'Warning', date: '3 hours ago', status: 'New' },
  ]);

  const resolveAlert = (id: number) => {
    setAlerts(alerts.filter(a => a.id !== id));
    toast.success("Alert resolved successfully");
  };

  const createTicket = (device: string) => {
    toast.info(`Creating ticket for ${device}...`);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 bg-background min-h-screen animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Alerts</h1>
          <p className="text-sm text-muted-foreground font-medium">Monitor and manage real-time alerts from all your managed devices.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="rounded-xl px-6 h-11 border-border bg-card font-bold text-muted-foreground hover:bg-muted/50 transition-all w-full sm:w-auto">Alert Settings</Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 h-11 font-bold shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] w-full sm:w-auto">
            Resolve All
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: AlertTriangle, color: 'rose', label: 'Critical', value: '2', desc: 'Immediate attention required' },
          { icon: AlertTriangle, color: 'amber', label: 'Warning', value: '2', desc: 'Potential issues detected' },
          { icon: Info, color: 'brand-blue', label: 'Information', value: '1', desc: 'System notifications' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className={cn(
              "border-none shadow-sm rounded-2xl bg-card",
              stat.color === 'rose' ? "bg-rose-500/10 border-rose-500/20" :
              stat.color === 'amber' ? "bg-amber-500/10 border-amber-500/20" : "bg-primary/10 border-primary/20"
            )}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <stat.icon className={cn(
                    stat.color === 'rose' ? "text-rose-500" :
                    stat.color === 'amber' ? "text-amber-500" : "text-primary"
                  )} size={20} />
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-[0.15em]",
                    stat.color === 'rose' ? "text-rose-500" :
                    stat.color === 'amber' ? "text-amber-500" : "text-primary"
                  )}>{stat.label}</p>
                </div>
                <h3 className={cn(
                  "text-4xl font-black mt-1",
                  stat.color === 'rose' ? "text-rose-600" :
                  stat.color === 'amber' ? "text-amber-600" : "text-foreground"
                )}>{stat.value}</h3>
                <p className={cn(
                  "text-[10px] font-bold mt-2 uppercase tracking-wider",
                  stat.color === 'rose' ? "text-rose-500" :
                  stat.color === 'amber' ? "text-amber-500" : "text-primary"
                )}>{stat.desc}</p>
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
        <div className="min-w-[900px]">
          <div className="p-4 lg:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between bg-card gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input className="pl-12 h-12 rounded-xl border-border bg-muted/20 focus:bg-background text-foreground transition-all" placeholder="Search alerts..." />
              </div>
              <Button variant="outline" className="rounded-xl h-12 px-6 gap-2 border-border text-muted-foreground font-bold hover:bg-muted/50 bg-card w-full sm:w-auto">
                <Filter size={18} />
                Filter
              </Button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
            <tr className="bg-muted/30 text-left">
              <th className="py-5 px-8 font-black text-muted-foreground text-[10px] uppercase tracking-[0.15em] whitespace-nowrap">Severity</th>
              <th className="py-5 px-8 font-black text-muted-foreground text-[10px] uppercase tracking-[0.15em] whitespace-nowrap">Device</th>
              <th className="py-5 px-8 font-black text-muted-foreground text-[10px] uppercase tracking-[0.15em] whitespace-nowrap">Alert Type</th>
              <th className="py-5 px-8 font-black text-muted-foreground text-[10px] uppercase tracking-[0.15em] whitespace-nowrap">Time</th>
              <th className="py-5 px-8 font-black text-muted-foreground text-[10px] uppercase tracking-[0.15em] text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {alerts.map((alert, index) => (
              <motion.tr 
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + (index * 0.05) }}
                className="hover:bg-muted/20 transition-colors group"
              >
                <td className="py-5 px-8 whitespace-nowrap">
                  <Badge className={cn(
                    "text-[10px] font-black px-3 py-1 rounded-full border-none uppercase tracking-wider",
                    alert.severity === 'Critical' ? "bg-rose-500/10 text-rose-500" : 
                    alert.severity === 'Warning' ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                  )}>
                    {alert.severity}
                  </Badge>
                </td>
                <td className="py-5 px-8 font-bold text-foreground whitespace-nowrap">{alert.device}</td>
                <td className="py-5 px-8 text-muted-foreground font-bold whitespace-nowrap">{alert.type}</td>
                <td className="py-5 px-8 text-muted-foreground font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">{alert.date}</td>
                <td className="py-5 px-8 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => resolveAlert(alert.id)}
                      className="text-emerald-500 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500/10 rounded-lg h-9 px-4 gap-2"
                    >
                      <Check size={14} strokeWidth={3} />
                      Resolve
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => createTicket(alert.device)}
                      className="text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary/10 rounded-lg h-9 px-4 gap-2"
                    >
                      <Ticket size={14} strokeWidth={3} />
                      Ticket
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
