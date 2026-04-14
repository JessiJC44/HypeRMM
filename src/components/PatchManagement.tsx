import * as React from 'react';
import { Shield, AlertCircle, CheckCircle2, Clock, Search, Filter, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export function PatchManagement() {
  return (
    <div className="p-8 space-y-8 bg-[#f8f9fa] min-h-screen animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Patch Management</h1>
          <p className="text-sm text-slate-500">Monitor and automate OS and 3rd party software patching across all devices.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-full px-6 border-slate-200 font-bold">Automation Profiles</Button>
          <Button className="bg-[#003d33] hover:bg-[#002b24] text-white rounded-full px-6 gap-2">
            <Play size={18} />
            Run Patching Now
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-6">
        {[
          { label: 'Critical Patches', value: '14', desc: 'Action required on 8 devices', color: 'rose' },
          { label: 'Security Patches', value: '42', desc: 'Action required on 15 devices', color: 'amber' },
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
              stat.color === 'rose' ? "bg-rose-50 border-rose-100" :
              stat.color === 'amber' ? "bg-amber-50 border-amber-100" :
              stat.color === 'emerald' ? "bg-emerald-50 border-emerald-100" : "bg-blue-50 border-blue-100"
            )}>
              <CardContent className="p-6">
                <p className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  stat.color === 'rose' ? "text-rose-700" :
                  stat.color === 'amber' ? "text-amber-700" :
                  stat.color === 'emerald' ? "text-emerald-700" : "text-blue-700"
                )}>{stat.label}</p>
                <h3 className={cn(
                  "text-3xl font-bold mt-1",
                  stat.color === 'rose' ? "text-rose-900" :
                  stat.color === 'amber' ? "text-amber-900" :
                  stat.color === 'emerald' ? "text-emerald-900" : "text-blue-900"
                )}>{stat.value}</h3>
                <p className={cn(
                  "text-[10px] font-bold mt-2",
                  stat.color === 'rose' ? "text-rose-600" :
                  stat.color === 'amber' ? "text-amber-600" :
                  stat.color === 'emerald' ? "text-emerald-600" : "text-blue-600"
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
          <TabsList className="bg-white border p-1 rounded-xl h-12 shadow-sm">
            <TabsTrigger value="os" className="rounded-lg px-8 font-bold data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">OS Patches</TabsTrigger>
            <TabsTrigger value="software" className="rounded-lg px-8 font-bold data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">3rd Party Software</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg px-8 font-bold data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Patch History</TabsTrigger>
          </TabsList>

          <TabsContent value="os" className="mt-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="p-6 border-b flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <Input className="pl-9 rounded-xl border-slate-200" placeholder="Search patches..." />
                    </div>
                    <Button variant="outline" size="sm" className="rounded-full gap-2 border-slate-200 text-slate-600">
                      <Filter size={14} />
                      Filter
                    </Button>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold">Approve All Critical</Button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Patch ID</th>
                      <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Title</th>
                      <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Severity</th>
                      <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Affected Devices</th>
                      <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[
                      { id: 'KB5031354', title: 'Windows 11 Security Update (22H2)', severity: 'Critical', devices: 12 },
                      { id: 'KB5031455', title: 'Cumulative Update for .NET Framework', severity: 'Moderate', devices: 24 },
                      { id: 'KB5029351', title: 'Security Update for Windows Server 2022', severity: 'Critical', devices: 5 },
                      { id: 'KB5030219', title: 'Windows Malicious Software Removal Tool', severity: 'Low', devices: 86 },
                    ].map((patch, i) => (
                      <motion.tr 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + (i * 0.05) }}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4 px-6 font-mono text-xs font-bold text-blue-600 whitespace-nowrap">{patch.id}</td>
                        <td className="py-4 px-6 font-bold text-slate-700 whitespace-nowrap">{patch.title}</td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <Badge className={cn(
                            "text-[10px] font-bold border-none",
                            patch.severity === 'Critical' ? "bg-rose-50 text-rose-600" : 
                            patch.severity === 'Moderate' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {patch.severity}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">{patch.devices} devices</td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <Button variant="ghost" size="sm" className="text-blue-600 font-bold hover:bg-blue-50">Approve</Button>
                        </td>
                      </motion.tr>
                    ))}
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
