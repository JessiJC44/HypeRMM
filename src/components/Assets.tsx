import * as React from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical,
  Monitor,
  Smartphone,
  Laptop,
  Server,
  ExternalLink,
  Activity,
  Shield,
  Cpu,
  HardDrive,
  AlertTriangle,
  Plus,
  Check,
  Download,
  Info,
  Sparkles,
  ChevronDown,
  DownloadCloud,
  Settings2,
  Trash2,
  Terminal,
  FolderOpen,
  Star,
  MessageSquare,
  Bell,
  Building2,
  RefreshCw
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { Device } from '@/src/types';
import { motion } from 'motion/react';
import { toast } from 'sonner';

import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { AgentConsole } from './AgentConsole';

import { firestoreService } from '../services/firestoreService';

import { auth } from '../lib/firebase';

export function Devices() {
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [selectedDevice, setSelectedDevice] = React.useState<Device | null>(null);
  const [installStep, setInstallStep] = React.useState(1);
  const [installMode, setInstallMode] = React.useState<'download' | 'command' | 'link'>('download');
  const [newDevice, setNewDevice] = React.useState({
    name: '',
    type: 'workstation' as const,
    os: 'Windows',
    arch: 'x64',
    customer: '',
    ipAddress: '192.168.1.' + Math.floor(Math.random() * 254),
    anydeskId: '',
    splashtopId: ''
  });
  const [remoteTool, setRemoteTool] = React.useState<'splashtop' | 'anydesk'>('splashtop');
  const [filterQuery, setFilterQuery] = React.useState('');

  const REMOTE_LOGOS = {
    splashtop: 'https://www.splashtop.com/wp-content/uploads/splashtop-logo-icon.png',
    anydesk: 'https://anydesk.com/_static/img/logos/anydesk-logo-icon.png'
  };

  const customers = ['Client A', 'Client B', 'Client C', 'Discovered'];

  const handleAIFilter = () => {
    toast.info(`AI Filtering for: ${filterQuery}`);
    // In a real app, this would call an AI service to filter the devices list
  };

  React.useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = firestoreService.subscribeToDevices(user.uid, (data) => {
      setDevices(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddAgent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      await firestoreService.addDevice(user.uid, {
        ...newDevice,
        type: newDevice.type as any,
        status: 'online',
        splashtopId: 'ST-' + Math.random().toString(36).substring(2, 8).toUpperCase()
      });
      setInstallStep(5);
    } catch (error) {
      toast.error("Failed to register agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'online': return 'bg-brand-green';
      case 'warning': return 'bg-amber-500';
      case 'offline': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'server': return <Server size={16} />;
      case 'laptop': return <Laptop size={16} />;
      case 'mobile': return <Smartphone size={16} />;
      default: return <Monitor size={16} />;
    }
  };

  const handleRemoteConnect = (deviceName: string) => {
    const toolName = remoteTool === 'splashtop' ? 'Splashtop Enterprise' : 'AnyDesk';
    toast.info(`Connecting to ${deviceName} via ${toolName}...`);
    // Direct connection simulation
    setTimeout(() => {
      toast.success(`Session established with ${deviceName}`);
    }, 1500);
  };

  if (selectedDevice) {
    return <AgentConsole device={selectedDevice} onBack={() => setSelectedDevice(null)} />;
  }

  return (
    <div className="space-y-0 min-h-screen bg-background animate-in fade-in duration-500">
      {/* Top Bar - Atera Style */}
      <div className="bg-background border-b border-border px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-medium text-foreground">Devices</h1>
          <div className="flex items-center gap-1 text-muted-foreground text-sm cursor-pointer hover:text-foreground transition-colors">
            <span>Vue par défaut</span>
            <ChevronDown size={14} />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            size="sm" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md h-9 px-4 gap-2 text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
          >
            <Plus size={16} strokeWidth={3} />
            Installer un agent
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Bell size={18} />
            </div>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Settings2 size={18} />
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-navy flex items-center justify-center text-white text-xs font-bold">
              S
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="px-4 lg:px-6 py-4 flex flex-col gap-4 border-b border-border">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[300px] max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              placeholder="Décrivez ce que vous voulez filtrer" 
              className="pl-10 h-10 border-border rounded-md bg-muted/20 focus:ring-1 focus:ring-primary/30 font-normal text-sm text-foreground" 
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAIFilter()}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Info size={14} className="text-muted-foreground/50" />
              <div className="h-4 w-[1px] bg-border mx-1" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-4 bg-muted rounded-full relative cursor-pointer">
                  <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-background rounded-full shadow-sm" />
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 px-3 gap-2 text-xs font-medium border-border rounded-md hover:bg-muted/50"
                  onClick={handleAIFilter}
                >
                  <Sparkles size={12} className="text-primary" />
                  Demander
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 px-4 gap-2 text-sm font-normal border-border rounded-md">
              <Building2 size={16} className="text-muted-foreground" />
              Sites
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-4 gap-2 text-sm font-normal border-border rounded-md">
              <Star size={16} className="text-muted-foreground" />
              Favori
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-4 gap-2 text-sm font-normal border-border rounded-md">
              <Filter size={16} className="text-muted-foreground" />
              Filtres
            </Button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 overflow-x-auto pb-1 no-scrollbar">
            <div className="flex items-center gap-1">
              <input type="checkbox" className="rounded border-border bg-muted/20 mr-2" />
            </div>
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-2 text-xs font-normal text-muted-foreground hover:text-foreground hover:bg-transparent disabled:opacity-50" disabled>
              <Terminal size={14} />
              Exécuter un script
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-2 text-xs font-normal text-muted-foreground hover:text-foreground hover:bg-transparent disabled:opacity-50" disabled>
              <Shield size={14} />
              Assigner un profil d'automatisation
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-2 text-xs font-normal text-muted-foreground hover:text-foreground hover:bg-transparent disabled:opacity-50" disabled>
              <DownloadCloud size={14} />
              Installation du logiciel
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-2 text-xs font-normal text-muted-foreground hover:text-foreground hover:bg-transparent disabled:opacity-50" disabled>
              <Activity size={14} />
              Assigner un profil de seuil
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-1 text-muted-foreground">
              <MoreVertical size={14} />
            </Button>
          </div>
          <div className="text-[11px] text-muted-foreground font-normal">
            Nombre d'appareils affichés : {devices.length} sur {devices.length}
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="overflow-x-auto">
        <Table className="border-collapse">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="w-[40px] px-4">
                <input type="checkbox" className="rounded border-border bg-muted/20" />
              </TableHead>
              <TableHead className="text-[11px] font-medium text-muted-foreground py-3 whitespace-nowrap">Appareil</TableHead>
              <TableHead className="text-[11px] font-medium text-muted-foreground py-3 whitespace-nowrap">IA</TableHead>
              <TableHead className="text-[11px] font-medium text-muted-foreground py-3 whitespace-nowrap">Dernière connexion</TableHead>
              <TableHead className="text-[11px] font-medium text-muted-foreground py-3 whitespace-nowrap">Disponibilité</TableHead>
              <TableHead className="text-[11px] font-medium text-muted-foreground py-3 whitespace-nowrap">Type d'ap...</TableHead>
              <TableHead className="text-[11px] font-medium text-muted-foreground py-3 whitespace-nowrap">Site</TableHead>
              <TableHead className="text-[11px] font-medium text-muted-foreground py-3 whitespace-nowrap">Dossi...</TableHead>
              <TableHead className="text-[11px] font-medium text-muted-foreground py-3 whitespace-nowrap">Alertes</TableHead>
              <TableHead className="text-[11px] font-medium text-muted-foreground py-3 whitespace-nowrap">Correctifs dispo...</TableHead>
              <TableHead className="text-[11px] font-medium text-muted-foreground py-3 whitespace-nowrap">Redémarrage...</TableHead>
              <TableHead className="text-[11px] font-medium text-muted-foreground py-3 whitespace-nowrap">Accès à dista...</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={13} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground font-medium">Chargement des appareils...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground/50">
                    <Monitor size={48} strokeWidth={1} />
                    <p className="text-sm font-medium">Aucun appareil trouvé</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              devices.map((device, index) => (
                <TableRow 
                  key={device.id}
                  className="hover:bg-muted/20 transition-colors border-b border-border group"
                >
                  <TableCell className="px-4">
                    <input type="checkbox" className="rounded border-border bg-muted/20" />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span 
                        onClick={() => setSelectedDevice(device)}
                        className="font-bold text-foreground text-sm cursor-pointer hover:text-primary transition-colors"
                      >
                        {device.name}
                      </span>
                      <Star size={14} className="text-muted-foreground/30 hover:text-amber-400 cursor-pointer transition-colors" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer">
                      <Sparkles size={14} />
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="text-xs text-muted-foreground">
                      Administrateur (avr. 13, 2026 09:25)
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", device.status === 'online' ? 'bg-brand-green' : 'bg-rose-500')} />
                      <span className="text-xs text-muted-foreground">{device.status === 'online' ? 'En ligne' : 'Hors ligne'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="text-xs text-muted-foreground">{device.type === 'server' ? 'Serveur' : 'PC'}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="text-xs text-primary hover:underline cursor-pointer">
                      {device.customer || 'Site par défaut'}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="text-xs text-muted-foreground">FluxI...</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-rose-500/10 flex items-center justify-center text-[10px] font-bold text-rose-500">1</div>
                      <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center text-[10px] font-bold text-orange-500">0</div>
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">0</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 inline-flex items-center justify-center min-w-[30px]">
                      {Math.floor(Math.random() * 25)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/50">
                      <RefreshCw size={14} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <DropdownMenu>
                        <div className="flex items-center bg-background border border-border rounded-md overflow-hidden shadow-sm hover:border-primary/30 transition-all">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 rounded-none border-r border-border hover:bg-primary/5"
                            onClick={() => handleRemoteConnect(device.name)}
                          >
                            <img 
                              src={REMOTE_LOGOS[remoteTool]} 
                              alt={remoteTool} 
                              className="w-4 h-4 object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </Button>
                          <DropdownMenuTrigger
                            render={
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-6 px-0 rounded-none hover:bg-muted/50"
                              >
                                <ChevronDown size={12} className="text-muted-foreground" />
                              </Button>
                            }
                          />
                        </div>
                        <DropdownMenuContent align="end" className="w-40 bg-card border-border">
                          <DropdownMenuItem 
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => setRemoteTool('splashtop')}
                          >
                            <img src={REMOTE_LOGOS.splashtop} className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                            <span className="text-xs font-medium">Splashtop</span>
                            {remoteTool === 'splashtop' && <Check size={12} className="ml-auto text-brand-green" />}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => setRemoteTool('anydesk')}
                          >
                            <img src={REMOTE_LOGOS.anydesk} className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                            <span className="text-xs font-medium">AnyDesk</span>
                            {remoteTool === 'anydesk' && <Check size={12} className="ml-auto text-brand-green" />}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreVertical size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Install Agent Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          setInstallStep(1);
          setInstallMode('download');
        }
      }}>
        <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
          <div className="bg-brand-navy p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative z-10">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <DownloadCloud size={24} className="text-brand-blue" />
                  </div>
                  Installer un agent
                </DialogTitle>
                <DialogDescription className="text-white/60 font-medium text-sm mt-2">
                  Déployez l'agent HypeRemote avec accès à distance Splashtop & AnyDesk pré-configuré.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Steps Indicator */}
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -translate-y-1/2 z-0" />
              {[1, 2, 3, 4].map((step) => (
                <div 
                  key={step}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm relative z-10 transition-all duration-300",
                    installStep >= step ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20" : "bg-white border-2 border-slate-100 text-slate-300"
                  )}
                >
                  {installStep > step ? <Check size={18} strokeWidth={3} /> : step}
                </div>
              ))}
            </div>

            {installStep === 1 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-brand-navy uppercase tracking-widest">Étape 1 : Système d'exploitation</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'Windows', icon: Monitor, label: 'Windows' },
                      { id: 'macOS', icon: Laptop, label: 'macOS' },
                      { id: 'Linux', icon: Server, label: 'Linux' },
                    ].map((os) => (
                      <button
                        key={os.id}
                        onClick={() => {
                          setNewDevice({ 
                            ...newDevice, 
                            os: os.id,
                            arch: os.id === 'macOS' ? 'Apple Silicon' : 'x64'
                          });
                        }}
                        className={cn(
                          "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200",
                          newDevice.os === os.id ? "border-brand-blue bg-brand-blue/5 text-brand-blue" : "border-slate-100 hover:border-slate-200 text-slate-400"
                        )}
                      >
                        <os.icon size={24} />
                        <span className="text-xs font-bold">{os.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {newDevice.os === 'macOS' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >
                    <h3 className="text-sm font-black text-brand-navy uppercase tracking-widest">Architecture du processeur</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'Apple Silicon', label: 'Apple Silicon', desc: 'M1, M2, M3, M4, M5' },
                        { id: 'Intel', label: 'Intel', desc: 'Processeurs Core i5/i7/i9' },
                      ].map((arch) => (
                        <button
                          key={arch.id}
                          onClick={() => setNewDevice({ ...newDevice, arch: arch.id })}
                          className={cn(
                            "flex flex-col items-start gap-1 p-4 rounded-2xl border-2 transition-all duration-200 text-left",
                            newDevice.arch === arch.id ? "border-brand-blue bg-brand-blue/5 text-brand-blue" : "border-slate-100 hover:border-slate-200 text-slate-400"
                          )}
                        >
                          <span className="text-xs font-black">{arch.label}</span>
                          <span className="text-[10px] font-medium opacity-70">{arch.desc}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {installStep === 2 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-brand-navy uppercase tracking-widest">Étape 2 : Sélectionner le client</h3>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                      className="w-full pl-12 pr-4 h-12 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-brand-blue outline-none font-bold text-brand-navy appearance-none"
                      value={newDevice.customer}
                      onChange={(e) => setNewDevice({ ...newDevice, customer: e.target.value })}
                    >
                      <option value="">Choisir un client...</option>
                      {customers.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>
              </motion.div>
            )}

            {installStep === 3 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-brand-navy uppercase tracking-widest">Étape 3 : Nom de l'appareil</h3>
                  <div className="relative">
                    <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input 
                      placeholder="Ex: PC-DIRECTION-01" 
                      className="pl-12 h-12 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-brand-blue outline-none font-bold text-brand-navy"
                      value={newDevice.name}
                      onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Ce nom sera utilisé pour identifier l'appareil dans votre inventaire.</p>
                </div>
              </motion.div>
            )}

            {installStep === 4 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Étape 4 : Mode d'installation</h3>
                  <div className="flex gap-2 p-1 bg-muted rounded-xl">
                    {[
                      { id: 'download', label: 'Télécharger', icon: Download },
                      { id: 'command', label: 'Ligne de commande', icon: Terminal },
                      { id: 'link', label: 'Lien', icon: ExternalLink },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setInstallMode(mode.id as any)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black transition-all",
                          installMode === mode.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <mode.icon size={14} />
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-muted/20 rounded-2xl border border-border space-y-4">
                  {installMode === 'download' && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-card rounded-lg shadow-sm border border-border">
                          <Download size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground">
                            {newDevice.os === 'Windows' ? 'HypeRemote_Agent_Win_x64.exe' : 
                             newDevice.os === 'macOS' ? `HypeRemote_Agent_Mac_${newDevice.arch === 'Apple Silicon' ? 'ARM' : 'Intel'}.pkg` :
                             'HypeRemote_Agent_Linux.deb'}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">v2.4.0 • 12.4 MB</p>
                        </div>
                      </div>
                      <Button 
                        onClick={handleAddAgent}
                        disabled={isSubmitting}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-6"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                            Processing...
                          </span>
                        ) : (
                          'Télécharger'
                        )}
                      </Button>
                    </div>
                  )}

                  {installMode === 'command' && (
                    <div className="space-y-3">
                      <div className="relative group">
                        <pre className="bg-slate-950 text-primary p-4 rounded-xl font-mono text-[11px] whitespace-pre-wrap break-all border border-border">
                          {newDevice.os === 'Windows' ? 
                            `msiexec /i "HypeRemoteAgent.msi" /qn CUSTOMER_ID="${newDevice.customer || 'ID'}" NAME="${newDevice.name || 'PC'}"` :
                            `curl -sSL https://get.hyperemote.com/install.sh | sudo bash -s -- --customer "${newDevice.customer || 'ID'}" --name "${newDevice.name || 'PC'}"`
                          }
                        </pre>
                        <div className="absolute right-2 top-2 flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg bg-white/10 text-white hover:bg-white/20"
                            onClick={() => {
                              const cmd = newDevice.os === 'Windows' ? 
                                `msiexec /i "HypeRemoteAgent.msi" /qn CUSTOMER_ID="${newDevice.customer || 'ID'}" NAME="${newDevice.name || 'PC'}"` :
                                `curl -sSL https://get.hyperemote.com/install.sh | sudo bash -s -- --customer "${newDevice.customer || 'ID'}" --name "${newDevice.name || 'PC'}"`;
                              navigator.clipboard.writeText(cmd);
                              toast.success("Commande copiée !");
                              handleAddAgent(null as any);
                            }}
                          >
                            <Plus size={14} />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          onClick={() => {
                            const cmd = newDevice.os === 'Windows' ? 
                              `msiexec /i "HypeRemoteAgent.msi" /qn CUSTOMER_ID="${newDevice.customer || 'ID'}" NAME="${newDevice.name || 'PC'}"` :
                              `curl -sSL https://get.hyperemote.com/install.sh | sudo bash -s -- --customer "${newDevice.customer || 'ID'}" --name "${newDevice.name || 'PC'}"`;
                            navigator.clipboard.writeText(cmd);
                            toast.success("Commande copiée !");
                            handleAddAgent(null as any);
                          }}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-6"
                        >
                          Copier
                        </Button>
                      </div>
                    </div>
                  )}

                  {installMode === 'link' && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 bg-card border border-border rounded-xl px-4 py-2 text-xs font-mono text-muted-foreground break-all">
                        https://get.hyperemote.com/dl/{newDevice.customer?.toLowerCase().replace(/\s+/g, '-') || 'client'}
                      </div>
                      <Button 
                        onClick={() => {
                          toast.success("Lien copié !");
                          handleAddAgent(null as any);
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-6 shrink-0"
                      >
                        Copier
                      </Button>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
                  <Shield size={16} className="text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-primary uppercase tracking-wider">Installation Automatique</p>
                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                      L'agent installera automatiquement <strong>Splashtop Enterprise</strong> et <strong>AnyDesk Enterprise</strong>. 
                      L'utilisateur devra accorder les permissions une seule fois lors de l'installation pour permettre un accès sans surveillance.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {installStep === 5 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 space-y-8"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping duration-1000" />
                    <div className="relative w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                      <Activity size={40} className="text-primary animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-foreground">Configuration terminée</h3>
                    <p className="text-sm text-muted-foreground font-medium max-w-[320px]">
                      L'installateur est prêt. Nous attendons maintenant que l'agent se connecte pour la première fois.
                    </p>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-6 space-y-4 border border-border shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Statut du déploiement</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-muted-foreground">Poste :</span>
                      <span className="text-primary">{newDevice.name || 'PC-HYPEREMOTE'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-muted-foreground">Client :</span>
                      <span className="text-primary">{newDevice.customer || 'Défaut'}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-primary w-2/3 animate-pulse" />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center italic mt-2">En attente de la première communication de l'agent...</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button 
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setInstallStep(1);
                    }}
                    variant="ghost"
                    className="text-slate-400 hover:text-brand-navy font-bold text-xs uppercase tracking-widest"
                  >
                    Fermer la fenêtre
                  </Button>
                </div>
              </motion.div>
            )}

            {installStep !== 5 && (
              <DialogFooter className="pt-4 border-t border-slate-50">
              <div className="flex items-center justify-between w-full">
                <Button 
                  variant="ghost" 
                  onClick={() => installStep > 1 ? setInstallStep(installStep - 1) : setIsAddDialogOpen(false)}
                  className="rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600"
                >
                  {installStep === 1 ? 'Annuler' : 'Retour'}
                </Button>
                {installStep < 4 && (
                  <Button 
                    onClick={() => setInstallStep(installStep + 1)}
                    disabled={
                      (installStep === 1 && !newDevice.os) ||
                      (installStep === 2 && !newDevice.customer) ||
                      (installStep === 3 && !newDevice.name)
                    }
                    className="bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-11 px-8 shadow-lg shadow-brand-navy/10"
                  >
                    Continuer
                  </Button>
                )}
              </div>
            </DialogFooter>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
