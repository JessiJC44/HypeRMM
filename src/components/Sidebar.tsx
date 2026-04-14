import * as React from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  Monitor, 
  Bell, 
  Settings, 
  Users, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Globe,
  AppWindow,
  Search,
  BookOpen,
  BarChart3,
  Gift,
  Lock,
  Package,
  Activity,
  X,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ activeTab, setActiveTab, isOpen, onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [alertCount, setAlertCount] = React.useState(0);
  const { t } = useLanguage();

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setAlertCount(data.activeAlerts || 0);
      } catch (error) {
        // Only log if it's not a transient network error during dev reload
        if (error instanceof Error && error.message !== 'Failed to fetch') {
          console.error("Failed to fetch sidebar stats", error);
        }
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, description: 'Aperçu de la santé du système et des indicateurs clés.' },
    { id: 'tickets', label: t('nav.tickets'), icon: Ticket, description: 'Gérer et suivre les demandes de support informatique.' },
    { id: 'sites', label: t('nav.sites'), icon: Globe, description: 'Gérer les organisations clients et les emplacements.' },
    { id: 'assets', label: t('nav.assets'), icon: Monitor, description: 'Inventaire et gestion à distance de tous les terminaux.' },
    { id: 'alerts', label: t('nav.alerts'), icon: Bell, description: 'Notifications en temps réel des événements système critiques.' },
    { id: 'patches', label: t('nav.patches'), icon: ShieldCheck, description: 'Mises à jour automatisées du système d\'exploitation et des logiciels tiers.' },
    { id: 'software', label: t('nav.software'), icon: Package, description: 'Suivre les logiciels installés et la conformité des licences.' },
    { id: 'app-center', label: t('nav.app-center'), icon: AppWindow, description: 'Intégrations et place de marché pour les outils tiers.' },
    { id: 'network', label: t('nav.network'), icon: Search, description: 'Scanner et cartographier les appareils sur le réseau local.' },
    { id: 'snmp', label: t('nav.snmp'), icon: Activity, description: 'Surveiller le matériel réseau via le protocole SNMP.' },
    { id: 'kb', label: t('nav.kb'), icon: BookOpen, description: 'Documentation interne et guides de dépannage.' },
    { id: 'reports', label: t('nav.reports'), icon: BarChart3, description: 'Générer des analyses détaillées et des rapports de conformité.' },
    { id: 'refer', label: t('nav.refer'), icon: Gift, description: 'Partagez HypeRemote et gagnez des récompenses.' },
    { id: 'ai-center', label: t('nav.ai-center'), icon: Sparkles, description: 'Fonctionnalités et insights propulsés par l\'intelligence artificielle.' },
    { id: 'admin', label: t('nav.admin'), icon: Lock, description: 'Paramètres globaux de la plateforme et permissions des utilisateurs.' },
  ];

  return (
    <div className={cn(
      "bg-brand-navy text-white transition-all duration-300 ease-in-out min-h-screen fixed lg:relative z-50",
      isCollapsed ? "w-20" : "w-64",
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      <div className="flex flex-col h-screen lg:sticky lg:top-0">
        <div className="flex h-16 lg:h-20 items-center px-4 mb-4 justify-between">
          <Logo collapsed={isCollapsed} />
          <button 
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <nav className="grid gap-1 px-2">
            {menuItems.map((item) => (
              <Tooltip key={item.id} delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-3 h-11 transition-all rounded-xl relative group w-full",
                      activeTab === item.id 
                        ? "bg-white/10 text-white shadow-sm" 
                        : "text-slate-400 hover:bg-white/5 hover:text-white",
                      isCollapsed ? "justify-center px-0" : "px-4"
                    )}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <item.icon size={20} className={cn(
                      "transition-colors",
                      activeTab === item.id ? "text-brand-blue" : "group-hover:text-brand-green"
                    )} />
                    {item.id === 'alerts' && alertCount > 0 && (
                      <div className={cn(
                        "absolute flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-brand-navy",
                        isCollapsed ? "top-1 right-1 w-5 h-5" : "left-7 top-2 w-5 h-5"
                      )}>
                        {alertCount}
                      </div>
                    )}
                    {!isCollapsed && (
                      <span className={cn(
                        "text-[14px] font-semibold transition-colors",
                        activeTab === item.id ? "text-white" : ""
                      )}>
                        {item.label}
                      </span>
                    )}
                    {activeTab === item.id && !isCollapsed && (
                      <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-brand-green shadow-[0_0_8px_rgba(118,186,27,0.6)]" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side={isCollapsed ? "right" : "bottom"} className="bg-brand-navy border-white/10 text-white max-w-[200px]">
                  <div className="space-y-1">
                    <p className="font-bold text-brand-blue">{item.label}</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{item.description}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </nav>
        </div>

        <div className="hidden lg:block p-4 border-t border-white/10">
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full flex items-center justify-center h-10 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
              >
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-brand-navy border-white/10 text-white">
              <p className="text-[11px] font-bold">{isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
