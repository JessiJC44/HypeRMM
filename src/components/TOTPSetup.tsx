import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRCodeSVG } from 'qrcode.react';
import * as OTPAuth from 'otpauth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { Shield, Smartphone, RefreshCw } from 'lucide-react';

interface Props {
  user: any;
  onComplete: () => void;
  onBack: () => void;
  onUsePasskeyInstead?: () => void;
}

export function TOTPSetup({ user, onComplete, onBack, onUsePasskeyInstead }: Props) {
  const [secret, setSecret] = React.useState<string>('');
  const [otpAuthUrl, setOtpAuthUrl] = React.useState<string>('');
  const [code, setCode] = React.useState('');
  const [verifying, setVerifying] = React.useState(false);
  const [step, setStep] = React.useState<'intro' | 'scan' | 'verify'>('intro');

  React.useEffect(() => {
    // Generate TOTP secret
    const totp = new OTPAuth.TOTP({
      issuer: 'HypeRemote',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(generateRandomBase32(20))
    });
    
    setSecret(totp.secret.base32);
    setOtpAuthUrl(totp.toString());
  }, [user.email]);

  const generateRandomBase32 = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const verifyCode = async () => {
    setVerifying(true);
    try {
      const totp = new OTPAuth.TOTP({
        issuer: 'HypeRemote',
        label: user.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret)
      });

      const isValid = totp.validate({ token: code, window: 1 }) !== null;

      if (isValid) {
        // Save to Firestore
        await updateDoc(doc(db, 'users', user.uid), {
          totpEnabled: true,
          totpSecret: secret // In production, encrypt this!
        });
        toast.success('2FA enabled successfully!');
        onComplete();
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

  if (step === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Secure Your Account</CardTitle>
            <CardDescription>
              Set up two-factor authentication to protect your HypeRemote account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <p>Download Google Authenticator or any TOTP app</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <p>Scan the QR code with the app</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <p>Enter the 6-digit code to verify</p>
              </div>
            </div>
            <Button onClick={() => setStep('scan')} className="w-full h-12 rounded-xl font-bold">
              <Smartphone className="mr-2" size={18} />
              Continue Setup
            </Button>

            <div className="pt-2 flex flex-col gap-4 text-center">
              {onUsePasskeyInstead && (
                <button
                  onClick={onUsePasskeyInstead}
                  className="text-[10px] text-primary hover:text-primary/80 transition-colors font-black uppercase tracking-widest bg-primary/5 py-3 rounded-lg border border-primary/20"
                >
                  Setup with Face ID / Touch ID instead
                </button>
              )}
              <button
                onClick={onBack}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors font-black uppercase tracking-widest"
              >
                Back to choice
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'scan') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Scan QR Code</CardTitle>
            <CardDescription>
              Open Google Authenticator and scan this code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center p-4 bg-white rounded-xl">
              {otpAuthUrl && <QRCodeSVG value={otpAuthUrl} size={200} />}
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Can't scan? Enter this code manually:</p>
              <code className="text-xs bg-muted px-3 py-1 rounded font-mono break-all">
                {secret}
              </code>
            </div>
            <Button onClick={() => setStep('verify')} className="w-full">
              I've Scanned the Code
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Enter Verification Code</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app
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
          />
          <Button 
            onClick={verifyCode} 
            className="w-full" 
            disabled={code.length !== 6 || verifying}
          >
            {verifying ? (
              <><RefreshCw className="animate-spin mr-2" size={18} /> Verifying...</>
            ) : (
              'Verify & Enable 2FA'
            )}
          </Button>
          <Button variant="ghost" onClick={() => setStep('scan')} className="w-full">
            Back to QR Code
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
