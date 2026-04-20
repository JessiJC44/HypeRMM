import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  RefreshCcw, 
  Shield, 
  Monitor, 
  Printer, 
  Server, 
  Smartphone, 
  Info, 
  Play, 
  X, 
  ChevronRight, 
  Clock, 
  Network, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  ArrowRight,
  Mail,
  MoreVertical,
  Activity,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  getProxyCandidates, 
  startNetworkScan, 
  getScans, 
  getScanDetails, 
  cancelScan, 
  sendInvitation 
} from '../services/networkDiscoveryService';

interface ScanResult {
  id: string;
  ipAddress: string;
  macAddress: string | null;
  hostname: string | null;
  osGuess: string | null;
  deviceType: 'computer' | 'printer' | 'router' | 'switch' | 'iot' | 'unknown';
  vendor: string | null;
  responseTimeMs: number | null;
  isManaged: boolean;
  discoveredAt: string;
  invitationSent: boolean;
  openPorts: number[];
}

interface ScanSession {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  proxyAgentName: string;
  subnet: string;
  startedAt: any;
  devicesFound: number;
}

export function NetworkDiscovery() {
  const { t } = useLanguage();
  const [scans, setScans] = useState<ScanSession[]>([]);
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [proxyCandidates, setProxyCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewScanModal, setShowNewScanModal] = useState(false);
  
  // New Scan Form State
  const [selectedProxy, setSelectedProxy] = useState<string>('');
  const [scanTypes, setScanTypes] = useState<string[]>(['ping', 'arp']);
  const [customSubnet, setCustomSubnet] = useState('');

  // Polling Interval Ref
  const pollingRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchInitialData();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [scansData, proxiesData] = await Promise.all([
        getScans(),
        getProxyCandidates()
      ]);
      setScans(scansData);
      setProxyCandidates(proxiesData);
      
      // If there's an active scan, start polling it
      const activeScan = scansData.find((s: any) => s.status === 'running' || s.status === 'pending');
      if (activeScan) {
        handleViewScan(activeScan.id);
      }
    } catch (error) {
      toast.error(t('common.error_loading') || "Failed to load network discovery data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartScan = async () => {
    if (!selectedProxy) {
      toast.error(t('network.select_proxy'));
      return;
    }

    try {
      const response = await startNetworkScan(selectedProxy, scanTypes, customSubnet || undefined);
      toast.success(t('network.scanning'));
      setShowNewScanModal(false);
      
      // Refresh scans list and trigger detail view
      const freshScans = await getScans();
      setScans(freshScans);
      handleViewScan(response.scanId);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleViewScan = async (scanId: string) => {
    setCurrentScanId(scanId);
    try {
      const { scan, results: scanResults } = await getScanDetails(scanId);
      setResults(scanResults);
      
      // Update scans list if status changed
      setScans(prev => prev.map(s => s.id === scanId ? scan : s));

      // Start polling if running
      if (scan.status === 'running' || scan.status === 'pending') {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(async () => {
          const detail = await getScanDetails(scanId);
          setResults(detail.results);
          setScans(prev => prev.map(s => s.id === scanId ? detail.scan : s));
          if (detail.scan.status !== 'running' && detail.scan.status !== 'pending') {
            if (pollingRef.current) clearInterval(pollingRef.current);
          }
        }, 3000);
      }
    } catch (error) {
      toast.error(t('common.error_details') || "Failed to fetch scan details");
    }
  };

  const handleCancelScan = async (scanId: string) => {
    try {
      await cancelScan(scanId);
      toast.info(t('network.scan_cancelled'));
      if (pollingRef.current) clearInterval(pollingRef.current);
      await fetchInitialData();
    } catch (error) {
      toast.error(t('common.error_cancel') || "Failed to cancel scan");
    }
  };

  const handleSendInvitation = async (resultId: string, email: string) => {
    try {
      await sendInvitation(resultId, email);
      toast.success(t('network.invitation_sent'));
      // Update results UI
      setResults(prev => prev.map(r => r.id === resultId ? { ...r, invitationSent: true } : r));
    } catch (error) {
      toast.error(t('common.error_invitation') || "Failed to send invitation");
    }
  };

  const activeScan = scans.find(s => s.id === currentScanId);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b bg-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">{t('network.title')}</h1>
            </div>
            <p className="text-muted-foreground text-sm max-w-2xl">
              {t('network.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button
              onClick={() => {
                if (proxyCandidates.length === 0) {
                  toast.error("Aucun agent proxy en ligne. Installez d'abord l'agent HypeRemote sur un appareil du réseau cible.");
                } else {
                  setShowNewScanModal(true);
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium shadow-md shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              {t('network.start_scan')}
            </button>
            <button 
              onClick={fetchInitialData}
              className="p-2.5 text-muted-foreground hover:bg-accent rounded-xl border border-border transition-colors"
            >
              <RefreshCcw className={cn("w-5 h-5", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {!isLoading && proxyCandidates.length === 0 && (
          <div className="max-w-7xl mx-auto px-6 pt-6">
            <div className="rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 p-8 flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Network className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Aucun agent proxy disponible</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Pour scanner un réseau, installez d'abord l'agent HypeRemote sur au moins un
                  appareil Windows, Linux ou macOS connecté à ce réseau. Cet appareil servira
                  de relais pour la découverte des autres appareils.
                </p>
              </div>
              <button
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('hyperemote:navigate', { detail: { tab: 'agent-download' } })
                  );
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Installer un agent
              </button>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Recent Scans Sidebar */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('network.scan_history')}
            </h2>
            <div className="flex flex-col gap-2">
              {scans.length === 0 ? (
                <div className="p-8 text-center bg-card rounded-2xl border border-dashed border-border text-muted-foreground text-sm">
                  {t('common.no_data') || "Aucun scan trouvé"}
                </div>
              ) : (
                scans.map((scan) => (
                  <button
                    key={scan.id}
                    onClick={() => handleViewScan(scan.id)}
                    className={cn(
                      "flex flex-col gap-1 p-3.5 rounded-2xl border text-left transition-all",
                      currentScanId === scan.id 
                        ? "bg-card border-indigo-500/40 shadow-sm ring-1 ring-indigo-500/10" 
                        : "bg-card/50 border-transparent hover:bg-card hover:border-border"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground truncate max-w-[120px]">
                        {scan.proxyAgentName}
                      </span>
                      <StatusBadge status={scan.status} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{scan.subnet || t('network.auto_detect')}</span>
                      <span className="flex items-center gap-1">
                        <Monitor className="w-3 h-3" />
                        {scan.devicesFound}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            {!activeScan ? (
              <div className="h-[500px] flex flex-col items-center justify-center text-center p-12 bg-card rounded-3xl border border-border shadow-sm group hover:border-indigo-500/40 transition-all cursor-pointer"
                   onClick={() => proxyCandidates.length > 0 ? setShowNewScanModal(true) : toast.error(t('network.no_proxy_available'))}>
                <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border-4 border-background shadow-sm group-hover:scale-110 transition-transform">
                  <Globe className="w-12 h-12 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">{t('network.empty_title')}</h3>
                <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed font-medium">
                  {t('network.empty_desc')}
                </p>
                <div className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none group-hover:bg-indigo-700 active:scale-95 transition-all">
                  <Plus className="w-4 h-4" />
                  {t('network.start_scan')}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Active Scan Header Card */}
                <div className="bg-card rounded-3xl border p-6 shadow-sm border-border">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        activeScan.status === 'completed' ? "bg-green-500/10" : "bg-primary/10"
                      )}>
                        {activeScan.status === 'completed' ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        ) : activeScan.status === 'running' ? (
                          <Activity className="w-6 h-6 text-primary animate-pulse" />
                        ) : (
                          <Clock className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          {t('network.proxy_agent')}: {activeScan.proxyAgentName}
                          <StatusBadge status={activeScan.status} />
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <Network className="w-4 h-4" />
                            {activeScan.subnet || t('network.auto_detect')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Search className="w-4 h-4" />
                            {t('network.results_count')}: {activeScan.devicesFound}
                          </span>
                        </div>
                      </div>
                    </div>
                    {['pending', 'running'].includes(activeScan.status) && (
                      <button 
                        onClick={() => handleCancelScan(activeScan.id)}
                        className="px-4 py-2 text-destructive hover:bg-destructive/10 rounded-xl text-sm font-medium transition-colors"
                      >
                        {t('network.cancel_scan')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Results Table */}
                <div className="bg-card rounded-3xl border shadow-sm border-border overflow-hidden">
                  <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{t('nav.assets')}</h3>
                    <span className="text-xs font-medium text-muted-foreground bg-card px-2.5 py-1 rounded-full border border-border shadow-sm">
                      {results.length} {t('network.results_count')}
                    </span>
                  </div>
                  
                  {results.length === 0 ? (
                    <div className="p-16 text-center text-muted-foreground">
                      <div className="mb-4 inline-flex items-center justify-center w-12 h-12 bg-muted rounded-full">
                        <Monitor className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="py-4 space-y-4">
                        <p className="text-muted-foreground font-medium">{t('network.no_devices_found')}</p>
                        {activeScan.status === 'running' ? (
                          <p className="text-sm mt-1 animate-pulse text-primary font-bold uppercase tracking-widest">{t('network.scanning')}</p>
                        ) : (
                          <div className="flex flex-col items-center gap-4 mt-2">
                            <p className="text-[10px] text-muted-foreground max-w-[250px] mx-auto leading-relaxed">
                              Aucun agent proxy n'est actuellement en ligne pour cette zone. Assurez-vous qu'au moins un appareil avec l'agent est connecté.
                            </p>
                            <button 
                              onClick={() => {
                                setShowNewScanModal(false);
                                window.dispatchEvent(new CustomEvent('nav-to-assets'));
                              }}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-lg"
                            >
                              Gérer les agents
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">
                            <th className="px-6 py-4">{t('common.device') || "Appareil"}</th>
                            <th className="px-6 py-4">IP / MAC</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {results.map((device) => (
                            // @ts-ignore - key prop is handled by React but TS is being pedantic
                            <ResultRow 
                              key={device.id} 
                              device={device} 
                              onInvite={(email) => handleSendInvitation(device.id, email)}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Scan Modal */}
      <AnimatePresence>
        {showNewScanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowNewScanModal(false)}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card rounded-3xl shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                <h2 className="text-xl font-bold text-foreground tracking-tight">{t('network.start_scan')}</h2>
                <button onClick={() => setShowNewScanModal(false)} className="p-2 hover:bg-accent rounded-lg transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Proxy Agent Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">{t('network.proxy_agent')}</label>
                  <select 
                    value={selectedProxy}
                    onChange={(e) => setSelectedProxy(e.target.value)}
                    className="w-full p-3 bg-muted border border-border rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">{t('network.select_proxy')}</option>
                    {proxyCandidates.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.ip})</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 px-1">
                    <Info className="w-3 h-3 text-indigo-500" />
                    {t('network.empty_desc')}
                  </p>
                </div>

                {/* Subnet Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">{t('network.custom_subnet')}</label>
                  <input 
                    type="text"
                    placeholder="ex: 192.168.1.0/24"
                    value={customSubnet}
                    onChange={(e) => setCustomSubnet(e.target.value)}
                    className="w-full p-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-muted-foreground/50"
                  />
                  <p className="text-[11px] text-muted-foreground px-1">{t('network.auto_detect')}</p>
                </div>

                {/* Scan Types */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">{t('network.scan_types')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'ping', label: t('network.ping_sweep'), desc: 'ICMP scan' },
                      { id: 'arp', label: t('network.arp_lookup'), desc: 'Couche 2 LAN' },
                      { id: 'mdns', label: t('network.mdns_discovery'), desc: 'Identité Apple' },
                      { id: 'portscan', label: t('network.port_scan'), desc: 'Common Ports' }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setScanTypes(prev => 
                          prev.includes(type.id) ? prev.filter(t => t !== type.id) : [...prev, type.id]
                        )}
                        className={cn(
                          "flex flex-col items-start p-3 rounded-xl border text-left transition-all",
                          scanTypes.includes(type.id) 
                            ? "border-indigo-600 bg-indigo-500/10 ring-1 ring-indigo-600" 
                            : "border-border bg-muted/50 hover:border-muted-foreground/30"
                        )}
                      >
                        <span className={cn("text-xs font-bold", scanTypes.includes(type.id) ? "text-indigo-600 dark:text-indigo-400" : "text-foreground")}>
                          {type.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{type.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-muted/30 border-t border-border flex items-center justify-end gap-3">
                <button 
                  onClick={() => setShowNewScanModal(false)}
                  className="px-5 py-2.5 text-muted-foreground font-medium hover:bg-accent rounded-xl transition-colors"
                >
                  {t('network.cancel_scan')}
                </button>
                <button 
                  onClick={handleStartScan}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 dark:shadow-none hover:bg-primary/90 active:scale-95 transition-all"
                >
                  {t('network.start_scan')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    running: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    completed: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    failed: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    cancelled: 'bg-muted text-muted-foreground border-border',
  }[status] || 'bg-muted text-muted-foreground';

  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase", styles)}>
      {status}
    </span>
  );
}

function ResultRow(props: { device: ScanResult, onInvite: (email: string) => void | Promise<void>, key?: string | number }) {
  const { device, onInvite } = props;
  const { t } = useLanguage();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [email, setEmail] = useState('');

  const DeviceIcon = {
    computer: Monitor,
    printer: Printer,
    router: Network,
    switch: Server,
    iot: Smartphone,
    unknown: Info
  }[device.deviceType] || Info;

  return (
    <tr className="group hover:bg-muted/30 transition-colors">
      <td className="px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-card group-hover:shadow-sm transition-all border border-transparent group-hover:border-border">
              <DeviceIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-medium text-foreground">
                {device.hostname || t('common.unknown')}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                {device.vendor && <span>{device.vendor}</span>}
                {device.osGuess && (
                  <>
                    <span className="w-1 h-1 bg-border rounded-full" />
                    <span>{device.osGuess}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col gap-0.5">
            <code className="text-[12px] font-mono font-medium text-primary">
              {device.ipAddress}
            </code>
            <code className="text-[10px] font-mono text-muted-foreground">
              {device.macAddress || 'N/A'}
            </code>
          </div>
      </td>
      <td className="px-6 py-4">
        {device.isManaged ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold border border-green-500/20">
            <Shield className="w-3.5 h-3.5" />
            {t('network.managed')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-semibold border border-border">
            {t('network.unmanaged')}
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        {!device.isManaged ? (
          <div className="flex items-center justify-end gap-2">
            {device.invitationSent ? (
              <span className="text-[11px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1 pr-2">
                <Mail className="w-3.5 h-3.5" />
                {t('common.invited')}
              </span>
            ) : (
              <button 
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-all active:scale-95"
              >
                {t('network.manage_device')}
              </button>
            )}
            <button className="p-1.5 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-muted rounded-lg transition-all">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-500/20 transition-all">
            {t('common.dashboard')}
          </button>
        )}

        {/* Invite Dialog */}
        <AnimatePresence>
          {showInviteModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowInviteModal(false)}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl p-6 border border-border"
              >
                <h4 className="text-lg font-bold text-foreground mb-2">{t('network.install_agent')}</h4>
                <p className="text-sm text-muted-foreground mb-6">
                  {t('network.install_agent_desc')}
                </p>
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">{t('common.email')}</label>
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full p-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowInviteModal(false)}
                      className="flex-1 py-2.5 text-muted-foreground text-sm font-bold hover:bg-accent rounded-xl transition-all"
                    >
                      {t('common.close')}
                    </button>
                    <button 
                      onClick={() => onInvite(email)}
                      className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all"
                    >
                      {t('common.send')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </td>
    </tr>
  );
}
