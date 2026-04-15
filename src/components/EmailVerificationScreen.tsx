import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, RefreshCw, CheckCircle2 } from 'lucide-react';
import { authHelpers, auth } from '../lib/firebase';
import { toast } from 'sonner';

interface Props {
  user: any;
  onVerified: () => void;
}

export function EmailVerificationScreen({ user, onVerified }: Props) {
  const [sending, setSending] = React.useState(false);
  const [checking, setChecking] = React.useState(false);

  const resendEmail = async () => {
    setSending(true);
    try {
      await authHelpers.sendVerificationEmail();
      toast.success('Verification email sent!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const checkVerification = async () => {
    setChecking(true);
    try {
      const updatedUser = await authHelpers.reloadUser();
      if (updatedUser?.emailVerified) {
        toast.success('Email verified!');
        onVerified();
      } else {
        toast.info('Email not yet verified. Check your inbox.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to check verification');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-amber-500" />
          </div>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            We sent a verification link to <strong>{user.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkVerification} className="w-full" disabled={checking}>
            {checking ? <RefreshCw className="animate-spin mr-2" size={18} /> : <CheckCircle2 className="mr-2" size={18} />}
            I've verified my email
          </Button>
          
          <Button onClick={resendEmail} variant="outline" className="w-full" disabled={sending}>
            {sending ? <RefreshCw className="animate-spin mr-2" size={18} /> : <Mail className="mr-2" size={18} />}
            Resend verification email
          </Button>

          <Button onClick={() => auth.signOut()} variant="ghost" className="w-full text-muted-foreground">
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
