import * as React from 'react';
import { Globe, Plus, Search, Filter, MoreVertical, MapPin, Users, Monitor, Shield, Building2, Building, Landmark, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';

export function Sites() {
  const sites = [
    { name: 'Main Office', customer: 'Acme Corp', location: 'New York, NY', devices: 45, users: 120, status: 'Healthy', icon: Building2 },
    { name: 'Branch Office', customer: 'Acme Corp', location: 'London, UK', devices: 12, users: 35, status: 'Warning', icon: Building },
    { name: 'HQ', customer: 'Global Tech', location: 'San Francisco, CA', devices: 89, users: 450, status: 'Healthy', icon: Landmark },
    { name: 'Data Center', customer: 'Global Tech', location: 'Austin, TX', devices: 156, users: 5, status: 'Healthy', icon: Server },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 bg-[#f8f9fa] min-h-screen animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Sites & Customers</h1>
          <p className="text-sm text-slate-500">Manage your customer organizations and their physical locations.</p>
        </div>
        <Button className="bg-[#003d33] hover:bg-[#002b24] text-white rounded-full px-6 gap-2 w-full sm:w-auto">
          <Plus size={18} />
          Add New Site
        </Button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row items-center gap-4"
      >
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Search sites, customers, or locations..." className="pl-10 rounded-xl border-slate-200 w-full" />
        </div>
        <Button variant="outline" className="gap-2 rounded-xl border-slate-200 w-full sm:w-auto">
          <Filter size={18} />
          Filters
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sites.map((site, index) => (
          <motion.div
            key={site.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ y: -4 }}
          >
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow group rounded-2xl overflow-hidden bg-white h-full">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <site.icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{site.name}</h3>
                    <p className="text-sm text-slate-500 font-medium">{site.customer}</p>
                  </div>
                </div>
                <Badge className={cn(
                  "text-[10px] font-bold border-none px-3 py-1 rounded-full",
                  site.status === 'Healthy' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                )}>
                  {site.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-50">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Devices</p>
                  <p className="text-lg font-bold text-slate-700">{site.devices}</p>
                </div>
                <div className="text-center border-x border-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Users</p>
                  <p className="text-lg font-bold text-slate-700">{site.users}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SLA</p>
                  <p className="text-lg font-bold text-emerald-600">99.9%</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin size={14} />
                  <span className="text-xs font-medium">{site.location}</span>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 font-bold hover:bg-blue-50">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
