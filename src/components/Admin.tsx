import * as React from 'react';
import { Settings, User, Shield, Bell, Globe, CreditCard, Key, Database, Mail, Smartphone, Lock, Plus, Download, RefreshCw, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export function Admin() {
  const [activeTab, setActiveTab] = React.useState('general');

  const tabs = [
    { id: 'general', label: 'General Settings', icon: Settings },
    { id: 'security', label: 'Security & 2FA', icon: Shield },
    { id: 'billing', label: 'Billing & Subscription', icon: CreditCard },
    { id: 'users', label: 'User Management', icon: User },
    { id: 'api', label: 'API & Webhooks', icon: Key },
    { id: 'backup', label: 'Backup & Restore', icon: Database },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 bg-slate-50/50 min-h-screen animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-brand-navy tracking-tight">Admin Settings</h1>
          <p className="text-sm text-slate-500 font-medium">Configure your global account settings, security, and billing.</p>
        </div>
        <Button 
          onClick={() => toast.success("Settings saved successfully")}
          className="bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl px-8 h-11 font-bold shadow-lg shadow-brand-navy/10 transition-all hover:scale-[1.02] w-full sm:w-auto"
        >
          Save Changes
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 space-y-2 overflow-x-auto pb-2 lg:pb-0"
        >
          <div className="flex lg:flex-col gap-2 min-w-max lg:min-w-0">
            {tabs.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap",
                  activeTab === item.id ? "bg-brand-blue/10 text-brand-blue shadow-sm" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                )}
              >
                <item.icon size={18} className={activeTab === item.id ? "text-brand-blue" : "text-slate-400"} />
                {item.label}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3 space-y-8"
        >
          {activeTab === 'general' && (
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="border-b border-slate-50 bg-slate-50/30 px-8 py-6">
                <CardTitle className="text-lg font-black text-brand-navy tracking-tight uppercase tracking-widest text-xs">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 lg:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Name</label>
                    <Input defaultValue="HypeRemote Solutions" className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white font-bold text-brand-navy" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Domain</label>
                    <Input defaultValue="hyperemote.com" className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white font-bold text-brand-navy" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Email</label>
                    <Input defaultValue="admin@hyperemote.com" className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white font-bold text-brand-navy" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Zone</label>
                    <Input defaultValue="(GMT-05:00) Eastern Time" className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white font-bold text-brand-navy" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="border-b border-slate-50 bg-slate-50/30 px-8 py-6">
                <CardTitle className="text-lg font-black text-brand-navy tracking-tight uppercase tracking-widest text-xs">Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-brand-green/10 rounded-2xl text-brand-green shadow-lg shadow-brand-green/5">
                      <Smartphone size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-black text-brand-navy tracking-tight">Two-Factor Authentication</h4>
                      <p className="text-xs text-slate-500 font-bold mt-0.5">Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                  <Badge className="bg-brand-green/10 text-brand-green border-none font-black uppercase text-[10px] tracking-widest px-4 py-1.5 rounded-full">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-brand-blue/10 rounded-2xl text-brand-blue shadow-lg shadow-brand-blue/5">
                      <Lock size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-black text-brand-navy tracking-tight">Password Policy</h4>
                      <p className="text-xs text-slate-500 font-bold mt-0.5">Enforce strong passwords for all team members.</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl font-black uppercase text-[10px] tracking-widest border-slate-200 text-slate-500 h-10 px-6 hover:bg-slate-50">Configure</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'billing' && (
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="border-b border-slate-50 bg-slate-50/30 px-8 py-6">
                <CardTitle className="text-lg font-black text-brand-navy tracking-tight uppercase tracking-widest text-xs">Billing & Subscription</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                  <div>
                    <h4 className="font-black text-brand-navy">Current Plan: Enterprise</h4>
                    <p className="text-xs text-slate-500 font-bold mt-1">Next billing date: April 20, 2026</p>
                  </div>
                  <Button className="bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-6">Upgrade Plan</Button>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-brand-navy uppercase tracking-widest">Payment Methods</h4>
                  <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center font-bold text-[10px]">VISA</div>
                      <span className="text-sm font-bold text-slate-600">•••• 4242</span>
                    </div>
                    <Badge variant="outline" className="rounded-full text-[10px] font-black uppercase tracking-widest">Primary</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'users' && (
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="border-b border-slate-50 bg-slate-50/30 px-8 py-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-black text-brand-navy tracking-tight uppercase tracking-widest text-xs">User Management</CardTitle>
                  <Button size="sm" className="bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-9 px-4">Add User</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {[
                    { name: 'John Doe', email: 'john@hyperemote.com', role: 'Admin' },
                    { name: 'Jane Smith', email: 'jane@hyperemote.com', role: 'Technician' },
                    { name: 'Mike Ross', email: 'mike@hyperemote.com', role: 'Viewer' },
                  ].map((user) => (
                    <div key={user.email} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center font-black text-sm">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-brand-navy">{user.name}</h4>
                          <p className="text-xs text-slate-400 font-bold">{user.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="rounded-full text-[10px] font-black uppercase tracking-widest">{user.role}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'api' && (
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="border-b border-slate-50 bg-slate-50/30 px-8 py-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-black text-brand-navy tracking-tight uppercase tracking-widest text-xs">API & Webhooks</CardTitle>
                  <Button size="sm" className="bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-9 px-4">Generate Key</Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-brand-navy">Production API Key</h4>
                      <p className="text-xs font-mono text-slate-400 mt-1 truncate">hp_live_••••••••••••••••••••••••</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-brand-blue" onClick={() => toast.success("API Key copied")}>
                        <Copy size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-500">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Webhooks</h4>
                  <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                    <p className="text-sm text-slate-400 font-bold">No webhooks configured</p>
                    <Button variant="link" className="text-brand-blue font-black uppercase text-[10px] tracking-widest mt-2">Add Webhook Endpoint</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'backup' && (
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="border-b border-slate-50 bg-slate-50/30 px-8 py-6">
                <CardTitle className="text-lg font-black text-brand-navy tracking-tight uppercase tracking-widest text-xs">Backup & Restore</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-blue">
                      <Database size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-brand-navy">Automated Backups</h4>
                      <p className="text-xs text-slate-500 font-bold mt-1">Daily backups are enabled and stored securely.</p>
                    </div>
                    <Button variant="outline" className="w-full rounded-xl font-black uppercase text-[10px] tracking-widest h-10">Configure Schedule</Button>
                  </div>
                  <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-green">
                      <RefreshCw size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-brand-navy">Manual Restore</h4>
                      <p className="text-xs text-slate-500 font-bold mt-1">Restore your system to a previous state.</p>
                    </div>
                    <Button variant="outline" className="w-full rounded-xl font-black uppercase text-[10px] tracking-widest h-10">Restore Now</Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Backups</h4>
                  <div className="divide-y divide-slate-50 border rounded-2xl overflow-hidden">
                    {[
                      { date: '2026-04-12 03:00 AM', size: '1.2 GB', status: 'Success' },
                      { date: '2026-04-11 03:00 AM', size: '1.1 GB', status: 'Success' },
                    ].map((backup) => (
                      <div key={backup.date} className="p-4 flex items-center justify-between bg-white">
                        <div>
                          <p className="text-sm font-bold text-brand-navy">{backup.date}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{backup.size}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-brand-green/10 text-brand-green border-none font-black uppercase text-[10px] tracking-widest px-3 py-1 rounded-full">{backup.status}</Badge>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-brand-blue">
                            <Download size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
