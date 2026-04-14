import * as React from 'react';
import { Printer, Wifi, Server, Activity, Settings, Plus, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export function SNMP() {
  return (
    <div className="p-8 space-y-8 bg-background min-h-screen animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">SNMP Management</h1>
          <p className="text-sm text-muted-foreground">Monitor and manage printers, switches, and other SNMP-enabled devices.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 gap-2">
          <Plus size={18} />
          Add SNMP Device
        </Button>
      </motion.div>

      <div className="grid grid-cols-4 gap-6">
        {[
          { label: 'Printers', count: 12, icon: Printer, color: 'blue' },
          { label: 'Switches', count: 8, icon: Server, color: 'purple' },
          { label: 'Access Points', count: 24, icon: Wifi, color: 'emerald' },
          { label: 'Alerts', count: 2, icon: AlertCircle, color: 'rose' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="border-none shadow-sm h-full bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "p-2 rounded-lg",
                    stat.color === 'blue' ? "bg-blue-500/10 text-blue-500" :
                    stat.color === 'purple' ? "bg-purple-500/10 text-purple-500" :
                    stat.color === 'emerald' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                  )}>
                    <stat.icon size={20} />
                  </div>
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{stat.count}</h3>
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
            <h3 className="font-bold text-foreground">SNMP Devices</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input className="pl-9 rounded-xl border-border bg-muted/20 text-foreground" placeholder="Search devices..." />
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 text-left">
                <th className="py-4 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">Device Name</th>
                <th className="py-4 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">IP Address</th>
                <th className="py-4 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="py-4 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">Type</th>
                <th className="py-4 px-6 font-bold text-muted-foreground text-xs uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { name: 'HP-LASERJET-500', ip: '192.168.1.12', status: 'Online', type: 'Printer' },
                { name: 'CORE-SWITCH-01', ip: '192.168.1.1', status: 'Online', type: 'Switch' },
                { name: 'WIFI-AP-LOBBY', ip: '192.168.1.25', status: 'Offline', type: 'Access Point' },
                { name: 'EPSON-WF-2830', ip: '192.168.1.15', status: 'Online', type: 'Printer' },
              ].map((device, i) => (
                <motion.tr 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.05) }}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="py-4 px-6 font-bold text-foreground whitespace-nowrap">{device.name}</td>
                  <td className="py-4 px-6 text-muted-foreground font-medium whitespace-nowrap">{device.ip}</td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <Badge className={cn(
                      "text-[10px] font-bold border-none",
                      device.status === 'Online' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                    )}>
                      {device.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-muted-foreground font-medium whitespace-nowrap">{device.type}</td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                      <Settings size={16} />
                    </Button>
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
