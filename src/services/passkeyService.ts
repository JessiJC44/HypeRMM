import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import { doc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { getAuthenticatorSelection } from '../utils/deviceDetector';

const getDeviceName = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Mac')) return 'Mac';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Linux')) return 'Linux';
  return 'Device';
};

export const passkeyService = {
  // Check if browser supports passkeys
  isSupported: async (): Promise<boolean> => {
    if (!browserSupportsWebAuthn()) {
      return false;
    }
    try {
      if (typeof window !== 'undefined' && 'PublicKeyCredential' in window) {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
    } catch (error) {
      console.error('Error checking for platform authenticator:', error);
      return false;
    }
    return false;
  },

  // Proactively check if Policies are blocking WebAuthn in iframes
  getPolicyStatus: (): { blocked: boolean; reason: string | null } => {
    if (typeof window === 'undefined') return { blocked: false, reason: null };
    
    const inIframe = window.self !== window.top;
    if (!inIframe) return { blocked: false, reason: null };

    const doc = document as any;
    if (doc.featurePolicy) {
      const createPolicy = doc.featurePolicy.allowsFeature('publickey-credentials-create');
      const getPolicy = doc.featurePolicy.allowsFeature('publickey-credentials-get');
      
      if (!createPolicy || !getPolicy) {
        return { 
          blocked: true, 
          reason: 'Iframe Permissions Policy explicitly blocks WebAuthn features.' 
        };
      }
    }

    // Even if allowsFeature returns true, actual browsers like Safari 
    // often block the operation if the iframe is cross-origin.
    return { blocked: false, reason: null };
  },

  // Check if user has registered passkeys
  hasPasskey: async (userId: string): Promise<boolean> => {
    try {
      const q = query(
        collection(db, 'passkeys'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking passkeys:', error);
      return false;
    }
  },

  // Get user's passkeys
  getUserPasskeys: async (userId: string): Promise<any[]> => {
    try {
      const q = query(
        collection(db, 'passkeys'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('Error fetching passkeys:', error);
      return [];
    }
  },

  // Register a new passkey for user (after they're logged in)
  registerPasskey: async (userId: string, email: string): Promise<boolean> => {
    try {
      // Generate registration options (Simplified for client-side demo)
      const challenge = crypto.randomUUID();
      const rpId = window.location.hostname;
      
      const registrationOptions: any = {
        challenge: btoa(challenge),
        rp: {
          name: 'HypeRemote',
          id: rpId,
        },
        user: {
          id: btoa(userId),
          name: email || userId,
          displayName: email && typeof email === 'string' ? email.split('@')[0] : userId.slice(0, 8),
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        timeout: 60000,
        attestation: 'none',
        authenticatorSelection: getAuthenticatorSelection(),
      };

      // Start registration (triggers Face ID / Touch ID)
      const credential = await startRegistration(registrationOptions);

      // Store credential in Firestore
      await setDoc(doc(db, 'passkeys', credential.id), {
        credentialId: credential.id,
        credentialPublicKey: credential.response.publicKey ?? null,
        credentialRawAttestation: (credential.response as any).attestationObject ?? null,
        credentialClientDataJSON: credential.response.clientDataJSON ?? null,
        counter: 0,
        userId,
        email: (email || '').toLowerCase(),
        createdAt: new Date().toISOString(),
        deviceName: getDeviceName(),
        transports: (credential.response as any).transports ?? [],
      });

      return true;
    } catch (error: any) {
      console.error('Passkey registration failed:', error);
      console.error('Error Name:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Code:', error.code || error.status);
      
      // Enhanced error normalization for consistency across components
      const errorName = error?.name || error?.code || '';
      const errorMessage = error?.message || String(error);

      if (errorName === 'SecurityError' || errorMessage.includes('Permissions Policy') || errorMessage.includes('feature is not enabled')) {
        console.error("CRITICAL: WebAuthn registration is blocked by Permissions Policy.");
        const normalizedError = new Error('Permissions Policy blocked WebAuthn');
        (normalizedError as any).name = 'SecurityError';
        throw normalizedError;
      }
      
      throw error;
    }
  },

  // Authenticate with passkey (for 2FA step)
  verifyWithPasskey: async (userId: string): Promise<boolean> => {
    try {
      // Get user's passkeys from Firestore
      const q = query(
        collection(db, 'passkeys'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return false;
      }

      const allowCredentials = snapshot.docs.map(doc => ({
        id: doc.data().credentialId,
        type: 'public-key' as const,
        transports: ['internal' as const],
      }));

      const challenge = crypto.randomUUID();

      const authenticationOptions: any = {
        challenge: btoa(challenge),
        timeout: 60000,
        rpId: window.location.hostname,
        allowCredentials,
        userVerification: 'required',
      };

      // Start authentication (triggers Face ID / Touch ID)
      const credential = await startAuthentication(authenticationOptions);

      // Find the matching passkey and update counter
      const passkeyDoc = snapshot.docs.find(doc => doc.data().credentialId === credential.id);
      
      if (passkeyDoc) {
        await setDoc(doc(db, 'passkeys', credential.id), {
          ...passkeyDoc.data(),
          counter: (passkeyDoc.data().counter || 0) + 1,
          lastUsed: new Date().toISOString(),
        }, { merge: true });

        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Passkey verification failed:', error);
      
      const errorName = error?.name || error?.code || '';
      const errorMessage = error?.message || String(error);

      if (errorName === 'SecurityError' || errorMessage.includes('Permissions Policy') || errorMessage.includes('feature is not enabled')) {
        console.error("CRITICAL: WebAuthn verification is blocked by Permissions Policy.");
        const normalizedError = new Error('Permissions Policy blocked WebAuthn');
        (normalizedError as any).name = 'SecurityError';
        throw normalizedError;
      }
      
      throw error;
    }
  },

  // Delete a passkey
  deletePasskey: async (credentialId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'passkeys', credentialId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'passkeys');
      throw error;
    }
  },
};
