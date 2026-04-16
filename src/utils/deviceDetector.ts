/**
 * Returns the appropriate biometric authentication method name
 * based on the user's current device/platform.
 */
export function getBiometricMethod(): string {
  if (typeof window === 'undefined' || !navigator) return 'Biometrics';
  
  const ua = navigator.userAgent;
  const platform = (navigator as any).platform || '';
  
  if (/iPhone|iPad|iPod/.test(ua)) return 'Face ID';
  if (/Mac/.test(platform) && !/iPhone|iPad/.test(ua)) return 'Touch ID';
  if (/Windows/.test(ua)) return 'Windows Hello';
  if (/Android/.test(ua)) return 'Fingerprint or Face Unlock';
  
  return 'Platform Authenticator';
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
