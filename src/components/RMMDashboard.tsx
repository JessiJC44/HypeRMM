import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Shield, Terminal, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export function RMMDashboard() {
  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 bg-background min-h-screen animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">RMM Dashboard</h1>
          <p className="text-sm text-muted-foreground font-medium">Advanced Remote Monitoring & Management powered by Supabase.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Agents', value: '42', icon: Activity, color: 'text-brand-blue' },
          { label: 'Security Score', value: '94%', icon: Shield, color: 'text-brand-green' },
          { label: 'Remote Sessions', value: '3', icon: Terminal, color: 'text-amber-500' },
          { label: 'Automation Tasks', value: '12', icon: Zap, color: 'text-purple-500' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="border-none shadow-sm bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={stat.color} size={16} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="p-12 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-brand-blue" />
          </div>
          <h2 className="text-xl font-bold">RMM Module Integration</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The RMM module is currently being integrated with Supabase for real-time telemetry and advanced remote control features.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
