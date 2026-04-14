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

export function Assets() {
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [selectedDevice, setSelectedDevice] = React.useState<Device | null>(null);
  const [installStep, setInstallStep] = React.useState(1);
  const [installTab, setInstallTab] = React.useState('download');
  const [newDevice, setNewDevice] = React.useState({
    name: '',
    type: 'workstation',
    os: 'Windows',
    arch: 'x64',
    customer: '',
    ip: '192.168.1.' + Math.floor(Math.random() * 254),
    anydeskId: '',
    splashtopId: ''
  });

  const [customerSearch, setCustomerSearch] = React.useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = React.useState(false);
  const [remoteTool, setRemoteTool] = React.useState<'splashtop' | 'anydesk'>('splashtop');

  const REMOTE_LOGOS = {
    splashtop: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/Splashtop_Logo.svg/200px-Splashtop_Logo.svg.png",
    anydesk: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/AnyDesk_Logo.svg/200px-AnyDesk_Logo.svg.png"
  };

  const customers = ['Pescespada Island', 'Acme Corp', 'Global Logistics', 'Nexus IT', 'Tech Solutions', 'Starlight Inc', 'Enterprise Alpha', 'Beta Systems', 'Gamma Solutions', 'Delta Services'];

  const [filterQuery, setFilterQuery] = React.useState('');

  const handleAIFilter = () => {
    if (!filterQuery.trim()) {
      toast.info("Décrivez ce que vous cherchez (ex: 'serveurs hors ligne')");
      return;
    }
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Analyse IA en cours...',
        success: `Filtre IA appliqué pour: "${filterQuery}"`,
        error: 'Erreur lors de l\'analyse IA',
      }
    );
  };

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/devices');
      const data = await res.json();
      setDevices(data);
    } catch (error) {
      console.error("Failed to fetch devices", error);
      toast.error("Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDevices();
  }, []);

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDevice,
          lastSeen: new Date().toISOString(),
          status: 'online',
          splashtopId: 'ST-' + Math.random().toString(36).substring(2, 8).toUpperCase()
        })
      });
      if (res.ok) {
        toast.success("Agent installed successfully! Splashtop Enterprise is ready.");
        setIsAddDialogOpen(false);
        setInstallStep(1);
        setNewDevice({
          name: '',
          type: 'workstation',
          os: 'Windows',
          customer: '',
          ip: '192.168.1.' + Math.floor(Math.random() * 254),
          anydeskId: '',
          splashtopId: ''
        });
        fetchDevices();
      }
    } catch (error) {
      toast.error("Failed to register agent");
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
    <div className="space-y-0 min-h-screen bg-white animate-in fade-in duration-500">
      {/* Top Bar - Atera Style */}
      <div className="bg-white border-b px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-medium text-slate-800">Appareils</h1>
          <div className="flex items-center gap-1 text-slate-500 text-sm cursor-pointer hover:text-slate-800 transition-colors">
            <span>Vue par défaut</span>
            <ChevronDown size={14} />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button size="sm" className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md h-9 px-4 gap-2 text-sm font-normal shadow-sm">
            <Plus size={16} />
            Nouvel appareil
            <ChevronDown size={14} />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Bell size={18} />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Settings2 size={18} />
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-navy flex items-center justify-center text-white text-xs font-bold">
              S
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="px-4 lg:px-6 py-4 flex flex-col gap-4 border-b">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[300px] max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder="Décrivez ce que vous voulez filtrer" 
              className="pl-10 h-10 border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-brand-blue/30 font-normal text-sm" 
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAIFilter()}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Info size={14} className="text-slate-300" />
              <div className="h-4 w-[1px] bg-slate-200 mx-1" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-4 bg-slate-200 rounded-full relative cursor-pointer">
                  <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 px-3 gap-2 text-xs font-medium border-slate-200 rounded-md hover:bg-slate-50"
                  onClick={handleAIFilter}
                >
                  <Sparkles size={12} className="text-brand-blue" />
                  Demander
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 px-4 gap-2 text-sm font-normal border-slate-200 rounded-md">
              <Building2 size={16} className="text-slate-400" />
              Sites
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-4 gap-2 text-sm font-normal border-slate-200 rounded-md">
              <Star size={16} className="text-slate-400" />
              Favori
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-4 gap-2 text-sm font-normal border-slate-200 rounded-md">
              <Filter size={16} className="text-slate-400" />
              Filtres
            </Button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 overflow-x-auto pb-1 no-scrollbar">
            <div className="flex items-center gap-1">
              <input type="checkbox" className="rounded border-slate-300 mr-2" />
            </div>
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-2 text-xs font-normal text-slate-400 hover:text-slate-600 hover:bg-transparent disabled:opacity-50" disabled>
              <Terminal size={14} />
              Exécuter un script
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-2 text-xs font-normal text-slate-400 hover:text-slate-600 hover:bg-transparent disabled:opacity-50" disabled>
              <Shield size={14} />
              Assigner un profil d'automatisation
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-2 text-xs font-normal text-slate-400 hover:text-slate-600 hover:bg-transparent disabled:opacity-50" disabled>
              <DownloadCloud size={14} />
              Installation du logiciel
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-2 text-xs font-normal text-slate-400 hover:text-slate-600 hover:bg-transparent disabled:opacity-50" disabled>
              <Activity size={14} />
              Assigner un profil de seuil
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-1 text-slate-400">
              <MoreVertical size={14} />
            </Button>
          </div>
          <div className="text-[11px] text-slate-400 font-normal">
            Nombre d'appareils affichés : {devices.length} sur {devices.length}
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="overflow-x-auto">
        <Table className="border-collapse">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-slate-100">
              <TableHead className="w-[40px] px-4">
                <input type="checkbox" className="rounded border-slate-300" />
              </TableHead>
              <TableHead className="text-[11px] font-medium text-slate-500 py-3 whitespace-nowrap">Appareil</TableHead>
              <TableHead className="text-[11px] font-medium text-slate-500 py-3 whitespace-nowrap">IA</TableHead>
              <TableHead className="text-[11px] font-medium text-slate-500 py-3 whitespace-nowrap">Dernière connexion</TableHead>
              <TableHead className="text-[11px] font-medium text-slate-500 py-3 whitespace-nowrap">Disponibilité</TableHead>
              <TableHead className="text-[11px] font-medium text-slate-500 py-3 whitespace-nowrap">Type d'ap...</TableHead>
              <TableHead className="text-[11px] font-medium text-slate-500 py-3 whitespace-nowrap">Site</TableHead>
              <TableHead className="text-[11px] font-medium text-slate-500 py-3 whitespace-nowrap">Dossi...</TableHead>
              <TableHead className="text-[11px] font-medium text-slate-500 py-3 whitespace-nowrap">Alertes</TableHead>
              <TableHead className="text-[11px] font-medium text-slate-500 py-3 whitespace-nowrap">Correctifs dispo...</TableHead>
              <TableHead className="text-[11px] font-medium text-slate-500 py-3 whitespace-nowrap">Redémarrage...</TableHead>
              <TableHead className="text-[11px] font-medium text-slate-500 py-3 whitespace-nowrap">Accès à dista...</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={13} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
                    <span className="text-sm text-slate-400 font-medium">Chargement des appareils...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-300">
                    <Monitor size={48} strokeWidth={1} />
                    <p className="text-sm font-medium">Aucun appareil trouvé</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              devices.map((device, index) => (
                <TableRow 
                  key={device.id}
                  className="hover:bg-slate-50 transition-colors border-b border-slate-50 group"
                >
                  <TableCell className="px-4">
                    <input type="checkbox" className="rounded border-slate-300" />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span 
                        onClick={() => setSelectedDevice(device)}
                        className="font-bold text-slate-800 text-sm cursor-pointer hover:text-brand-blue transition-colors"
                      >
                        {device.name}
                      </span>
                      <Star size={14} className="text-slate-300 hover:text-amber-400 cursor-pointer transition-colors" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-8 h-8 rounded-md flex items-center justify-center text-slate-300 hover:text-brand-blue hover:bg-brand-blue/5 transition-all cursor-pointer">
                      <Sparkles size={14} />
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="text-xs text-slate-500">
                      Administrateur (avr. 13, 2026 09:25)
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", device.status === 'online' ? 'bg-brand-green' : 'bg-rose-500')} />
                      <span className="text-xs text-slate-600">{device.status === 'online' ? 'En ligne' : 'Hors ligne'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="text-xs text-slate-600">{device.type === 'server' ? 'Serveur' : 'PC'}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="text-xs text-brand-blue hover:underline cursor-pointer">
                      {device.customer || 'Site par défaut'}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="text-xs text-slate-500">FluxI...</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-[10px] font-bold text-rose-600">1</div>
                      <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-600">0</div>
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">0</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="px-3 py-1 rounded-full bg-blue-50 text-brand-blue text-[10px] font-bold border border-blue-100 inline-flex items-center justify-center min-w-[30px]">
                      {Math.floor(Math.random() * 25)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-slate-300">
                      <RefreshCw size={14} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <DropdownMenu>
                        <div className="flex items-center bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm hover:border-brand-blue/30 transition-all">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 rounded-none border-r border-slate-100 hover:bg-brand-blue/5"
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
                                className="h-8 w-6 px-0 rounded-none hover:bg-slate-50"
                              >
                                <ChevronDown size={12} className="text-slate-400" />
                              </Button>
                            }
                          />
                        </div>
                        <DropdownMenuContent align="end" className="w-40 bg-white border-slate-200">
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                      <MoreVertical size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
