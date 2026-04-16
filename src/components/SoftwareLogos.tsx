import * as React from 'react';

// Flux logo (our remote desktop)
export const FluxLogo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#4F46E5"/>
    <path d="M20 20h24v6H26v6h12v6H26v12h-6V20z" fill="white"/>
  </svg>
);

// Slack
export const SlackLogo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#4A154B"/>
    <circle cx="22" cy="22" r="6" fill="#E01E5A"/>
    <circle cx="42" cy="22" r="6" fill="#36C5F0"/>
    <circle cx="22" cy="42" r="6" fill="#2EB67D"/>
    <circle cx="42" cy="42" r="6" fill="#ECB22E"/>
  </svg>
);

// Zoom
export const ZoomLogo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#2D8CFF"/>
    <rect x="16" y="22" width="20" height="20" rx="4" fill="white"/>
    <path d="M40 26l8-4v20l-8-4V26z" fill="white"/>
  </svg>
);

// Microsoft Teams
export const TeamsLogo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#5059C9"/>
    <circle cx="38" cy="20" r="8" fill="white"/>
    <rect x="14" y="24" width="28" height="24" rx="4" fill="white"/>
    <circle cx="48" cy="28" r="6" fill="#7B83EB"/>
  </svg>
);

// Chrome
export const ChromeLogo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <circle cx="32" cy="32" r="28" fill="#4285F4"/>
    <circle cx="32" cy="32" r="11" fill="white"/>
    <circle cx="32" cy="32" r="8" fill="#4285F4"/>
    <path d="M32 4a28 28 0 0124.2 14H32V4z" fill="#EA4335"/>
    <path d="M56.2 18A28 28 0 0120.1 56L32 32h24.2z" fill="#FBBC05"/>
    <path d="M20.1 56A28 28 0 017.8 18L32 32 20.1 56z" fill="#34A853"/>
  </svg>
);

// VS Code
export const VSCodeLogo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#007ACC"/>
    <path d="M44 12v40l-12-6V18l12-6z" fill="white"/>
    <path d="M12 20l20 12-20 12V20z" fill="white" fillOpacity="0.8"/>
  </svg>
);

// GitHub
export const GitHubLogo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#24292e"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M32 12C20.954 12 12 20.954 12 32c0 8.837 5.731 16.327 13.68 18.97.999.184 1.364-.434 1.364-.964 0-.476-.018-2.049-.027-3.716-5.563 1.208-6.737-2.354-6.737-2.354-.91-2.31-2.22-2.924-2.22-2.924-1.815-1.24.138-1.215.138-1.215 2.007.141 3.063 2.061 3.063 2.061 1.783 3.054 4.678 2.172 5.817 1.661.181-1.292.698-2.173 1.27-2.672-4.44-.505-9.108-2.22-9.108-9.876 0-2.182.78-3.966 2.058-5.365-.206-.504-.892-2.537.196-5.29 0 0 1.678-.537 5.497 2.049a19.16 19.16 0 015.003-.672c1.698.007 3.408.229 5.003.672 3.816-2.586 5.492-2.049 5.492-2.049 1.09 2.753.404 4.786.198 5.29 1.28 1.399 2.056 3.183 2.056 5.365 0 7.677-4.676 9.366-9.13 9.86.718.618 1.358 1.838 1.358 3.704 0 2.674-.024 4.832-.024 5.488 0 .534.361 1.156 1.374.961C46.274 48.32 52 40.834 52 32c0-11.046-8.954-20-20-20z" fill="white"/>
  </svg>
);

// Office 365
export const Office365Logo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#D83B01"/>
    <rect x="16" y="16" width="14" height="32" rx="2" fill="white"/>
    <rect x="34" y="22" width="14" height="20" rx="2" fill="white" fillOpacity="0.8"/>
  </svg>
);

// Dropbox
export const DropboxLogo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#0061FF"/>
    <path d="M32 16l-12 8 12 8-12 8 12 8 12-8-12-8 12-8-12-8z" fill="white"/>
  </svg>
);

// Notion
export const NotionLogo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="white" stroke="#E5E5E5"/>
    <rect x="18" y="14" width="28" height="36" rx="4" fill="black"/>
    <rect x="22" y="20" width="12" height="4" rx="1" fill="white"/>
    <rect x="22" y="28" width="20" height="2" rx="1" fill="white" fillOpacity="0.5"/>
    <rect x="22" y="34" width="16" height="2" rx="1" fill="white" fillOpacity="0.5"/>
    <rect x="22" y="40" width="18" height="2" rx="1" fill="white" fillOpacity="0.5"/>
  </svg>
);

// Figma
export const FigmaLogo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#1E1E1E"/>
    <circle cx="38" cy="32" r="8" fill="#1ABCFE"/>
    <rect x="22" y="16" width="16" height="16" rx="8" fill="#FF7262"/>
    <rect x="22" y="32" width="16" height="16" rx="8" fill="#A259FF"/>
    <path d="M22 48a8 8 0 008 8v-16h-8a8 8 0 000 16z" fill="#0ACF83"/>
    <path d="M22 16h8v16h-8a8 8 0 010-16z" fill="#F24E1E"/>
  </svg>
);

// Acronis
export const AcronisLogo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <circle cx="32" cy="32" r="28" fill="#003580"/>
    <path d="M32 12l16 32H16L32 12z" fill="white"/>
    <circle cx="32" cy="32" r="8" fill="#003580"/>
  </svg>
);

// Bitdefender
export const BitdefenderLogo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#ED1C24"/>
    <path d="M32 12c-8 0-14 4-14 12 0 12 14 28 14 28s14-16 14-28c0-8-6-12-14-12z" fill="white"/>
    <path d="M32 20l4 8h-8l4-8z" fill="#ED1C24"/>
  </svg>
);

// Chocolatey
export const ChocolateyLogo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#7B4216"/>
    <path d="M16 16h32v32H16V16z" fill="#1171B8"/>
    <path d="M24 24h16v16H24V24z" fill="white"/>
  </svg>
);

// Webroot
export const WebrootLogo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <circle cx="32" cy="32" r="28" fill="#00AEEF"/>
    <path d="M32 12c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm0 32c-6.6 0-12-5.4-12-12s5.4-12 12-12 12 5.4 12 12-5.4 12-12 12z" fill="white"/>
    <circle cx="32" cy="32" r="6" fill="#8DC63F"/>
  </svg>
);

// Generic app logo fallback (shows first letter)
export const GenericAppLogo = ({ size = 32, className = "", letter = "A" }: { size?: number; className?: string; letter?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#6366F1"/>
    <text x="32" y="40" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="system-ui">{letter}</text>
  </svg>
);

// Map of software names to logo components
export const softwareLogos: Record<string, React.FC<{ size?: number; className?: string }>> = {
  'flux': FluxLogo,
  'slack': SlackLogo,
  'zoom': ZoomLogo,
  'teams': TeamsLogo,
  'microsoft teams': TeamsLogo,
  'chrome': ChromeLogo,
  'google chrome': ChromeLogo,
  'vscode': VSCodeLogo,
  'visual studio code': VSCodeLogo,
  'github': GitHubLogo,
  'office': Office365Logo,
  'office 365': Office365Logo,
  'microsoft 365': Office365Logo,
  'dropbox': DropboxLogo,
  'notion': NotionLogo,
  'figma': FigmaLogo,
  'chocolatey': ChocolateyLogo,
  'webroot': WebrootLogo,
  'bitdefender': BitdefenderLogo,
  'acronis': AcronisLogo,
};

// Helper function to get logo by name
export const getSoftwareLogo = (name: string): React.FC<{ size?: number; className?: string }> => {
  const normalizedName = name.toLowerCase().trim();
  return softwareLogos[normalizedName] || (({ size, className }) => (
    <GenericAppLogo size={size} className={className} letter={name.charAt(0).toUpperCase()} />
  ));
};
