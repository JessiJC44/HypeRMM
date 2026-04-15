import * as React from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Ticketing } from './components/Ticketing';
import { Devices } from './components/Assets';
import { PatchManagement } from './components/PatchManagement';
import { SoftwareInventory } from './components/SoftwareInventory';
import { NetworkDiscovery } from './components/NetworkDiscovery';
import { SNMP } from './components/SNMP';
import { Alerts } from './components/Alerts';
import { Sites } from './components/Sites';
import { AppCenter } from './components/AppCenter';
import { KnowledgeBase } from './components/KnowledgeBase';
import { Reports } from './components/Reports';
import { ReferFriend } from './components/ReferFriend';
import { Admin } from './components/Admin';
import { AICenter } from './components/AICenter';
import { AgentDownload } from './components/AgentDownload';
import { TOTPSetup } from './components/TOTPSetup';
import { TOTPVerify } from './components/TOTPVerify';
import { EmailCodeVerify } from './components/EmailCodeVerify';
import { Toaster } from '@/components/ui/sonner';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Users, Menu, X, LogOut, Sparkles, Settings, Globe, Check } from 'lucide-react';
import { AnimatedCharactersLoginPage } from '@/components/ui/animated-characters-login-page';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useLanguage } from './contexts/LanguageContext';
import ExampleSwitch from '@/components/ui/switch-1';
import ThemeSwitch from '@/components/ui/theme-switch';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { ErrorBoundary } from './components/ErrorBoundary';
import { EmailVerificationScreen } from './components/EmailVerificationScreen';
import { RMMDashboard } from './components/RMMDashboard';

export default function App() {
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);
  const [isMfaVerified, setIsMfaVerified] = React.useState(false);
  const [authMethod, setAuthMethod] = React.useState<'google' | 'email' | null>(null);
  const [totpVerified, setTotpVerified] = React.useState(false);
  const [emailCodeVerified, setEmailCodeVerified] = React.useState(false);
  const [userTotpEnabled, setUserTotpEnabled] = React.useState<boolean | null>(null);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = React.useState(false);
  const { language, setLanguage, t } = useLanguage();

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Determine auth method
        const provider = firebaseUser.providerData[0]?.providerId;
        const method = provider === 'google.com' ? 'google' : 'email';
        setAuthMethod(method);
        
        // Check if TOTP is enabled for Google users
        if (method === 'google') {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          setUserTotpEnabled(userData?.totpEnabled || false);
        }
        
        // Reset verification states on new login
        setTotpVerified(false);
        setEmailCodeVerified(false);
      } else {
        setUser(null);
        setAuthMethod(null);
        setUserTotpEnabled(null);
        setTotpVerified(false);
        setEmailCodeVerified(false);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AnimatedCharactersLoginPage onLogin={() => {}} />
        <Toaster position="bottom-right" />
      </>
    );
  }

  // Google login flow
  if (authMethod === 'google') {
    if (userTotpEnabled === false) {
      // First time - setup TOTP
      return <TOTPSetup user={user} onComplete={() => {
        setUserTotpEnabled(true);
        setTotpVerified(true);
      }} />;
    }
    if (userTotpEnabled === true && !totpVerified) {
      // Returning user - verify TOTP
      return <TOTPVerify user={user} onVerified={() => setTotpVerified(true)} />;
    }
  }

  // Email login flow
  if (authMethod === 'email' && !emailCodeVerified) {
    return <EmailCodeVerify user={user} onVerified={() => setEmailCodeVerified(true)} />;
  }

  if (needsEmailVerification && user) {
    return <EmailVerificationScreen user={user} onVerified={() => setNeedsEmailVerification(false)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'rmm':
        return <RMMDashboard />;
      case 'agent-download':
        return <AgentDownload />;
      case 'tickets':
        return <Ticketing />;
      case 'assets':
        return <Devices />;
      case 'alerts':
        return <Alerts />;
      case 'sites':
        return <Sites />;
      case 'app-center':
        return <AppCenter />;
      case 'kb':
        return <KnowledgeBase />;
      case 'reports':
        return <Reports />;
      case 'refer':
        return <ReferFriend />;
      case 'ai-center':
        return <AICenter />;
      case 'admin':
        return <Admin />;
      case 'patches':
        return <PatchManagement />;
      case 'software':
        return <SoftwareInventory />;
      case 'network':
        return <NetworkDiscovery />;
      case 'snmp':
        return <SNMP />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] text-center p-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🚧</span>
            </div>
            <h2 className="text-2xl font-bold">Under Construction</h2>
            <p className="text-muted-foreground max-w-md mt-2">
              The {activeTab} module is currently being developed. Please check back soon!
            </p>
          </div>
        );
    }
  };

  return (
    <ErrorBoundary>
      <TooltipProvider>
      <div className="flex h-screen bg-background text-foreground font-sans antialiased overflow-hidden">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false);
          }} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          user={user}
        />
        
        {/* Mobile Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-40 lg:hidden"
            />
          )}
        </AnimatePresence>
        
        <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
          <header className="h-16 lg:h-20 border-b border-border bg-background/80 backdrop-blur-md flex-shrink-0 z-30 flex items-center justify-between px-4 lg:px-10 shadow-sm">
            <div className="flex items-center gap-3 lg:gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden p-2 hover:bg-accent rounded-lg text-foreground"
                  >
                    <Menu size={24} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Open Navigation Menu</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex flex-col">
                <h2 className="text-lg lg:text-xl font-bold text-foreground capitalize tracking-tight truncate max-w-[150px] lg:max-w-none">
                  {t(`nav.${activeTab}`)}
                </h2>
                <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
                  <span>HypeRemote</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span>{t('header.platform')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 lg:gap-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-brand-green/10 rounded-full border border-brand-green/20 cursor-help">
                    <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse shadow-[0_0_8px_rgba(118,186,27,0.6)]" />
                    <span className="text-xs font-bold text-brand-green uppercase tracking-wider">
                      {t('status.optimal')}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{t('status.optimal_desc')}</p>
                </TooltipContent>
              </Tooltip>
              <div className="hidden md:block">
                <ThemeSwitch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
              </div>
              <div className="hidden sm:block h-8 lg:h-10 w-[1px] bg-border" />
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <button 
                      className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue hover:bg-brand-blue/20 transition-colors outline-none"
                    >
                      <Users size={18} className="lg:hidden" />
                      <Users size={20} className="hidden lg:block" />
                    </button>
                  } />
                  <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-xl border-border bg-card p-2">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="px-2 py-1.5">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-bold text-foreground">{user.displayName || 'User'}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="my-1 bg-border/50" />
                      <DropdownMenuItem 
                        className="rounded-lg gap-2 cursor-pointer focus:bg-accent focus:text-brand-blue py-2"
                        onClick={() => setActiveTab('admin')}
                      >
                        <Settings size={16} />
                        <span className="font-semibold text-xs">{t('profile.settings')}</span>
                      </DropdownMenuItem>
                      
                      <div className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-accent transition-colors">
                        <div className="flex items-center gap-2">
                          <Globe size={16} className="text-muted-foreground" />
                          <span className="font-semibold text-xs text-foreground">{t('profile.language')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{language === 'fr' ? 'FR' : 'EN'}</span>
                          <ExampleSwitch 
                            checked={language === 'en'} 
                            onCheckedChange={(checked) => setLanguage(checked ? 'en' : 'fr')} 
                          />
                        </div>
                      </div>

                      <DropdownMenuSeparator className="my-1 bg-border/50" />
                      <DropdownMenuItem 
                        className="rounded-lg gap-2 cursor-pointer focus:bg-rose-50 text-rose-500 focus:text-rose-600 py-2"
                        onClick={() => auth.signOut()}
                      >
                        <LogOut size={16} />
                        <span className="font-black uppercase tracking-widest text-[10px]">{t('profile.logout')}</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <Toaster position="bottom-right" />
      </div>
    </TooltipProvider>
  </ErrorBoundary>
  );
}
