import * as React from 'react';
import { auth } from '../lib/firebase';
import { computeMonthlyReport, MonthlyReport } from '../services/statsService';
import { toast } from 'sonner';
import { BarChart3, Download, Calendar, Filter, ChevronDown, PieChart, TrendingUp, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { motion } from 'motion/react';

export function Reports() {
  const data = [
    { name: 'Jan', tickets: 45, devices: 120 },
    { name: 'Feb', tickets: 52, devices: 125 },
    { name: 'Mar', tickets: 38, devices: 132 },
    { name: 'Apr', tickets: 65, devices: 140 },
    { name: 'May', tickets: 48, devices: 156 },
    { name: 'Jun', tickets: 20, devices: 160 },
  ];

  const reportTypes = [
    { title: 'Executive Summary', desc: 'High-level overview of IT health and SLA compliance.', icon: PieChart },
    { title: 'Asset Inventory', desc: 'Detailed list of all managed hardware and software.', icon: BarChart3 },
    { title: 'Patch Status', desc: 'Compliance report for OS and 3rd party updates.', icon: TrendingUp },
    { title: 'Ticket Activity', desc: 'Analysis of support queue and technician performance.', icon: FileText },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 bg-background min-h-screen animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">Generate and schedule detailed reports for your customers.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="rounded-full px-6 border-border font-bold gap-2 w-full sm:w-auto bg-card text-muted-foreground hover:bg-muted/50">
            <Calendar size={18} />
            Scheduled Reports
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 gap-2 w-full sm:w-auto">
            <Download size={18} />
            Export Data
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((report, index) => (
          <motion.div
            key={report.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-all cursor-pointer group h-full">
              <CardContent className="p-6">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors w-fit mb-4">
                  <report.icon size={24} />
                </div>
                <h3 className="font-bold text-foreground">{report.title}</h3>
                <p className="text-xs text-muted-foreground font-medium mt-1">{report.desc}</p>
                <Button variant="ghost" size="sm" className="mt-4 text-primary font-bold p-0 h-auto hover:bg-transparent">
                  Generate Now
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border border-border bg-card shadow-sm h-full">
            <CardHeader className="border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-foreground">Ticket Volume Trends</CardTitle>
                <Button variant="outline" size="sm" className="rounded-full h-8 gap-2 border-border text-xs font-bold bg-card text-muted-foreground hover:bg-muted/50">
                  Last 6 Months
                  <ChevronDown size={14} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      color: 'hsl(var(--foreground))'
                    }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                  />
                  <Bar dataKey="tickets" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-bold text-foreground">Recent Reports</h2>
          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden divide-y divide-border">
            {[
              { name: 'Monthly Executive Summary', date: 'Oct 01, 2023', size: '2.4 MB' },
              { name: 'Asset Inventory - Acme Corp', date: 'Sep 28, 2023', size: '1.8 MB' },
              { name: 'Patch Compliance Audit', date: 'Sep 25, 2023', size: '3.1 MB' },
              { name: 'Technician Performance', date: 'Sep 20, 2023', size: '1.2 MB' },
            ].map((report, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-foreground truncate">{report.name}</h4>
                    <p className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">{report.date} • {report.size}</p>
                  </div>
                </div>
                <Download size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.div>
            ))}
          </div>
          <Button variant="outline" className="w-full rounded-xl border-border font-bold bg-card text-muted-foreground hover:bg-muted/50">View All History</Button>
        </motion.div>
      </div>
    </div>
  );
}
