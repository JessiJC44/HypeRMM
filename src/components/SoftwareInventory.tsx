import * as React from 'react';
import { Package, Search, Filter, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'motion/react';

export function SoftwareInventory() {
  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 bg-[#f8f9fa] min-h-screen animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Software Inventory</h1>
          <p className="text-sm text-slate-500">View and manage all software installed across your managed devices.</p>
        </div>
        <Button className="bg-[#003d33] hover:bg-[#002b24] text-white rounded-full px-6 gap-2 w-full sm:w-auto">
          <Download size={18} />
          Export Inventory
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Applications', value: '1,248', desc: 'Across 156 devices', color: 'slate' },
          { label: 'Security Risks', value: '12', desc: 'Vulnerable versions found', color: 'rose', icon: ShieldCheck },
          { label: 'License Compliance', value: '98%', desc: 'Optimal', color: 'emerald' },
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
                <h3 className={`text-3xl font-bold mt-1 ${
                  stat.color === 'rose' ? 'text-rose-600' : 
                  stat.color === 'emerald' ? 'text-emerald-600' : 'text-slate-800'
                }`}>{stat.value}</h3>
                <p className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${
                  stat.color === 'rose' ? 'text-rose-500' : 
                  stat.color === 'emerald' ? 'text-emerald-600' : 'text-slate-500'
                }`}>
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
        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto"
      >
        <div className="min-w-[1000px]">
          <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input className="pl-9 rounded-xl border-slate-200" placeholder="Search software..." />
              </div>
              <Button variant="outline" size="sm" className="rounded-full gap-2 border-slate-200 text-slate-600 w-full sm:w-auto">
                <Filter size={14} />
                Filter
              </Button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Software Name</th>
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Publisher</th>
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Version</th>
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Installations</th>
                <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
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
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-4 px-6 font-bold text-slate-700 whitespace-nowrap">{sw.name}</td>
                  <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">{sw.publisher}</td>
                  <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">{sw.version}</td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none text-[10px] font-bold whitespace-nowrap">{sw.count} devices</Badge>
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" className="text-blue-600 font-bold hover:bg-blue-50 gap-2 whitespace-nowrap">
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
