import * as React from 'react';
import { Search, Network, Shield, AlertCircle, CheckCircle2, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export function NetworkDiscovery() {
  const [isScanning, setIsScanning] = React.useState(false);

  const startScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 3000);
  };

  return (
    <div className="p-8 space-y-8 bg-[#f8f9fa] min-h-screen animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Network Discovery</h1>
          <p className="text-sm text-slate-500">Scan your network to find and manage unmanaged devices.</p>
        </div>
        <Button 
          onClick={startScan} 
          disabled={isScanning}
          className="bg-[#003d33] hover:bg-[#002b24] text-white rounded-full px-6 gap-2"
        >
          {isScanning ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
          {isScanning ? 'Scanning Network...' : 'Start New Scan'}
        </Button>
      </motion.div>

      <div className="grid grid-cols-3 gap-6">
        {[
          { icon: CheckCircle2, label: 'Discovered Devices', value: '24', desc: '12 ready for agent install', color: 'emerald' },
          { icon: Shield, label: 'Managed Devices', value: '156', desc: '86% coverage', color: 'blue' },
          { icon: AlertCircle, label: 'Security Risks', value: '3', desc: 'Unrecognized devices found', color: 'rose' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="border-none shadow-sm h-full">
              <CardContent className="p-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</h3>
                <p className={cn(
                  "text-[10px] font-bold mt-2 flex items-center gap-1",
                  stat.color === 'emerald' ? "text-emerald-600" :
                  stat.color === 'blue' ? "text-blue-600" : "text-rose-600"
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
        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto"
      >
        <div className="min-w-[800px]">
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Discovered Devices List</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input className="pl-9 rounded-xl border-slate-200" placeholder="Filter devices..." />
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Device Name</th>
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">IP Address</th>
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Type</th>
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Manufacturer</th>
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { name: 'DESKTOP-H82K9L', ip: '192.168.1.45', type: 'Workstation', mfg: 'Dell Inc.' },
                { name: 'PRINTER-OFFICE', ip: '192.168.1.12', type: 'Printer', mfg: 'HP' },
                { name: 'MACBOOK-PRO-M2', ip: '192.168.1.88', type: 'Laptop', mfg: 'Apple' },
                { name: 'UNKNOWN-DEVICE', ip: '192.168.1.201', type: 'Unknown', mfg: 'Unknown' },
                { name: 'NAS-STORAGE', ip: '192.168.1.10', type: 'Storage', mfg: 'Synology' },
              ].map((device, i) => (
                <motion.tr 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.05) }}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-4 px-6 font-bold text-slate-700 whitespace-nowrap">{device.name}</td>
                  <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">{device.ip}</td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none text-[10px] font-bold">{device.type}</Badge>
                  </td>
                  <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">{device.mfg}</td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" className="text-blue-600 font-bold hover:bg-blue-50 gap-2">
                      <Plus size={14} />
                      Install Agent
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
