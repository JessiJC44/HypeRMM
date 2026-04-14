import * as React from 'react';
import { Globe, Plus, Search, Filter, MoreVertical, MapPin, Users, Monitor, Shield, Building2, Building, Landmark, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';

import { firestoreService } from '../services/firestoreService';
import { toast } from 'sonner';

export function Sites() {
  const [sites, setSites] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = firestoreService.subscribeToSites((data) => {
      setSites(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'hq': return Landmark;
      case 'branch': return Building;
      case 'datacenter': return Server;
      default: return Building2;
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 bg-background min-h-screen animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Sites & Customers</h1>
          <p className="text-sm text-muted-foreground">Manage your customer organizations and their physical locations.</p>
        </div>
        <Button 
          onClick={() => {
            firestoreService.addSite({
              name: 'New Site ' + (sites.length + 1),
              customer: 'New Customer',
              location: 'Remote',
              devices: 0,
              users: 0,
              status: 'Healthy',
              type: 'office'
            });
            toast.success("Site added successfully");
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 gap-2 w-full sm:w-auto"
        >
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="Search sites, customers, or locations..." className="pl-10 rounded-xl border-border w-full bg-card text-foreground" />
        </div>
        <Button variant="outline" className="gap-2 rounded-xl border-border w-full sm:w-auto bg-card text-muted-foreground hover:bg-muted/50">
          <Filter size={18} />
          Filters
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 h-40 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : sites.length === 0 ? (
          <div className="col-span-2 h-40 flex items-center justify-center text-muted-foreground font-bold uppercase tracking-widest">
            No sites found.
          </div>
        ) : (
          sites.map((site, index) => {
            const Icon = getIcon(site.type);
            return (
              <motion.div
                key={site.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -4 }}
              >
                <Card className="border-none shadow-sm hover:shadow-md transition-shadow group rounded-2xl overflow-hidden bg-card h-full">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-2xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{site.name}</h3>
                        <p className="text-sm text-muted-foreground font-medium">{site.customer}</p>
                      </div>
                    </div>
                    <Badge className={cn(
                      "text-[10px] font-bold border-none px-3 py-1 rounded-full",
                      site.status === 'Healthy' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {site.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-4 border-y border-border">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Devices</p>
                      <p className="text-lg font-bold text-foreground">{site.devices}</p>
                    </div>
                    <div className="text-center border-x border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Users</p>
                      <p className="text-lg font-bold text-foreground">{site.users}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">SLA</p>
                      <p className="text-lg font-bold text-emerald-500">99.9%</p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin size={14} />
                      <span className="text-xs font-medium">{site.location}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/10">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
