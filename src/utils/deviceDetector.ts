/**
 * Returns the appropriate biometric authentication method name
 * based on the user's current device/platform.
 */
export function getBiometricMethod(): string {
  if (typeof window === 'undefined' || !navigator) return 'Biometrics';
  
  const ua = navigator.userAgent;
  const platform = (navigator as any).platform || '';
  
  // iPads in Desktop mode (iPadOS) often report themselves as MacIntel
  // We check for maxTouchPoints to distinguish between a real Mac and an iPad
  const isIPad = /iPad/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isIPhone = /iPhone|iPod/.test(ua);
  const isMac = /Mac/.test(platform) && !isIPad && !isIPhone;
  
  if (isIPhone) {
    // Modern iPhones (X and later) use Face ID
    return 'Face ID';
  }
  
  if (isIPad) {
    // Heuristic for Face ID vs Touch ID on iPad
    const w = window.screen.width;
    const h = window.screen.height;
    const maxDim = Math.max(w, h);
    
    // Modern iPad Pro (Face ID only) resolutions (logic points)
    // 11-inch: 1194, 1210
    // 12.9-inch / 13-inch: 1366, 1376
    const faceIdOnlyModels = [1194, 1210, 1366, 1376];
    
    if (faceIdOnlyModels.includes(maxDim)) {
      return 'Face ID';
    }
    
    // Default to Touch ID for Air, Mini and entry-level iPads 
    // (which have Touch ID via Top button or Home button)
    return 'Touch ID';
  }
  
  if (isMac) return 'Touch ID';
  if (/Windows/.test(ua)) return 'Windows Hello';
  if (/Android/.test(ua)) return 'Biométrie Android';
  
  return 'Authentification Biométrique';
}

/**
 * Returns platform-specific authenticator selection hints
 * for WebAuthn registration.
 */
export function getAuthenticatorSelection() {
  if (typeof window === 'undefined' || !navigator) {
    return {
      authenticatorAttachment: 'platform' as const,
      userVerification: 'required' as const,
      residentKey: 'required' as const,
    };
  }

  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  
  return {
    authenticatorAttachment: 'platform' as const,
    userVerification: 'required' as const,
    residentKey: 'required' as const,
    // iOS-specific optimization (optional)
    requireResidentKey: isIOS ? true : undefined,
  };
}
