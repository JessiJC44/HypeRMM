import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import { doc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export const passkeyService = {
  // Check if browser supports passkeys
  isSupported: (): boolean => {
    return browserSupportsWebAuthn();
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
      
      const registrationOptions: any = {
        challenge: btoa(challenge),
        rp: {
          name: 'HypeRemote',
          id: window.location.hostname,
        },
        user: {
          id: btoa(userId),
          name: email,
          displayName: email.split('@')[0],
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        timeout: 60000,
        attestation: 'none',
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Built-in (Face ID, Touch ID)
          userVerification: 'required',
          residentKey: 'required',
        },
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
    } catch (error) {
      console.error('Passkey registration failed:', error);
      return false;
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
    } catch (error) {
      console.error('Passkey verification failed:', error);
      return false;
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
