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
      logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/Splashtop_Logo.svg/256px-Splashtop_Logo.svg.png'
    },
    { 
      name: 'AnyDesk', 
      category: 'Remote Access', 
      status: 'Available', 
      version: '7.1.0', 
      developer: 'AnyDesk Software',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/AnyDesk_Logo.svg/256px-AnyDesk_Logo.svg.png'
    },
    { 
      name: 'Chocolatey', 
      category: 'Package Manager', 
      status: 'Installed', 
      version: '1.2.1', 
      developer: 'Chocolatey Software',
      logo: 'https://logo.clearbit.com/chocolatey.org'
    },
    { 
      name: 'Webroot', 
      category: 'Security', 
      status: 'Available', 
      version: '9.0.33.35', 
      developer: 'OpenText',
      logo: 'https://logo.clearbit.com/webroot.com'
    },
    { 
      name: 'Bitdefender', 
      category: 'Security', 
      status: 'Installed', 
      version: '7.7.1.245', 
      developer: 'Bitdefender',
      logo: 'https://logo.clearbit.com/bitdefender.com'
    },
    { 
      name: 'Acronis', 
      category: 'Backup', 
      status: 'Available', 
      version: '15.0.29486', 
      developer: 'Acronis',
      logo: 'https://logo.clearbit.com/acronis.com'
    },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 bg-[#f8f9fa] min-h-screen animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">App Center</h1>
          <p className="text-sm text-slate-500">Discover and manage integrations and third-party applications.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="rounded-full px-6 border-slate-200 font-bold w-full sm:w-auto">My Integrations</Button>
          <Button className="bg-[#003d33] hover:bg-[#002b24] text-white rounded-full px-6 gap-2 w-full sm:w-auto">
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
            <Card className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white rounded-2xl h-full">
            <CardContent className="p-0">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center p-3 group-hover:bg-white transition-colors border border-slate-100">
                    <img 
                      src={app.logo} 
                      alt={app.name} 
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <Badge className={cn(
                    "text-[10px] font-bold border-none px-3 py-1 rounded-full",
                    app.status === 'Installed' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                  )}>
                    {app.status}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-slate-800">{app.name}</h3>
                <p className="text-xs text-slate-500 font-medium mb-6">{app.developer}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{app.category}</span>
                  <Button variant="ghost" size="sm" className="text-blue-600 font-bold hover:bg-blue-50 h-9 px-4 rounded-xl">
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
