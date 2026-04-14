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

import { firestoreService } from '../services/firestoreService';

export function Admin() {
  const [activeTab, setActiveTab] = React.useState('general');
  const [users, setUsers] = React.useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(true);

  React.useEffect(() => {
    if (activeTab === 'users') {
      const unsubscribe = firestoreService.subscribeToUsers((data) => {
        setUsers(data);
        setLoadingUsers(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'general', label: 'General Settings', icon: Settings },
    { id: 'security', label: 'Security & 2FA', icon: Shield },
    { id: 'billing', label: 'Billing & Subscription', icon: CreditCard },
    { id: 'users', label: 'User Management', icon: User },
    { id: 'api', label: 'API & Webhooks', icon: Key },
    { id: 'backup', label: 'Backup & Restore', icon: Database },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 bg-background min-h-screen animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Admin Settings</h1>
          <p className="text-sm text-muted-foreground font-medium">Configure your global account settings, security, and billing.</p>
        </div>
        <Button 
          onClick={() => toast.success("Settings saved successfully")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 h-11 font-bold shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] w-full sm:w-auto"
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
                  activeTab === item.id ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon size={18} className={activeTab === item.id ? "text-primary" : "text-muted-foreground"} />
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
                <CardHeader className="border-b border-border bg-muted/30 px-8 py-6">
                  <CardTitle className="text-lg font-black text-foreground tracking-tight uppercase tracking-widest text-xs">Account Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6 lg:p-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Company Name</label>
                      <Input defaultValue="HypeRemote Solutions" className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background font-bold text-foreground" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Primary Domain</label>
                      <Input defaultValue="hyperemote.com" className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background font-bold text-foreground" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Admin Email</label>
                      <Input defaultValue="admin@hyperemote.com" className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background font-bold text-foreground" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Time Zone</label>
                      <Input defaultValue="(GMT-05:00) Eastern Time" className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background font-bold text-foreground" />
                    </div>
                  </div>
                </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="border-b border-border bg-muted/30 px-8 py-6">
                  <CardTitle className="text-lg font-black text-foreground tracking-tight uppercase tracking-widest text-xs">Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="p-4 bg-primary/10 rounded-2xl text-primary shadow-lg shadow-primary/5">
                        <Smartphone size={24} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h4 className="font-black text-foreground tracking-tight">Two-Factor Authentication</h4>
                        <p className="text-xs text-muted-foreground font-bold mt-0.5">Add an extra layer of security to your account.</p>
                      </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-none font-black uppercase text-[10px] tracking-widest px-4 py-1.5 rounded-full">Enabled</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="p-4 bg-primary/10 rounded-2xl text-primary shadow-lg shadow-primary/5">
                        <Lock size={24} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h4 className="font-black text-foreground tracking-tight">Password Policy</h4>
                        <p className="text-xs text-muted-foreground font-bold mt-0.5">Enforce strong passwords for all team members.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl font-black uppercase text-[10px] tracking-widest border-border text-muted-foreground h-10 px-6 hover:bg-muted/50">Configure</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 bg-card">
                <CardHeader className="border-b border-border bg-muted/30 px-8 py-6">
                  <CardTitle className="text-lg font-black text-foreground tracking-tight uppercase tracking-widest text-xs">MFA Methods</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'email', label: 'Email Verification', icon: Mail, status: 'Active', desc: 'Code sent to your primary email' },
                      { id: 'sms', label: 'SMS Verification', icon: Smartphone, status: 'Not Linked', desc: 'Code sent to your mobile phone' },
                      { id: 'google', label: 'Google Authenticator', icon: Shield, status: 'Not Linked', desc: 'Time-based OTP from Google App' },
                      { id: 'microsoft', label: 'Microsoft Authenticator', icon: Shield, status: 'Not Linked', desc: 'Push notification or code' },
                    ].map((method) => (
                      <div key={method.id} className="p-5 rounded-2xl border border-border bg-card hover:border-brand-blue/30 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn(
                            "p-3 rounded-xl",
                            method.status === 'Active' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            <method.icon size={20} />
                          </div>
                          <Badge variant="outline" className={cn(
                            "rounded-full text-[9px] font-black uppercase tracking-widest px-2",
                            method.status === 'Active' ? "border-primary text-primary" : "border-border text-muted-foreground"
                          )}>
                            {method.status}
                          </Badge>
                        </div>
                        <h5 className="text-sm font-black text-foreground">{method.label}</h5>
                        <p className="text-[10px] text-muted-foreground font-bold mt-1 mb-4">{method.desc}</p>
                        <Button 
                          variant={method.status === 'Active' ? "ghost" : "outline"}
                          className={cn(
                            "w-full h-9 rounded-xl font-black uppercase text-[9px] tracking-widest",
                            method.status === 'Active' ? "text-rose-500 hover:bg-rose-500/10" : "border-primary text-primary hover:bg-primary/5"
                          )}
                          onClick={() => toast.info(`Linking ${method.label}...`)}
                        >
                          {method.status === 'Active' ? 'Disable' : 'Link Method'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'billing' && (
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 bg-card">
              <CardHeader className="border-b border-border bg-muted/30 px-8 py-6">
                <CardTitle className="text-lg font-black text-foreground tracking-tight uppercase tracking-widest text-xs">Billing & Subscription</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center justify-between p-6 bg-muted/20 rounded-2xl border border-border">
                  <div>
                    <h4 className="font-black text-foreground">Current Plan: Enterprise</h4>
                    <p className="text-xs text-muted-foreground font-bold mt-1">Next billing date: April 20, 2026</p>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-6">Upgrade Plan</Button>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-foreground uppercase tracking-widest">Payment Methods</h4>
                  <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-muted rounded flex items-center justify-center font-bold text-[10px] text-foreground">VISA</div>
                      <span className="text-sm font-bold text-muted-foreground">•••• 4242</span>
                    </div>
                    <Badge variant="outline" className="rounded-full text-[10px] font-black uppercase tracking-widest border-border text-muted-foreground">Primary</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'users' && (
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 bg-card">
              <CardHeader className="border-b border-border bg-muted/30 px-8 py-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-black text-foreground tracking-tight uppercase tracking-widest text-xs">User Management</CardTitle>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black uppercase text-[10px] tracking-widest h-9 px-4">Add User</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {loadingUsers ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground font-bold uppercase tracking-widest">
                      No users found.
                    </div>
                  ) : (
                    users.map((user) => (
                      <div key={user.uid || user.id} className="p-6 flex items-center justify-between hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black text-sm overflow-hidden">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              (user.displayName || user.email || '?').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-foreground">{user.displayName || 'Unnamed User'}</h4>
                            <p className="text-xs text-muted-foreground font-bold">{user.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="rounded-full text-[10px] font-black uppercase tracking-widest border-border text-muted-foreground">{user.role || 'user'}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'api' && (
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 bg-card">
              <CardHeader className="border-b border-border bg-muted/30 px-8 py-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-black text-foreground tracking-tight uppercase tracking-widest text-xs">API & Webhooks</CardTitle>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black uppercase text-[10px] tracking-widest h-9 px-4">Generate Key</Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-foreground">Production API Key</h4>
                      <p className="text-xs font-mono text-muted-foreground mt-1 truncate">hp_live_••••••••••••••••••••••••</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary" onClick={() => toast.success("API Key copied")}>
                        <Copy size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-rose-500">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Webhooks</h4>
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-2xl">
                    <p className="text-sm text-muted-foreground font-bold">No webhooks configured</p>
                    <Button variant="link" className="text-brand-blue font-black uppercase text-[10px] tracking-widest mt-2">Add Webhook Endpoint</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'backup' && (
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 bg-card">
              <CardHeader className="border-b border-border bg-muted/30 px-8 py-6">
                <CardTitle className="text-lg font-black text-foreground tracking-tight uppercase tracking-widest text-xs">Backup & Restore</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl border border-border bg-muted/10 space-y-4">
                    <div className="w-12 h-12 bg-card rounded-xl shadow-sm flex items-center justify-center text-primary border border-border">
                      <Database size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-foreground">Automated Backups</h4>
                      <p className="text-xs text-muted-foreground font-bold mt-1">Daily backups are enabled and stored securely.</p>
                    </div>
                    <Button variant="outline" className="w-full rounded-xl font-black uppercase text-[10px] tracking-widest h-10 border-border text-muted-foreground">Configure Schedule</Button>
                  </div>
                  <div className="p-6 rounded-2xl border border-border bg-muted/10 space-y-4">
                    <div className="w-12 h-12 bg-card rounded-xl shadow-sm flex items-center justify-center text-primary border border-border">
                      <RefreshCw size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-foreground">Manual Restore</h4>
                      <p className="text-xs text-muted-foreground font-bold mt-1">Restore your system to a previous state.</p>
                    </div>
                    <Button variant="outline" className="w-full rounded-xl font-black uppercase text-[10px] tracking-widest h-10 border-border text-muted-foreground">Restore Now</Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Recent Backups</h4>
                  <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden">
                    {[
                      { date: '2026-04-12 03:00 AM', size: '1.2 GB', status: 'Success' },
                      { date: '2026-04-11 03:00 AM', size: '1.1 GB', status: 'Success' },
                    ].map((backup) => (
                      <div key={backup.date} className="p-4 flex items-center justify-between bg-card">
                        <div>
                          <p className="text-sm font-bold text-foreground">{backup.date}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{backup.size}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-primary/10 text-primary border-none font-black uppercase text-[10px] tracking-widest px-3 py-1 rounded-full">{backup.status}</Badge>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary">
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
