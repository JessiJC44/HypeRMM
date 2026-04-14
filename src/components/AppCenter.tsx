import * as React from 'react';
import { AppWindow, Plus, Search, Filter, Download, ExternalLink, ShieldCheck, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'motion/react';

export function AppCenter() {
  const apps = [
    { 
      name: 'Splashtop', 
      category: 'Remote Access', 
      status: 'Installed', 
      version: '3.5.2.1', 
      developer: 'Splashtop Inc.',
      logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/Splashtop_Logo.svg/200px-Splashtop_Logo.svg.png'
    },
    { 
      name: 'AnyDesk', 
      category: 'Remote Access', 
      status: 'Available', 
      version: '7.1.0', 
      developer: 'AnyDesk Software',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/AnyDesk_Logo.svg/200px-AnyDesk_Logo.svg.png'
    },
    { 
      name: 'Chocolatey', 
      category: 'Package Manager', 
      status: 'Installed', 
      version: '1.2.1', 
      developer: 'Chocolatey Software',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Chocolatey_logo.svg/200px-Chocolatey_logo.svg.png'
    },
    { 
      name: 'Webroot', 
      category: 'Security', 
      status: 'Available', 
      version: '9.0.33.35', 
      developer: 'OpenText',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Webroot_logo.svg/200px-Webroot_logo.svg.png'
    },
    { 
      name: 'Bitdefender', 
      category: 'Security', 
      status: 'Installed', 
      version: '7.7.1.245', 
      developer: 'Bitdefender',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Bitdefender_logo.svg/200px-Bitdefender_logo.svg.png'
    },
    { 
      name: 'Acronis', 
      category: 'Backup', 
      status: 'Available', 
      version: '15.0.29486', 
      developer: 'Acronis',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Acronis_logo.svg/200px-Acronis_logo.svg.png'
    },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 bg-background min-h-screen animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">App Center</h1>
          <p className="text-sm text-muted-foreground font-medium">Discover and manage integrations and third-party applications.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="rounded-xl px-6 border-border font-bold w-full sm:w-auto bg-card text-muted-foreground hover:bg-muted/50">My Integrations</Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 h-11 font-bold shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] w-full sm:w-auto">
            <Plus size={18} />
            Browse Marketplace
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app, index) => (
          <motion.div
            key={app.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ y: -4 }}
          >
            <Card className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden bg-card rounded-2xl h-full">
            <CardContent className="p-0">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center p-3 group-hover:bg-muted/30 transition-colors border border-border">
                    <img 
                      src={app.logo} 
                      alt={app.name} 
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <Badge className={cn(
                    "text-[10px] font-bold border-none px-3 py-1 rounded-full",
                    app.status === 'Installed' ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                  )}>
                    {app.status}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-foreground">{app.name}</h3>
                <p className="text-xs text-muted-foreground font-medium mb-6">{app.developer}</p>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{app.category}</span>
                  <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/10 h-9 px-4 rounded-xl">
                    {app.status === 'Installed' ? 'Manage' : 'Install'}
                  </Button>
                </div>
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
