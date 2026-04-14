import * as React from 'react';
import { 
  Users, 
  Ticket, 
  Monitor, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Alert } from '@/src/types';
import { motion } from 'motion/react';
import { 
  Tooltip as ShadcnTooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { useLanguage } from '../contexts/LanguageContext';

const chartData = [
  { name: 'Mon', tickets: 12, alerts: 45 },
  { name: 'Tue', tickets: 19, alerts: 52 },
  { name: 'Wed', tickets: 15, alerts: 38 },
  { name: 'Thu', tickets: 22, alerts: 65 },
  { name: 'Fri', tickets: 30, alerts: 48 },
  { name: 'Sat', tickets: 10, alerts: 20 },
  { name: 'Sun', tickets: 8, alerts: 15 },
];

export function Dashboard() {
  const [stats, setStats] = React.useState<any>(null);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { t } = useLanguage();

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, alertsRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/alerts')
        ]);
        const statsData = await statsRes.json();
        const alertsData = await alertsRes.json();
        
        setStats(statsData);
        setAlerts(alertsData);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  const statCards = [
    { 
      label: t('dashboard.open_tickets'), 
      value: stats.openTickets, 
      icon: Ticket,
      trend: '+12%',
      trendUp: true,
      color: 'brand-blue',
      description: 'Total number of support requests currently awaiting resolution.'
    },
    { 
      label: t('dashboard.managed_devices'), 
      value: stats.managedDevices, 
      icon: Monitor,
      trend: '+2',
      trendUp: true,
      color: 'brand-green',
      description: 'Total number of endpoints currently connected and managed by the platform.'
    },
    { 
      label: t('dashboard.active_alerts'), 
      value: stats.activeAlerts, 
      icon: AlertTriangle,
      trend: '-5%',
      trendUp: false,
      color: 'rose',
      description: 'Critical system events that require immediate attention.'
    },
    { 
      label: t('dashboard.sla_compliance'), 
      value: stats.slaCompliance, 
      icon: Clock,
      trend: '+0.4%',
      trendUp: true,
      color: 'amber',
      description: 'Percentage of tickets resolved within the agreed-upon timeframe.'
    },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-8 bg-slate-50/50 min-h-screen animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-brand-navy tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-sm text-slate-500 font-medium">{t('dashboard.subtitle')}</p>
        </div>
        <Button className="bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-brand-navy/10 w-full sm:w-auto">
          {t('dashboard.generate_report')}
        </Button>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <TooltipProvider key={stat.label}>
            <ShadcnTooltip>
              <TooltipTrigger asChild>
                <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20,
              delay: index * 0.1 
            }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
              <div className={cn(
                "h-1.5 w-full",
                stat.color === 'brand-blue' ? "bg-brand-blue" :
                stat.color === 'brand-green' ? "bg-brand-green" :
                stat.color === 'rose' ? "bg-rose-500" :
                "bg-amber-500"
              )} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{stat.label}</CardTitle>
                <stat.icon className={cn(
                  "h-4 w-4",
                  stat.color === 'brand-blue' ? "text-brand-blue" :
                  stat.color === 'brand-green' ? "text-brand-green" :
                  stat.color === 'rose' ? "text-rose-500" :
                  "text-amber-500"
                )} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-brand-navy">{stat.value}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className={cn(
                    "text-[10px] px-2 py-0.5 font-bold rounded-full",
                    stat.trendUp ? "bg-brand-green/10 text-brand-green" : "bg-rose-50 text-rose-600"
                  )}>
                    {stat.trend}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('dashboard.vs_last')}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-[200px]">{stat.description}</p>
              </TooltipContent>
            </ShadcnTooltip>
          </TooltipProvider>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="col-span-full lg:col-span-4"
        >
          <Card className="rounded-2xl border-none shadow-sm overflow-hidden h-full">
            <CardHeader className="border-b bg-slate-50/50">
              <TooltipProvider>
                <ShadcnTooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <CardTitle className="text-lg font-bold text-brand-navy">{t('dashboard.performance')}</CardTitle>
                      <CardDescription className="font-medium">{t('dashboard.performance_desc')}</CardDescription>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Real-time visualization of support activity and system stability.</p>
                  </TooltipContent>
                </ShadcnTooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent className="h-[250px] lg:h-[320px] pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00AEEF" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00AEEF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderColor: '#f1f5f9',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      border: 'none'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tickets" 
                    stroke="#00AEEF" 
                    fillOpacity={1} 
                    fill="url(#colorTickets)" 
                    strokeWidth={3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="alerts" 
                    stroke="#76BA1B" 
                    fill="transparent" 
                    strokeWidth={2}
                    strokeDasharray="6 4"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="col-span-full lg:col-span-3"
        >
          <Card className="rounded-2xl border-none shadow-sm overflow-hidden h-full">
            <CardHeader className="border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="text-lg font-bold text-brand-navy">{t('dashboard.critical_alerts')}</CardTitle>
              <CardDescription className="font-medium">{t('dashboard.attention_required')}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert, index) => (
                  <TooltipProvider key={alert.id}>
                    <ShadcnTooltip>
                      <TooltipTrigger asChild>
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 + (index * 0.1) }}
                          className="flex items-start gap-3 lg:gap-4 p-3 lg:p-4 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-slate-50 transition-colors group cursor-help"
                        >
                          <div className={cn(
                            "mt-0.5 p-2 rounded-xl shadow-sm shrink-0",
                            alert.severity === 'critical' ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500"
                          )}>
                            <AlertTriangle size={16} strokeWidth={2.5} />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-sm font-black text-brand-navy tracking-tight truncate">{alert.deviceName}</p>
                            <p className="text-xs text-slate-500 font-bold line-clamp-1">{alert.message}</p>
                          </div>
                          <div className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded-lg border border-slate-100 shrink-0">
                            {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs font-bold mb-1">Alert Details</p>
                        <p className="text-[10px] text-slate-400">Severity: <span className="capitalize">{alert.severity}</span></p>
                        <p className="text-[10px] text-slate-400">Time: {new Date(alert.timestamp).toLocaleString()}</p>
                      </TooltipContent>
                    </ShadcnTooltip>
                  </TooltipProvider>
                ))}
              </div>
              <TooltipProvider>
                <ShadcnTooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" className="w-full mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded-xl h-10">
                      {t('dashboard.view_all_alerts')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Navigate to the full alerts history and management console.</p>
                  </TooltipContent>
                </ShadcnTooltip>
              </TooltipProvider>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
