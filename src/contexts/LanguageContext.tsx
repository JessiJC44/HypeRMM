import * as React from 'react';

type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  fr: {
    'nav.dashboard': 'Tableau de bord',
    'nav.tickets': 'Tickets',
    'nav.assets': 'Appareils',
    'nav.alerts': 'Alertes',
    'nav.sites': 'Sites',
    'nav.app-center': 'App Center',
    'nav.kb': 'Base de connaissances',
    'nav.reports': 'Rapports',
    'nav.refer': 'Parrainer un ami',
    'nav.ai-center': 'Centre IA',
    'nav.admin': 'Administration',
    'nav.patches': 'Gestion des patchs',
    'nav.software': 'Inventaire logiciel',
    'nav.network': 'Découverte réseau',
    'nav.snmp': 'SNMP',
    'profile.settings': 'Paramètres',
    'profile.language': 'Langue',
    'profile.logout': 'Déconnexion',
    'status.optimal': 'Système Optimal',
    'status.optimal_desc': 'Tous les systèmes sont opérationnels. Aucun problème critique détecté.',
    'header.platform': 'Plateforme',
    'login.title': 'Connexion',
    'common.search': 'Rechercher...',
    'dashboard.title': 'Tableau de bord',
    'dashboard.subtitle': 'Aperçu de votre infrastructure informatique et de la file d\'attente du support.',
    'dashboard.generate_report': 'Générer un rapport',
    'dashboard.open_tickets': 'Tickets Ouverts',
    'dashboard.managed_devices': 'Appareils Gérés',
    'dashboard.active_alerts': 'Alertes Actives',
    'dashboard.sla_compliance': 'Conformité SLA',
    'dashboard.vs_last': 'vs période précédente',
    'dashboard.performance': 'Performance du Service',
    'dashboard.performance_desc': 'Volume de tickets vs alertes système sur les 7 derniers jours.',
    'dashboard.critical_alerts': 'Alertes Critiques',
    'dashboard.attention_required': 'Attention immédiate requise',
    'dashboard.view_all_alerts': 'Voir toutes les alertes',
  },
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.tickets': 'Tickets',
    'nav.assets': 'Devices',
    'nav.alerts': 'Alerts',
    'nav.sites': 'Sites',
    'nav.app-center': 'App Center',
    'nav.kb': 'Knowledge Base',
    'nav.reports': 'Reports',
    'nav.refer': 'Refer a Friend',
    'nav.ai-center': 'AI Center',
    'nav.admin': 'Admin',
    'nav.patches': 'Patch Management',
    'nav.software': 'Software Inventory',
    'nav.network': 'Network Discovery',
    'nav.snmp': 'SNMP',
    'profile.settings': 'Settings',
    'profile.language': 'Language',
    'profile.logout': 'Logout',
    'status.optimal': 'System Optimal',
    'status.optimal_desc': 'All systems are operational. No critical issues detected.',
    'header.platform': 'Platform',
    'login.title': 'Login',
    'common.search': 'Search...',
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Overview of your IT infrastructure and support queue.',
    'dashboard.generate_report': 'Generate Report',
    'dashboard.open_tickets': 'Open Tickets',
    'dashboard.managed_devices': 'Managed Devices',
    'dashboard.active_alerts': 'Active Alerts',
    'dashboard.sla_compliance': 'SLA Compliance',
    'dashboard.vs_last': 'vs last period',
    'dashboard.performance': 'Service Performance',
    'dashboard.performance_desc': 'Ticket volume vs System alerts over the last 7 days.',
    'dashboard.critical_alerts': 'Critical Alerts',
    'dashboard.attention_required': 'Immediate attention required',
    'dashboard.view_all_alerts': 'View All Alerts',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = React.useState<Language>('fr');

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
