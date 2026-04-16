import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { passkeyService } from '../services/passkeyService';
import { toast } from 'sonner';
import { Fingerprint, RefreshCw } from 'lucide-react';

interface Props {
  user: any;
  onVerified: () => void;
  onTryAnotherMethod: () => void;
}

export function PasskeyVerify({ user, onVerified, onTryAnotherMethod }: Props) {
  const [verifying, setVerifying] = React.useState(false);

  const handleContinue = async () => {
    setVerifying(true);
    try {
      const success = await passkeyService.verifyWithPasskey(user.uid);
      
      if (success) {
        toast.success('Verification successful!');
        onVerified();
      } else {
        toast.error('Biometric verification failed');
      }
    } catch (error) {
      toast.error('Verification cancelled');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-md border-border shadow-2xl rounded-3xl overflow-hidden bg-card">
        <div className="h-2 bg-primary" />
        <CardHeader className="text-center pt-10">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
            <Fingerprint className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black text-foreground tracking-tight">Biometric Login</CardTitle>
          <CardDescription className="text-sm font-medium text-muted-foreground mt-2 px-6">
            Use fingerprint or face recognition to securely access your HypeRemote account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pb-12 pt-4 px-10">
          <Button 
            onClick={handleContinue} 
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" 
            disabled={verifying}
          >
            {verifying ? (
              <><RefreshCw className="animate-spin mr-3" size={20} /> Verifying...</>
            ) : (
              'Verify with Biometrics'
            )}
          </Button>
          
          <div className="pt-2">
            <button
              onClick={onTryAnotherMethod}
              className="w-full text-center text-sm text-primary hover:text-primary/80 transition-colors font-black uppercase tracking-widest"
            >
              Try another method
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
