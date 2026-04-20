import * as React from 'react';
import { AppWindow, Plus, Search, Filter, Download, ExternalLink, ShieldCheck, LayoutGrid, List, CheckCircle2, ChevronRight, Monitor, Package, XCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { getSoftwareLogo } from './SoftwareLogos';
import { cn } from '@/lib/utils';
import { auth, db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface Software {
  id: string;
  name: string;
  category: string;
  developer: string;
  description: string;
  logo?: string;
  isBuiltIn?: boolean;
}

interface Device {
  id: string;
  name: string;
  os: string;
  status: string;
}

interface InstallStats {
  counts: Record<string, number>;
  totalDevices: number;
}

export function AppCenter() {
  const [catalog, setCatalog] = React.useState<Software[]>([]);
  const [stats, setStats] = React.useState<InstallStats>({ counts: {}, totalDevices: 0 });
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const [isInstallDialogOpen, setIsInstallDialogOpen] = React.useState(false);
  const [selectedSoftware, setSelectedSoftware] = React.useState<Software | null>(null);
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = React.useState<string[]>([]);
  const [actionType, setActionType] = React.useState<'install' | 'uninstall'>('install');
  const [isQueueing, setIsQueueing] = React.useState(false);

  React.useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/app-center/catalog', {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        const data = await res.json();
        setCatalog(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load software catalog');
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/app-center/installed', {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {}
    };

    fetchCatalog();
    fetchStats();

    // Listen to devices for selection dialog
    if (auth.currentUser) {
      const q = query(
        collection(db, 'devices'), 
        where('userId', '==', auth.currentUser.uid),
        orderBy('name', 'asc')
      );
      return onSnapshot(q, (snap) => {
        setDevices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Device)));
      });
    }
  }, []);

  const handleAction = (software: Software, type: 'install' | 'uninstall') => {
    setSelectedSoftware(software);
    setActionType(type);
    setSelectedDevices([]);
    setIsInstallDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedSoftware || selectedDevices.length === 0) return;
    
    setIsQueueing(true);
    const actionVerb = actionType === 'install' ? 'Installation' : 'Uninstallation';
    
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/app-center/${actionType}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          catalogId: selectedSoftware.id,
          deviceIds: selectedDevices
        })
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(`${actionVerb} queued for ${result.queuedCount || selectedDevices.length} devices.`);
        setIsInstallDialogOpen(false);
      } else {
        toast.error(result.error || `Failed to queue ${actionType}`);
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsQueueing(false);
    }
  };

  const filteredCatalog = catalog.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.developer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 bg-background max-w-[1600px] mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">App Center</h1>
          </div>
          <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
            Software Repository • {catalog.length} Available Packages
          </p>
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Filter apps, developers, categories..." 
            className="w-full md:w-[350px] pl-10 rounded-xl bg-card border-border h-11 focus-visible:ring-primary shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <Card key={i} className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <Skeleton className="w-14 h-14 rounded-xl" />
                  <Skeleton className="w-20 h-5 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-12 w-full" />
                <div className="pt-4 border-t border-border flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16 rounded-lg" />
                    <Skeleton className="h-8 w-16 rounded-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredCatalog.map((app) => {
              const Logo = getSoftwareLogo(app.name);
              const installedCount = stats.counts[app.id] || 0;
              const totalDevices = stats.totalDevices || 0;
              
              return (
                <motion.div
                  key={app.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-border shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group overflow-hidden bg-card rounded-2xl h-full flex flex-col relative">
                    <CardContent className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-14 h-14 bg-muted/30 rounded-xl flex items-center justify-center p-3 border border-border group-hover:border-primary/30 transition-colors">
                          <Logo size={28} className="group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        {installedCount > 0 ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {installedCount}/{totalDevices} Devices
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground border-border">
                            Not Installed
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 mb-3">
                        <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{app.name}</h3>
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-tight">{app.developer}</p>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1 leading-relaxed">
                        {app.description || `${app.name} is available for automated deployment across your infrastructure.`}
                      </p>

                      <div className="flex items-center justify-between pt-5 border-t border-border mt-auto">
                        <span className="text-[10px] font-bold text-primary/70 uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-md">{app.category}</span>
                        <div className="flex gap-1.5">
                          {installedCount > 0 && (
                            <Button 
                              onClick={() => handleAction(app, 'uninstall')}
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 px-3 rounded-lg text-xs font-bold transition-all active:scale-95"
                            >
                              Uninstall
                            </Button>
                          )}
                          <Button 
                            onClick={() => handleAction(app, 'install')}
                            variant="secondary" 
                            size="sm" 
                            className="h-8 px-3 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all active:scale-95"
                          >
                            Install
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {filteredCatalog.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="p-4 bg-muted/30 rounded-full">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-bold">No applications found</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">Try adjusting your search criteria or explore our built-in categories.</p>
          </div>
          <Button variant="outline" onClick={() => setSearchQuery('')} className="rounded-xl">Clear Search</Button>
        </div>
      )}

      <Dialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen}>
        <DialogContent className="sm:max-w-xl bg-card border-border border-2 shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "p-3 rounded-xl",
                actionType === 'install' ? "bg-primary/10" : "bg-red-500/10"
              )}>
                {actionType === 'install' ? 
                  <Download className="w-6 h-6 text-primary" /> : 
                  <XCircle className="w-6 h-6 text-red-500" />
                }
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {actionType === 'install' ? 'Install' : 'Uninstall'} {selectedSoftware?.name}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground flex items-center gap-1.5 mt-1 font-medium">
                  <Monitor className="w-3.5 h-3.5" />
                  Select destination devices for this operation
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-6 pt-4 space-y-4">
            <div className="bg-muted/30 border border-border rounded-xl p-4 flex items-center gap-3">
              <Info className="w-5 h-5 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Commands will be sent only to <strong>online</strong> devices. 
                Progress can be tracked in the device logs section.
              </p>
            </div>

            <ScrollArea className="h-[350px] pr-4 border border-border rounded-xl bg-background/50">
              <div className="p-1 space-y-1">
                {devices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground italic">
                    No managed devices registered in your account.
                  </div>
                ) : (
                  devices.map(device => {
                    const isOnline = device.status === 'online';
                    const isDisabled = !isOnline;
                    
                    return (
                      <div 
                        key={device.id} 
                        className={cn(
                          "flex items-center space-x-3 p-4 rounded-lg transition-all border border-transparent",
                          isOnline ? "hover:bg-primary/5 hover:border-primary/20 cursor-pointer" : "opacity-60 grayscale cursor-not-allowed"
                        )}
                        onClick={() => {
                          if (!isDisabled) {
                            if (selectedDevices.includes(device.id)) {
                              setSelectedDevices(selectedDevices.filter(id => id !== device.id));
                            } else {
                              setSelectedDevices([...selectedDevices, device.id]);
                            }
                          }
                        }}
                      >
                        <Checkbox 
                          id={device.id} 
                          checked={selectedDevices.includes(device.id)}
                          disabled={isDisabled}
                          className="w-5 h-5"
                          onCheckedChange={(checked) => {
                            if (typeof checked === 'boolean' && !isDisabled) {
                              if (checked) setSelectedDevices([...selectedDevices, device.id]);
                              else setSelectedDevices(selectedDevices.filter(id => id !== device.id));
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <label htmlFor={device.id} className={cn("text-sm font-bold block truncate", isDisabled ? "cursor-not-allowed" : "cursor-pointer")}>
                            {device.name}
                          </label>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{device.os}</span>
                            <span className="text-[10px] text-muted-foreground">•</span>
                            <Badge variant="outline" className={cn(
                              "px-1.5 py-0 text-[9px] font-bold uppercase",
                              isOnline ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" : "text-muted-foreground"
                            )}>
                              {device.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between px-2 text-xs font-bold text-muted-foreground tracking-tight">
              <span>{selectedDevices.length} Devices Selected</span>
              <button 
                type="button"
                onClick={() => setSelectedDevices(devices.filter(d => d.status === 'online').map(d => d.id))}
                className="text-primary hover:underline"
              >
                Select All Online
              </button>
            </div>
          </div>

          <DialogFooter className="bg-muted/30 p-6 flex items-center justify-between sm:justify-between w-full border-t border-border">
            <Button variant="ghost" onClick={() => setIsInstallDialogOpen(false)} className="rounded-xl font-bold h-11 px-6">Cancel</Button>
            <Button 
              onClick={executeAction} 
              disabled={selectedDevices.length === 0 || isQueueing}
              className={cn(
                "rounded-xl h-11 px-8 font-bold shadow-lg shadow-primary/20",
                actionType === 'uninstall' ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "bg-primary"
              )}
            >
              {isQueueing ? (
                <div className="flex items-center gap-2">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Queueing...
                </div>
              ) : (
                <>{actionType === 'install' ? 'Begin Installation' : 'Confirm Uninstallation'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
