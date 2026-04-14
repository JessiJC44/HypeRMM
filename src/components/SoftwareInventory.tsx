import * as React from 'react';
import { Package, Search, Filter, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export function SoftwareInventory() {
  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 bg-background min-h-screen animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Software Inventory</h1>
          <p className="text-sm text-muted-foreground font-medium">View and manage all software installed across your managed devices.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 h-12 font-bold shadow-lg shadow-primary/10 w-full sm:w-auto gap-2">
          <Download size={18} />
          Export Inventory
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Applications', value: '1,248', desc: 'Across 156 devices', color: 'brand-blue' },
          { label: 'Security Risks', value: '12', desc: 'Vulnerable versions found', color: 'rose', icon: ShieldCheck },
          { label: 'License Compliance', value: '98%', desc: 'Optimal', color: 'brand-green' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="border-none shadow-sm h-full bg-card overflow-hidden rounded-2xl">
              <div className={cn(
                "h-1.5 w-full",
                stat.color === 'brand-blue' ? "bg-brand-blue" :
                stat.color === 'brand-green' ? "bg-brand-green" :
                "bg-rose-500"
              )} />
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">{stat.label}</p>
                <h3 className="text-3xl font-black mt-1 text-foreground">{stat.value}</h3>
                <p className={cn(
                  "text-[10px] font-bold mt-2 flex items-center gap-1",
                  stat.color === 'rose' ? 'text-rose-500' : 
                  stat.color === 'brand-green' ? 'text-brand-green' : 'text-brand-blue'
                )}>
                  {stat.icon && <stat.icon size={12} />}
                  {stat.desc}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-2xl shadow-sm border border-border overflow-x-auto"
      >
        <div className="min-w-[1000px]">
          <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input className="pl-9 rounded-xl border-border bg-muted/20" placeholder="Search software..." />
              </div>
              <Button variant="outline" size="sm" className="rounded-xl gap-2 border-border text-muted-foreground hover:bg-muted/40 w-full sm:w-auto h-10 px-4 font-bold uppercase text-[10px] tracking-widest">
                <Filter size={14} />
                Filter
              </Button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 text-left">
                <th className="py-4 px-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest whitespace-nowrap">Software Name</th>
                <th className="py-4 px-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest whitespace-nowrap">Publisher</th>
                <th className="py-4 px-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest whitespace-nowrap">Version</th>
                <th className="py-4 px-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest whitespace-nowrap">Installations</th>
                <th className="py-4 px-6 font-black text-muted-foreground text-[10px] uppercase tracking-widest text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { name: 'Google Chrome', publisher: 'Google LLC', version: '118.0.5993.70', count: 142 },
                { name: 'Microsoft Office 365', publisher: 'Microsoft Corporation', version: '16.0.16827.20130', count: 128 },
                { name: 'Slack', publisher: 'Slack Technologies', version: '4.34.121', count: 86 },
                { name: 'Visual Studio Code', publisher: 'Microsoft Corporation', version: '1.83.1', count: 45 },
                { name: 'Zoom', publisher: 'Zoom Video Communications', version: '5.16.2', count: 92 },
                { name: 'Adobe Acrobat Reader', publisher: 'Adobe Inc.', version: '23.006.20360', count: 110 },
              ].map((sw, i) => (
                <motion.tr 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.05) }}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="py-4 px-6 font-black text-foreground whitespace-nowrap">{sw.name}</td>
                  <td className="py-4 px-6 text-muted-foreground font-bold whitespace-nowrap">{sw.publisher}</td>
                  <td className="py-4 px-6 text-muted-foreground font-bold whitespace-nowrap">{sw.version}</td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <Badge variant="secondary" className="bg-brand-blue/10 text-brand-blue border-none text-[10px] font-black uppercase tracking-widest whitespace-nowrap px-3 py-1 rounded-full">{sw.count} devices</Badge>
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" className="text-brand-blue font-black uppercase text-[10px] tracking-widest hover:bg-brand-blue/5 gap-2 whitespace-nowrap h-9 px-4 rounded-xl">
                      <ExternalLink size={14} />
                      View Devices
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
