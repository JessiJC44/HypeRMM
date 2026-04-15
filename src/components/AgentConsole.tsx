import * as React from 'react';
import { 
  Monitor, 
  Cpu, 
  HardDrive, 
  Activity, 
  Shield, 
  Clock, 
  Info, 
  ChevronLeft,
  Power,
  RefreshCw,
  Terminal,
  FolderOpen,
  Settings,
  Search,
  ExternalLink,
  Zap,
  Package,
  Database,
  Network,
  Lock,
  History,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { Device } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

import { auth } from '../lib/firebase';

const AppleIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.1 2.48-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.24-1.99 1.1-3.15-1.04.04-2.3.69-3.05 1.56-.67.77-1.26 1.97-1.1 3.1 1.16.09 2.32-.68 3.05-1.51z"/>
  </svg>
);

interface AgentConsoleProps {
  device: Device;
  onBack: () => void;
}

const performanceData = [
  { time: '10:00', cpu: 12, ram: 45 },
  { time: '10:05', cpu: 18, ram: 48 },
  { time: '10:10', cpu: 45, ram: 52 },
  { time: '10:15', cpu: 32, ram: 50 },
  { time: '10:20', cpu: 25, ram: 49 },
  { time: '10:25', cpu: 15, ram: 47 },
  { time: '10:30', cpu: 20, ram: 48 },
];

export function AgentConsole({ device, onBack }: AgentConsoleProps) {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [isToolOpen, setIsToolOpen] = React.useState<string | null>(null);
  const [isConnecting, setIsConnecting] = React.useState(false);

  const handleConnect = () => {
    const fluxId = device.flux_id || device.fluxId;
    if (!fluxId) {
      toast.error('Remote access not available. Flux is not installed on this device.');
      return;
    }
    setIsConnecting(true);
    window.open(`rustdesk://connect/${fluxId}`, '_blank');
    toast.info(`Opening remote connection to ${device.name}...`);
    setTimeout(() => {
      setIsConnecting(false);
    }, 2000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Monitor },
    { id: 'software', label: 'Software', icon: Package },
    { id: 'hardware', label: 'Hardware', icon: Database },
    { id: 'patches', label: 'Patches', icon: Shield },
    { id: 'scripts', label: 'Scripts', icon: Terminal },
    { id: 'events', label: 'Events', icon: History },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa] animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-slate-100">
            <ChevronLeft size={20} className="text-slate-600" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              {device.os.toLowerCase().includes('windows') ? <Monitor size={20} /> : 
               device.os.toLowerCase().includes('linux') ? <Server size={20} /> : 
               <AppleIcon size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">{device.name}</h2>
                <Badge variant={device.status === 'online' ? 'default' : 'secondary'} className={cn(
                  "text-[10px] uppercase tracking-wider font-bold h-5",
                  device.status === 'online' ? "bg-green-500 hover:bg-green-600" : "bg-slate-400"
                )}>
                  {device.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium">{device.os} • {device.ipAddress}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-full h-9 gap-2 border-slate-200 font-bold text-slate-700">
            <Power size={16} className="text-rose-500" />
            Shutdown
          </Button>
          <Button variant="outline" size="sm" className="rounded-full h-9 gap-2 border-slate-200 font-bold text-slate-700">
            <RefreshCw size={16} className="text-blue-500" />
            Restart
          </Button>
          <Button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-9 px-6 font-bold gap-2 shadow-lg shadow-blue-100"
          >
            {isConnecting ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 bg-white border-r flex flex-col p-4 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200",
                activeTab === tab.id 
                  ? "bg-blue-50 text-blue-700 shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              <tab.icon size={18} className={activeTab === tab.id ? "text-blue-600" : "text-slate-400"} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTabIndicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </button>
          ))}
          
          <div className="mt-auto pt-4 border-t space-y-1">
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tools</p>
            <button 
              onClick={() => setIsToolOpen('terminal')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Terminal size={18} className="text-slate-400" />
              Command Prompt
            </button>
            <button 
              onClick={() => setIsToolOpen('files')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <FolderOpen size={18} className="text-slate-400" />
              File Explorer
            </button>
            <button 
              onClick={() => setIsToolOpen('tasks')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Activity size={18} className="text-slate-400" />
              Task Manager
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          <AnimatePresence>
            {isToolOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-40 p-8 bg-[#f8f9fa]"
              >
                <div className="bg-slate-900 rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden border border-slate-800">
                  <div className="bg-slate-800 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isToolOpen === 'terminal' && <Terminal size={16} className="text-slate-400" />}
                      {isToolOpen === 'files' && <FolderOpen size={16} className="text-slate-400" />}
                      {isToolOpen === 'tasks' && <Activity size={16} className="text-slate-400" />}
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        {isToolOpen === 'terminal' ? 'Remote Command Prompt' : 
                         isToolOpen === 'files' ? 'Remote File Explorer' : 'Remote Task Manager'}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsToolOpen(null)} className="text-slate-400 hover:text-white hover:bg-slate-700 h-7 w-7 p-0 rounded-full">
                      <XCircle size={18} />
                    </Button>
                  </div>
                  <div className="flex-1 p-6 font-mono text-sm overflow-y-auto custom-scrollbar">
                    {isToolOpen === 'terminal' && (
                      <div className="text-emerald-500 space-y-2">
                        <p>Microsoft Windows [Version 10.0.22621.2428]</p>
                        <p>(c) Microsoft Corporation. All rights reserved.</p>
                        <p className="mt-4">C:\Users\Admin&gt; <span className="animate-pulse">_</span></p>
                      </div>
                    )}
                    {isToolOpen === 'files' && (
                      <div className="grid grid-cols-4 gap-4">
                        {['Documents', 'Downloads', 'Pictures', 'Music', 'Desktop', 'AppData', 'Program Files', 'Windows'].map(f => (
                          <div key={f} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group">
                            <FolderOpen size={32} className="text-blue-400 group-hover:scale-110 transition-transform" />
                            <span className="text-xs text-slate-300 font-medium">{f}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {isToolOpen === 'tasks' && (
                      <table className="w-full text-xs text-slate-300">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-800">
                            <th className="text-left py-2">Process Name</th>
                            <th className="text-right py-2">CPU</th>
                            <th className="text-right py-2">Memory</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { name: 'chrome.exe', cpu: '4.2%', mem: '452 MB' },
                            { name: 'Code.exe', cpu: '1.5%', mem: '890 MB' },
                            { name: 'Slack.exe', cpu: '0.2%', mem: '320 MB' },
                            { name: 'svchost.exe', cpu: '0.1%', mem: '12 MB' },
                            { name: 'explorer.exe', cpu: '0.5%', mem: '85 MB' },
                          ].map(p => (
                            <tr key={p.name} className="border-b border-slate-800/50 hover:bg-slate-800/50">
                              <td className="py-2 font-bold">{p.name}</td>
                              <td className="py-2 text-right text-emerald-500">{p.cpu}</td>
                              <td className="py-2 text-right">{p.mem}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-6">
                  <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                          <Cpu size={20} />
                        </div>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none text-[10px]">Normal</Badge>
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">CPU Usage</p>
                      <h3 className="text-2xl font-bold text-slate-800 mt-1">24%</h3>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: '24%' }} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                          <Activity size={20} />
                        </div>
                        <Badge variant="secondary" className="bg-purple-50 text-purple-600 border-none text-[10px]">Stable</Badge>
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Memory</p>
                      <h3 className="text-2xl font-bold text-slate-800 mt-1">8.4 GB</h3>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: '52%' }} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                          <HardDrive size={20} />
                        </div>
                        <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-none text-[10px]">Healthy</Badge>
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Disk Free</p>
                      <h3 className="text-2xl font-bold text-slate-800 mt-1">142 GB</h3>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '68%' }} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                          <Clock size={20} />
                        </div>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none text-[10px]">Active</Badge>
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Uptime</p>
                      <h3 className="text-2xl font-bold text-slate-800 mt-1">12d 4h</h3>
                      <p className="text-[10px] text-slate-400 mt-4 font-medium">Last boot: Oct 12, 2023</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Performance Chart */}
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                  <CardHeader className="border-b bg-slate-50/30 px-8 py-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-800">Performance Monitor</CardTitle>
                        <p className="text-xs text-slate-500 font-medium mt-1">Real-time resource utilization</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span className="text-xs font-bold text-slate-600">CPU</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500" />
                          <span className="text-xs font-bold text-slate-600">RAM</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData}>
                        <defs>
                          <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="time" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="cpu" 
                          stroke="#3b82f6" 
                          fillOpacity={1} 
                          fill="url(#colorCpu)" 
                          strokeWidth={3}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="ram" 
                          stroke="#a855f7" 
                          fillOpacity={1} 
                          fill="url(#colorRam)" 
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* System Info & Hardware */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Info size={20} className="text-blue-500" />
                      System Information
                    </h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
                      <div className="min-w-[500px]">
                        <table className="w-full text-sm">
                          <tbody className="divide-y divide-slate-50">
                            {[
                              { label: 'OS Version', value: device.os + ' Pro 22H2' },
                              { label: 'Host Name', value: device.name },
                              { label: 'IP Address', value: device.ipAddress },
                              { label: 'MAC Address', value: '00:1A:2B:3C:4D:5E' },
                              { label: 'Last Seen', value: new Date(device.lastSeen).toLocaleString() },
                              { label: 'Agent Version', value: '1.4.2.0' },
                            ].map((row) => (
                              <tr key={row.label} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider w-1/3 whitespace-nowrap">{row.label}</td>
                                <td className="py-4 px-6 font-bold text-slate-700 whitespace-nowrap">{row.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <History size={20} className="text-emerald-500" />
                      Recent Activity
                    </h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                      <div className="divide-y divide-slate-50">
                        {[
                          { action: 'Remote Connection', user: 'Admin', time: '2 hours ago', status: 'Success' },
                          { action: 'Patch Installation', user: 'System', time: '5 hours ago', status: 'Success' },
                          { action: 'Software Update', user: 'Admin', time: 'Yesterday', status: 'Success' },
                          { action: 'Script Execution', user: 'System', time: '2 days ago', status: 'Failed' },
                          { action: 'Agent Restart', user: 'System', time: '3 days ago', status: 'Success' },
                        ].map((activity, i) => (
                          <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                activity.status === 'Success' ? "bg-emerald-500" : "bg-rose-500"
                              )} />
                              <div>
                                <p className="text-sm font-bold text-slate-700">{activity.action}</p>
                                <p className="text-[10px] text-slate-400 font-medium">By {activity.user} • {activity.time}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className={cn(
                              "text-[10px] font-bold border-none",
                              activity.status === 'Success' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                            )}>
                              {activity.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'software' && (
              <motion.div 
                key="software"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800">Installed Software</h3>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Search software..." />
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
                  <div className="min-w-[800px]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="text-left py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Name</th>
                          <th className="text-left py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Publisher</th>
                          <th className="text-left py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Version</th>
                          <th className="text-left py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Install Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {[
                          { name: 'Google Chrome', publisher: 'Google LLC', version: '118.0.5993.70', date: '2023-10-10' },
                          { name: 'Microsoft Office 365', publisher: 'Microsoft Corporation', version: '16.0.16827.20130', date: '2023-09-15' },
                          { name: 'Slack', publisher: 'Slack Technologies', version: '4.34.121', date: '2023-10-01' },
                          { name: 'Visual Studio Code', publisher: 'Microsoft Corporation', version: '1.83.1', date: '2023-10-12' },
                          { name: 'Zoom', publisher: 'Zoom Video Communications', version: '5.16.2', date: '2023-09-28' },
                        ].map((sw) => (
                          <tr key={sw.name} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6 font-bold text-slate-700 whitespace-nowrap">{sw.name}</td>
                            <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">{sw.publisher}</td>
                            <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">{sw.version}</td>
                            <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">{sw.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'scripts' && (
              <motion.div 
                key="scripts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Automation Scripts</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">Run scripts and automation profiles on this device</p>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold gap-2">
                    <Plus size={16} />
                    Run Script
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { name: 'Clear Temp Files', category: 'Maintenance', lastRun: '2 days ago', status: 'Success' },
                    { name: 'Update Windows Defender', category: 'Security', lastRun: '5 hours ago', status: 'Success' },
                    { name: 'Restart Spooler Service', category: 'Troubleshooting', lastRun: 'Never', status: 'Pending' },
                    { name: 'Inventory Scan', category: 'Audit', lastRun: 'Yesterday', status: 'Success' },
                  ].map((script) => (
                    <div key={script.name} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <Terminal size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{script.name}</h4>
                          <p className="text-xs text-slate-500 font-medium">{script.category} • Last run: {script.lastRun}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className={cn(
                          "text-[10px] font-bold border-none",
                          script.status === 'Success' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {script.status}
                        </Badge>
                        <Button variant="outline" size="sm" className="rounded-full font-bold h-8 border-slate-200">Run Now</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'patches' && (
              <motion.div 
                key="patches"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Patch Management</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">Available updates and security patches</p>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold">Install All Patches</Button>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-rose-500 rounded-xl text-white">
                      <Shield size={24} />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-rose-900">2</h4>
                      <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Critical Patches</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-amber-500 rounded-xl text-white">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-amber-900">5</h4>
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Security Patches</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-blue-500 rounded-xl text-white">
                      <Package size={24} />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-blue-900">12</h4>
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Optional Updates</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
                  <div className="min-w-[800px]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="text-left py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Patch Name</th>
                          <th className="text-left py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Category</th>
                          <th className="text-left py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Severity</th>
                          <th className="text-right py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {[
                          { name: 'KB5031354: Windows 11 Security Update', cat: 'Security', sev: 'Critical' },
                          { name: 'KB5031455: Cumulative Update for .NET Framework', cat: 'Update', sev: 'Moderate' },
                          { name: 'Intel - SoftwareComponent - 1.63.1155.1', cat: 'Driver', sev: 'Low' },
                          { name: 'Microsoft Defender Antivirus - KB2267602', cat: 'Security', sev: 'Critical' },
                        ].map((patch) => (
                          <tr key={patch.name} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6 font-bold text-slate-700 whitespace-nowrap">{patch.name}</td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none text-[10px] font-bold">{patch.cat}</Badge>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <Badge className={cn(
                                "text-[10px] font-bold border-none",
                                patch.sev === 'Critical' ? "bg-rose-50 text-rose-600" : 
                                patch.sev === 'Moderate' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                              )}>
                                {patch.sev}
                              </Badge>
                            </td>
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <Button variant="ghost" size="sm" className="text-blue-600 font-bold hover:bg-blue-50">Install</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
