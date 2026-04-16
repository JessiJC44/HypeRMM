import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { toast } from 'sonner';
import { Mail, RefreshCw } from 'lucide-react';

interface Props {
  user: any;
  onVerified: () => void;
}

export function EmailCodeVerify({ user, onVerified }: Props) {
  const [code, setCode] = React.useState('');
  const [verifying, setVerifying] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [expectedCode, setExpectedCode] = React.useState<string | null>(null);
  const [codeSent, setCodeSent] = React.useState(false);

  const generateCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendEmailCode = async () => {
    setSending(true);
    try {
      const newCode = generateCode();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      
      // Store code in Firestore (temporary)
      await setDoc(doc(db, 'emailCodes', user.uid), {
        code: newCode,
        expiresAt,
        email: user.email
      });

      setExpectedCode(newCode);
      
      // In production, use Firebase Functions or an email service
      // For now, we'll show the code in a toast (REMOVE IN PRODUCTION)
      console.log('Email code:', newCode); // For testing
      toast.success(`Code sent to ${user.email}. (Testing: ${newCode})`, { duration: 10000 });
      
      setCodeSent(true);
    } catch (error) {
      toast.error('Failed to send code');
    } finally {
      setSending(false);
    }
  };

  React.useEffect(() => {
    // Send code on mount
    sendEmailCode();
  }, []);

  const verifyCode = async () => {
    setVerifying(true);
    try {
      // Get stored code from Firestore
      const codeDoc = await getDoc(doc(db, 'emailCodes', user.uid));
      const codeData = codeDoc.data();
      
      if (!codeData) {
        toast.error('No code found. Please request a new one.');
        return;
      }

      if (Date.now() > codeData.expiresAt) {
        toast.error('Code expired. Please request a new one.');
        return;
      }

      if (code === codeData.code) {
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
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            We sent a 6-digit code to <strong>{user.email}</strong>
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
              'Verify Code'
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={sendEmailCode} 
            className="w-full"
            disabled={sending}
          >
            {sending ? (
              <><RefreshCw className="animate-spin mr-2" size={18} /> Sending...</>
            ) : (
              'Resend Code'
            )}
          </Button>
          <Button variant="ghost" onClick={handleSignOut} className="w-full text-muted-foreground">
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
