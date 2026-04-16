import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Fingerprint, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { passkeyService } from '../services/passkeyService';
import { getBiometricMethod } from '../utils/deviceDetector';

interface Props {
  user: any;
  onComplete: () => void;
  onUseTOTPInstead: () => void;
}

export function PasskeySetup({ user, onComplete, onUseTOTPInstead }: Props) {
  const [registering, setRegistering] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const biometricMethod = getBiometricMethod();

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const result = await passkeyService.registerPasskey(user.uid, user.email!);
      
      if (result) {
        // Update user document
        await updateDoc(doc(db, 'users', user.uid), {
          passkeyEnabled: true,
          mfaEnabled: true,
        });

        setSuccess(true);
        toast.success(`${biometricMethod} enabled successfully!`);
        setTimeout(() => onComplete(), 2000);
      }
    } catch (error: any) {
      const errorName = error?.name || error?.code || '';
      const errorMessage = error?.message || String(error);

      switch (errorName) {
        case 'NotAllowedError':
          toast.info('Registration cancelled. You can try again anytime.');
          break;
        case 'NotSupportedError':
          toast.warning(`Biometric authentication is not supported on this device.`);
          onUseTOTPInstead();
          break;
        case 'SecurityError':
          toast.error('Passkeys are blocked by browser settings or this platform. Please use an Authenticator App instead.', {
            duration: 5000,
          });
          setTimeout(() => onUseTOTPInstead(), 3000);
          break;
        case 'InvalidStateError':
          toast.info('A passkey is already registered for this account.');
          onComplete();
          break;
        default:
          if (errorMessage.includes('Permissions Policy') || errorMessage.includes('feature is not enabled')) {
            toast.error('Passkeys are blocked by browser security policies. Please use an Authenticator App instead.', {
              duration: 5000,
            });
            setTimeout(() => onUseTOTPInstead(), 3000);
          } else {
            toast.error(`Failed to register ${biometricMethod}. Please try again.`);
            console.error('[Passkey Registration]', error);
          }
      }
    } finally {
      setRegistering(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in duration-500">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl overflow-hidden bg-card text-center">
          <CardContent className="pt-12 pb-12 px-10">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="mx-auto w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-8 border border-emerald-500/20"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </motion.div>
            <h2 className="text-3xl font-black text-foreground tracking-tight">You&#39;re All Set!</h2>
            <p className="text-sm font-medium text-muted-foreground mt-3 px-6">
              {biometricMethod} authentication is now active. You can use Face ID or Touch ID for future logins.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-md border-border shadow-2xl rounded-3xl overflow-hidden bg-card">
        <div className="h-2 bg-primary" />
        <CardHeader className="text-center pt-10 px-8">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
            <Fingerprint className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black text-foreground tracking-tight">Set up {biometricMethod}</CardTitle>
          <CardDescription className="text-sm font-medium text-muted-foreground mt-2 px-6">
            Secure your account with biometric authentication. Fast, secure, and passwordless.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pb-12 pt-4 px-10 text-center">
          <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
            <p className="text-[11px] font-bold text-muted-foreground leading-relaxed uppercase tracking-wide">
              Click the button below and follow your device&#39;s native prompt to enable {biometricMethod}.
            </p>
          </div>

          <Button 
            onClick={handleRegister} 
            className="w-full h-14 rounded-2xl font-black text-lg tracking-tight shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" 
            disabled={registering}
          >
            {registering ? (
              <><RefreshCw className="animate-spin mr-3" size={20} /> Registering...</>
            ) : (
              <><Fingerprint className="mr-3" size={22} /> Register with {biometricMethod}</>
            )}
          </Button>
          
          <div className="pt-2">
            <button
              onClick={onUseTOTPInstead}
              className="text-[10px] text-primary hover:text-primary/80 transition-colors font-black uppercase tracking-widest"
            >
              Use Google Authenticator instead
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
