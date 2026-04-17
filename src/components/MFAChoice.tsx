import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Fingerprint, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  onChoosePasskey: () => void;
  onChooseTOTP: () => void;
  onBack: () => void;
  passkeySupported: boolean;
}

export function MFAChoice({ onChoosePasskey, onChooseTOTP, onBack, passkeySupported }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-md border-border shadow-2xl rounded-3xl overflow-hidden bg-card">
        <div className="h-2 bg-primary" />
        <CardHeader className="text-center pt-10">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black text-foreground tracking-tight">Secure Your Account</CardTitle>
          <CardDescription className="text-sm font-medium text-muted-foreground mt-2 px-6">
            Two-factor authentication adds an extra layer of security to your HypeRemote account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-12 pt-4 px-10">
          {passkeySupported && (
            <motion.div whileHover={{ scale: 1.02 }} whileActive={{ scale: 0.98 }}>
              <Button 
                onClick={onChoosePasskey}
                variant="outline"
                className="w-full h-auto py-5 px-6 flex flex-col items-start gap-1 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 group transition-all"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Fingerprint className="w-6 h-6" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-black text-foreground text-sm uppercase tracking-wider">Passkey (Face ID / Touch ID)</p>
                    <p className="text-xs text-muted-foreground font-normal">Fast & secure biometric authentication</p>
                  </div>
                  <div className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-widest border border-primary/20 group-hover:bg-primary-foreground group-hover:text-primary">
                    Recommended
                  </div>
                </div>
              </Button>
            </motion.div>
          )}

          <motion.div whileHover={{ scale: 1.02 }} whileActive={{ scale: 0.98 }}>
            <Button 
              onClick={onChooseTOTP}
              variant="outline"
              className="w-full h-auto py-5 px-6 flex flex-col items-start gap-1 rounded-2xl border-2 border-border hover:border-brand-blue hover:bg-brand-blue/5 group transition-all"
            >
              <div className="flex items-center gap-4 w-full">
                <div className="p-3 rounded-xl bg-muted text-muted-foreground group-hover:bg-brand-blue group-hover:text-white transition-all">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-black text-foreground text-sm uppercase tracking-wider">Google Authenticator</p>
                  <p className="text-xs text-muted-foreground font-normal">6-digit code from any TOTP app</p>
                </div>
              </div>
            </Button>
          </motion.div>

          {!passkeySupported && (
            <p className="text-[10px] text-center text-rose-500 mt-4 font-black uppercase tracking-widest bg-rose-500/10 py-3 px-4 rounded-lg italic font-sans antialiased border border-rose-500/20">
              Face ID / Touch ID is not enabled on this device or browser. Check System Settings → Touch ID & Password, or use another 2FA method.
            </p>
          )}

          <div className="pt-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
