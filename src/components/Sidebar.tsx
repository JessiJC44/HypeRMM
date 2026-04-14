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
  Sparkles,
  LogOut,
  Menu,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useLanguage } from '../contexts/LanguageContext';
import { auth } from '@/src/lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  user?: FirebaseUser | null;
}

export function Sidebar({ activeTab, setActiveTab, isOpen, onClose, user }: SidebarProps) {
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
        if (error instanceof Error && error.message !== 'Failed to fetch') {
          console.error("Failed to fetch sidebar stats", error);
        }
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, description: 'Aperçu de la santé du système et des indicateurs clés.' },
    { id: 'tickets', label: t('nav.tickets'), icon: Ticket, description: 'Gérer et suivre les demandes de support informatique.' },
    { id: 'sites', label: t('nav.sites'), icon: Globe, description: 'Gérer les organisations clients et les emplacements.' },
    { id: 'assets', label: t('nav.assets'), icon: Monitor, description: 'Inventaire et gestion à distance de tous les terminaux.' },
    { id: 'alerts', label: t('nav.alerts'), icon: Bell, description: 'Notifications en temps réel des événements système critiques.', badge: alertCount > 0 ? alertCount.toString() : undefined },
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

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <>
      {/* Mobile hamburger button - handled in App.tsx but we can keep it here if needed */}
      
      {/* Sidebar container */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full bg-card border-r border-border z-40 transition-all duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-20" : "w-64",
          "lg:translate-x-0 lg:static lg:z-auto"
        )}
      >
        {/* Header with logo and collapse button */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30 h-20">
          <Logo collapsed={isCollapsed} />
          
          {/* Desktop collapse button */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex p-1.5 rounded-md hover:bg-accent transition-all duration-200 text-muted-foreground"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Mobile close button */}
          <button 
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-accent rounded-lg text-muted-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        {!isCollapsed && (
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-md text-sm placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto custom-scrollbar">
          <ul className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <li key={item.id}>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          "w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-md text-left transition-all duration-200 group relative",
                          isActive
                            ? "bg-brand-blue/10 text-brand-blue"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                          isCollapsed ? "justify-center px-2" : ""
                        )}
                      >
                        <div className="flex items-center justify-center min-w-[24px]">
                          <Icon
                            className={cn(
                              "h-5 w-5 flex-shrink-0",
                              isActive 
                                ? "text-brand-blue" 
                                : "text-muted-foreground group-hover:text-foreground"
                            )}
                          />
                        </div>
                        
                        {!isCollapsed && (
                          <div className="flex items-center justify-between w-full">
                            <span className={cn("text-sm", isActive ? "font-bold" : "font-medium")}>{item.label}</span>
                            {item.badge && (
                              <span className={cn(
                                "px-1.5 py-0.5 text-[10px] font-black rounded-full",
                                isActive
                                  ? "bg-brand-blue text-white"
                                  : "bg-rose-500 text-white"
                              )}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Badge for collapsed state */}
                        {isCollapsed && item.badge && (
                          <div className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-rose-500 border border-white">
                            <span className="text-[10px] font-bold text-white">
                              {parseInt(item.badge) > 9 ? '9+' : item.badge}
                            </span>
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" className="bg-slate-900 border-none text-white">
                        <p className="text-xs font-bold">{item.label}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section with profile and logout */}
        <div className="mt-auto border-t border-border">
          {/* Profile Section */}
          <div className={cn("border-b border-border bg-muted/20", isCollapsed ? 'py-3 px-2' : 'p-3')}>
            {!isCollapsed ? (
              <div className="flex items-center px-3 py-2 rounded-md bg-background border border-border shadow-sm">
                <div className="w-8 h-8 bg-brand-blue/10 rounded-full flex items-center justify-center overflow-hidden border border-brand-blue/20">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-brand-blue font-bold text-xs">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 ml-2.5">
                  <p className="text-sm font-bold text-foreground truncate">{user?.displayName || 'User'}</p>
                  <p className="text-[10px] text-muted-foreground truncate font-medium">{user?.email}</p>
                </div>
                <div className="w-2 h-2 bg-brand-green rounded-full ml-2 shadow-[0_0_8px_rgba(118,186,27,0.6)]" title="Online" />
              </div>
            ) : (
              <div className="flex justify-center">
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div className="relative cursor-help">
                      <div className="w-10 h-10 bg-brand-blue/10 rounded-full flex items-center justify-center overflow-hidden border border-brand-blue/20">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-brand-blue font-bold text-sm">
                            {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-brand-green rounded-full border-2 border-background shadow-sm" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-900 border-none text-white">
                    <p className="text-xs font-bold">{user?.displayName || user?.email}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="p-3">
            <button
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center rounded-md text-left transition-all duration-200 group",
                "text-rose-600 hover:bg-rose-50 hover:text-rose-700",
                isCollapsed ? "justify-center p-2.5" : "space-x-2.5 px-3 py-2.5"
              )}
              title={isCollapsed ? "Logout" : undefined}
            >
              <div className="flex items-center justify-center min-w-[24px]">
                <LogOut className="h-5 w-5 flex-shrink-0 text-rose-500 group-hover:text-rose-600" />
              </div>
              
              {!isCollapsed && (
                <span className="text-sm font-bold">Logout</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
