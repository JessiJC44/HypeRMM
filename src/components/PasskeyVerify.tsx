import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { passkeyService } from '../services/passkeyService';
import { toast } from 'sonner';
import { Fingerprint, RefreshCw, AlertCircle } from 'lucide-react';
import { getBiometricMethod } from '../utils/deviceDetector';

interface Props {
  user: any;
  onVerified: () => void;
  onTryAnotherMethod: () => void;
  onSignOut: () => void;
}

export function PasskeyVerify({ user, onVerified, onTryAnotherMethod, onSignOut }: Props) {
  const [verifying, setVerifying] = React.useState(false);
  const [policyBlocked, setPolicyBlocked] = React.useState(false);
  const biometricMethod = getBiometricMethod();

  React.useEffect(() => {
    const status = passkeyService.getPolicyStatus();
    if (status.blocked) {
      setPolicyBlocked(true);
    }
  }, []);

  const handleContinue = async () => {
    setVerifying(true);
    try {
      const success = await passkeyService.verifyWithPasskey(user.uid);
      
      if (success) {
        toast.success(`${biometricMethod} verification successful!`);
        onVerified();
      } else {
        toast.error(`${biometricMethod} verification failed`);
      }
    } catch (error: any) {
      const errorName = error?.name || error?.code || '';
      const errorMessage = error?.message || String(error);

      switch (errorName) {
        case 'NotAllowedError':
          toast.info('Verification cancelled.');
          break;
        case 'NotSupportedError':
          toast.warning(`Face ID / Touch ID is not enabled on this device or browser. Check System Settings → Touch ID & Password, or use another 2FA method.`);
          onTryAnotherMethod();
          break;
        case 'SecurityError':
          if (errorMessage.includes('feature is not enabled') || errorMessage.includes('Permissions Policy')) {
            toast.error('Passkeys are blocked by browser security policies in this preview. Please open the app in a new tab to verify your identity.', {
              duration: 8000,
            });
          } else {
            toast.error('Passkey verification is blocked by browser security policies. Please use an Authenticator App instead.', {
              duration: 5000,
            });
            setTimeout(() => onTryAnotherMethod(), 3000);
          }
          break;
        default:
          if (errorMessage.includes('Permissions Policy') || errorMessage.includes('feature is not enabled')) {
            toast.error('Passkey verification is blocked by browser security policies. Please use an Authenticator App instead.', {
              duration: 5000,
            });
            setTimeout(() => onTryAnotherMethod(), 3000);
          } else {
            toast.error(`Failed to verify with ${biometricMethod}.`);
            console.error('[Passkey Verification]', error);
          }
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-md border-border shadow-2xl rounded-3xl overflow-hidden bg-card">
        <div className="h-2 bg-primary" />
        <CardHeader className="text-center pt-10 px-8">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
            <Fingerprint className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black text-foreground tracking-tight">{biometricMethod} Login</CardTitle>
          <CardDescription className="text-sm font-medium text-muted-foreground mt-2 px-6">
            Use your device&#39;s biometrics to securely access your HypeRemote account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pb-12 pt-4 px-10 text-center">
          {policyBlocked ? (
            <div className="bg-rose-500/10 p-5 rounded-2xl border border-rose-500/20 space-y-4">
              <div className="flex items-center justify-center text-rose-600 mb-1">
                <AlertCircle size={24} />
              </div>
              <p className="text-xs font-bold text-rose-600 leading-relaxed uppercase tracking-tight">
                Verification Blocked
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">
                Biometric authentication is restricted in this preview window. Please open the app in a new tab to continue.
              </p>
              <Button 
                onClick={() => window.open(window.location.href, '_blank')}
                className="w-full h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest shadow-md"
              >
                Open in New Tab
              </Button>
            </div>
          ) : (
            <>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                <p className="text-[11px] font-bold text-muted-foreground leading-relaxed uppercase tracking-wide">
                  Click the button below and follow your device&#39;s native prompt to verify with {biometricMethod}.
                </p>
              </div>

              <Button 
                onClick={handleContinue} 
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                disabled={verifying}
              >
                {verifying ? (
                  <><RefreshCw className="animate-spin mr-3" size={20} /> Verifying...</>
                ) : (
                  <><Fingerprint className="mr-3" size={22} /> Verify with {biometricMethod}</>
                )}
              </Button>

              <div className="pt-2 flex flex-col gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="w-full h-11 rounded-xl border-dashed border-primary/40 hover:border-primary text-xs font-bold uppercase tracking-widest text-primary/80"
                >
                  Open in New Tab (Fixes Security Errors)
                </Button>
              </div>
            </>
          )}
          
          <div className="pt-4 flex flex-col gap-4">
            <button
              onClick={onTryAnotherMethod}
              className="text-[10px] text-primary hover:text-primary/80 transition-colors font-black uppercase tracking-widest bg-primary/5 py-3 rounded-lg border border-primary/20"
            >
              Use Authenticator App instead
            </button>
            <button
              onClick={onSignOut}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors font-black uppercase tracking-widest"
            >
              Sign out
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
