import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import { doc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { getAuthenticatorSelection } from '../utils/deviceDetector';

export const passkeyService = {
  // Check if browser supports passkeys
  isSupported: async (): Promise<boolean> => {
    if (!browserSupportsWebAuthn()) {
      console.log('WebAuthn support: Basic support missing');
      return false;
    }
    try {
      if (typeof window !== 'undefined' && 'PublicKeyCredential' in window) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        console.log('WebAuthn platform available:', available);
        
        // Detect if we are in an iframe
        const inIframe = window.self !== window.top;
        if (inIframe) {
          console.log('WebAuthn: Running in iframe, checking Permissions Policy...');
          // Feature Policy (older Chromium) or Permissions Policy
          const doc = document as any;
          if (doc.featurePolicy) {
            const createPolicy = doc.featurePolicy.allowsFeature('publickey-credentials-create');
            const getPolicy = doc.featurePolicy.allowsFeature('publickey-credentials-get');
            console.log('WebAuthn Policy: create=', createPolicy, 'get=', getPolicy);
            
            // If the policy explicitly denies it, we know it will fail
            if (!createPolicy || !getPolicy) {
              console.warn('WebAuthn is BLOCKED by iframe Permissions Policy');
            }
          }
        }
        
        return available;
      }
    } catch (error) {
      console.error('Error checking for platform authenticator:', error);
      return false;
    }
    console.log('WebAuthn support: PublicKeyCredential not in window');
    return false;
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
        credentialPublicKey: credential.response.publicKey,
        counter: 0,
        userId,
        email: email.toLowerCase(),
        createdAt: new Date().toISOString(),
        deviceName: navigator.userAgent.includes('Mac') ? 'Mac' : 
                    navigator.userAgent.includes('iPhone') ? 'iPhone' :
                    navigator.userAgent.includes('iPad') ? 'iPad' :
                    navigator.userAgent.includes('Windows') ? 'Windows' : 'Device',
      });

      return true;
    } catch (error: any) {
      console.error('Passkey registration failed:', error);
      
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
