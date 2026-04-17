import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as OTPAuth from 'otpauth';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { toast } from 'sonner';
import { Shield, RefreshCw } from 'lucide-react';

interface Props {
  user: any;
  onVerified: () => void;
  onUseBiometric?: () => void;
  showBiometricOption?: boolean;
}

export function TOTPVerify({ user, onVerified, onUseBiometric, showBiometricOption }: Props) {
  const [code, setCode] = React.useState('');
  const [verifying, setVerifying] = React.useState(false);

  const verifyCode = async () => {
    setVerifying(true);
    try {
      // Get user's TOTP secret from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (!userData?.totpSecret) {
        toast.error('2FA not set up properly');
        return;
      }

      const totp = new OTPAuth.TOTP({
        issuer: 'HypeRemote',
        label: user.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(userData.totpSecret)
      });

      const isValid = totp.validate({ token: code, window: 1 }) !== null;

      if (isValid) {
        toast.success('Verification successful!');
        onVerified();
      } else {
        toast.error('Incorrect code', {
          position: 'top-right',
        });
        setCode('');
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleSignOut = () => {
    auth.signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your Google Authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="text-center text-2xl tracking-widest font-mono h-14"
            autoFocus
          />
          <Button 
            onClick={verifyCode} 
            className="w-full" 
            disabled={code.length !== 6 || verifying}
          >
            {verifying ? (
              <><RefreshCw className="animate-spin mr-2" size={18} /> Verifying...</>
            ) : (
              'Verify'
            )}
          </Button>
          <Button variant="ghost" onClick={handleSignOut} className="w-full text-muted-foreground">
            Sign out
          </Button>

          {showBiometricOption && onUseBiometric && (
            <div className="pt-2">
              <button
                onClick={onUseBiometric}
                className="w-full text-center text-[10px] text-primary hover:text-primary/80 transition-colors font-black uppercase tracking-widest bg-primary/5 py-3 rounded-lg border border-primary/20"
              >
                Use Face ID / Touch ID instead
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
