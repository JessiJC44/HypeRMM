"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Sparkles, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/src/components/Logo";
import { toast } from "sonner";
import { auth, googleProvider, db, authHelpers } from "@/src/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import * as OTPAuth from "otpauth";
import QRCode from "react-qr-code";


interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

const Pupil = ({ 
  size = 12, 
  maxDistance = 5,
  pupilColor = "black",
  forceLookX,
  forceLookY
}: PupilProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const pupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const calculatePupilPosition = () => {
    if (!pupilRef.current) return { x: 0, y: 0 };

    // If forced look direction is provided, use that instead of mouse tracking
    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const pupil = pupilRef.current.getBoundingClientRect();
    const pupilCenterX = pupil.left + pupil.width / 2;
    const pupilCenterY = pupil.top + pupil.height / 2;

    const deltaX = mouseX - pupilCenterX;
    const deltaY = mouseY - pupilCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  );
};




interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

const EyeBall = ({ 
  size = 48, 
  pupilSize = 16, 
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY
}: EyeBallProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const eyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };

    // If forced look direction is provided, use that instead of mouse tracking
    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const eye = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eye.left + eye.width / 2;
    const eyeCenterY = eye.top + eye.height / 2;

    const deltaX = mouseX - eyeCenterX;
    const deltaY = mouseY - eyeCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        overflow: 'hidden',
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  );
};





export function AnimatedCharactersLoginPage({ onLogin }: { onLogin?: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authStep, setAuthStep] = useState<'login' | '2fa' | 'setup-2fa'>('login');
  const [mfaCode, setMfaCode] = useState("");
  const [mfaMethod, setMfaMethod] = useState<'email' | 'google'>('email');
  const [generatedCode, setGeneratedCode] = useState("");
  const [savedMfaMethod, setSavedMfaMethod] = useState<'email' | 'google' | null>(null);
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaQrUrl, setMfaQrUrl] = useState("");

  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Blinking effect for purple character
  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000; // Random between 3-7 seconds

    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => {
          setIsPurpleBlinking(false);
          scheduleBlink();
        }, 150); // Blink duration 150ms
      }, getRandomBlinkInterval());

      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  // Blinking effect for black character
  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000; // Random between 3-7 seconds

    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlink();
        }, 150); // Blink duration 150ms
      }, getRandomBlinkInterval());

      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  // Looking at each other animation when typing starts
  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => {
        setIsLookingAtEachOther(false);
      }, 800); // Look at each other for 1.5 seconds, then back to tracking mouse
      return () => clearTimeout(timer);
    } else {
      setIsLookingAtEachOther(false);
    }
  }, [isTyping]);

  // Purple sneaky peeking animation when typing password and it's visible
  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const schedulePeek = () => {
        const peekInterval = setTimeout(() => {
          setIsPurplePeeking(true);
          setTimeout(() => {
            setIsPurplePeeking(false);
          }, 800); // Peek for 800ms
        }, Math.random() * 3000 + 2000); // Random peek every 2-5 seconds
        return peekInterval;
      };

      const firstPeek = schedulePeek();
      return () => clearTimeout(firstPeek);
    } else {
      setIsPurplePeeking(false);
    }
  }, [password, showPassword, isPurplePeeking]);

  const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3; // Focus on head area

    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;

    // Face movement (limited range)
    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));

    // Body lean (skew for lean while keeping bottom straight) - negative to lean towards mouse
    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));

    return { faceX, faceY, bodySkew };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  // Handle MFA setup generation
  useEffect(() => {
    if (authStep === 'setup-2fa' && mfaMethod === 'google') {
      const secret = new OTPAuth.Secret();
      const totp = new OTPAuth.TOTP({
        issuer: "HypeRemote",
        label: auth.currentUser?.email || "user",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: secret,
      });
      
      setMfaSecret(secret.base32);
      setMfaQrUrl(totp.toString());
    }
  }, [authStep, mfaMethod]);

  // Check for saved MFA on login and handle auto-jump
  useEffect(() => {
    const checkSavedMfa = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const data = userDoc.exists() ? userDoc.data() : {};
        
        if (data.mfaSecret) {
          setMfaSecret(data.mfaSecret);
        }

        // Auto-jump to 2FA step if we're at the login step but already authenticated with Firebase
        if (authStep === 'login') {
          const provider = auth.currentUser.providerData[0]?.providerId;
          
          if (provider === 'google.com') {
            setMfaMethod('google');
            if (data.mfaMethod === 'google' && data.mfaSecret) {
              setAuthStep('2fa');
            } else {
              setAuthStep('setup-2fa');
            }
          } else {
            // Default to email for password login or others
            setMfaMethod('email');
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedCode(code);
            toast.info(`Verification code sent to ${auth.currentUser.email}: ${code}`, { duration: 10000 });
            setAuthStep('2fa');
          }
        }
      }
    };
    checkSavedMfa();
  }, [auth.currentUser, authStep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: email.split('@')[0]
        });
        toast.success("Account created successfully!");
        setAuthStep('setup-2fa');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        // Force Email MFA for Email/Password login
        setMfaMethod('email');
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(code);
        toast.info(`Verification code sent to ${email}: ${code}`, { duration: 10000 });
        setAuthStep('2fa');
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let message = "An error occurred. Please try again.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = "Invalid email or password.";
      } else if (err.code === 'auth/email-already-in-use') {
        message = "This email is already in use.";
      } else if (err.code === 'auth/weak-password') {
        message = "Password should be at least 6 characters.";
      } else if (err.code === 'auth/invalid-email') {
        message = "Invalid email address.";
      } else if (err.code === 'auth/operation-not-allowed') {
        message = "Email/Password login is not enabled in Firebase Console.";
      }
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      console.log("Starting Google Login...");
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user doc exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // New user from social login
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'user',
          createdAt: serverTimestamp()
        });
        setMfaMethod('google');
        setAuthStep('setup-2fa');
      } else {
        const data = userDoc.data();
        setMfaMethod('google'); // Force Google Auth App for Google login
        
        if (data.mfaMethod === 'google' && data.mfaSecret) {
          setMfaSecret(data.mfaSecret);
          setAuthStep('2fa');
        } else {
          // If they haven't set up Google Auth yet, force them to
          setAuthStep('setup-2fa');
        }
      }
    } catch (err: any) {
      console.error("Google Auth error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        toast.info("Connexion annulée.");
      } else if (err.code === 'auth/popup-blocked') {
        toast.error("Le popup de connexion a été bloqué par votre navigateur. Veuillez autoriser les popups pour ce site.");
      } else if (err.code === 'auth/network-request-failed') {
        toast.error("Échec de la connexion: Erreur de réseau. Veuillez vérifier votre connexion internet ou désactiver vos bloqueurs de publicité (AdBlock).");
      } else {
        toast.error(`Échec de la connexion avec Google: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMfa = (e: React.FormEvent) => {
    e.preventDefault();
    
    let isValid = false;
    if (mfaMethod === 'google') {
      const totp = new OTPAuth.TOTP({
        issuer: "HypeRemote",
        label: auth.currentUser?.email || "user",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: mfaSecret,
      });
      const delta = totp.validate({ token: mfaCode, window: 1 });
      isValid = delta !== null;
    } else if (mfaMethod === 'email') {
      isValid = mfaCode === generatedCode;
    } else {
      isValid = false;
    }

    if (isValid) {
      toast.success("Verification successful!");
      if (onLogin) onLogin();
    } else {
      toast.error("Invalid verification code.");
    }
  };

  const handleSetupMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let isValid = false;
    if (mfaMethod === 'google') {
      const totp = new OTPAuth.TOTP({
        issuer: "HypeRemote",
        label: auth.currentUser?.email || "user",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: mfaSecret,
      });
      const delta = totp.validate({ token: mfaCode, window: 1 });
      isValid = delta !== null;
    } else {
      // For email in this demo, we auto-verify
      isValid = true;
    }

    if (isValid) {
      try {
        if (auth.currentUser) {
          const updates: any = {
            mfaMethod: mfaMethod,
            mfaSecret: mfaSecret
          };
          
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            ...updates
          });
        }
        setSavedMfaMethod(mfaMethod);
        toast.success(`2FA configured with ${mfaMethod === 'google' ? 'Google Authenticator' : 'Email'}!`);
        if (onLogin) onLogin();
      } catch (err) {
        console.error("Failed to save MFA:", err);
        toast.error("Failed to save MFA settings.");
      }
    } else {
      toast.error("Invalid verification code.");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Content Section */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-12 text-primary-foreground">
        <div className="relative z-20">
          <Logo />
        </div>

        <div className="relative z-20 flex items-end justify-center h-[500px]">
          {/* Cartoon Characters */}
          <div className="relative" style={{ width: '550px', height: '400px' }}>
            {/* Purple tall rectangle character - Back layer */}
            <div 
              ref={purpleRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '70px',
                width: '180px',
                height: (isTyping || (password.length > 0 && !showPassword)) ? '440px' : '400px',
                backgroundColor: '#6C3FF5',
                borderRadius: '10px 10px 0 0',
                zIndex: 1,
                transform: (password.length > 0 && showPassword)
                  ? `skewX(0deg)`
                  : (isTyping || (password.length > 0 && !showPassword))
                    ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)` 
                    : `skewX(${purplePos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              {/* Eyes */}
              <div 
                className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${20}px` : isLookingAtEachOther ? `${55}px` : `${45 + purplePos.faceX}px`,
                  top: (password.length > 0 && showPassword) ? `${35}px` : isLookingAtEachOther ? `${65}px` : `${40 + purplePos.faceY}px`,
                }}
              >
                <EyeBall 
                  size={18} 
                  pupilSize={7} 
                  maxDistance={5} 
                  eyeColor="white" 
                  pupilColor="#2D2D2D" 
                  isBlinking={isPurpleBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
                <EyeBall 
                  size={18} 
                  pupilSize={7} 
                  maxDistance={5} 
                  eyeColor="white" 
                  pupilColor="#2D2D2D" 
                  isBlinking={isPurpleBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
              </div>
            </div>

            {/* Black tall rectangle character - Middle layer */}
            <div 
              ref={blackRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '240px',
                width: '120px',
                height: '310px',
                backgroundColor: '#2D2D2D',
                borderRadius: '8px 8px 0 0',
                zIndex: 2,
                transform: (password.length > 0 && showPassword)
                  ? `skewX(0deg)`
                  : isLookingAtEachOther
                    ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                    : (isTyping || (password.length > 0 && !showPassword))
                      ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)` 
                      : `skewX(${blackPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              {/* Eyes */}
              <div 
                className="absolute flex gap-6 transition-all duration-700 ease-in-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${10}px` : isLookingAtEachOther ? `${32}px` : `${26 + blackPos.faceX}px`,
                  top: (password.length > 0 && showPassword) ? `${28}px` : isLookingAtEachOther ? `${12}px` : `${32 + blackPos.faceY}px`,
                }}
              >
                <EyeBall 
                  size={16} 
                  pupilSize={6} 
                  maxDistance={4} 
                  eyeColor="white" 
                  pupilColor="#2D2D2D" 
                  isBlinking={isBlackBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
                <EyeBall 
                  size={16} 
                  pupilSize={6} 
                  maxDistance={4} 
                  eyeColor="white" 
                  pupilColor="#2D2D2D" 
                  isBlinking={isBlackBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
              </div>
            </div>

            {/* Orange semi-circle character - Front left */}
            <div 
              ref={orangeRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '0px',
                width: '240px',
                height: '200px',
                zIndex: 3,
                backgroundColor: '#FF9B6B',
                borderRadius: '120px 120px 0 0',
                transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              {/* Eyes - just pupils, no white */}
              <div 
                className="absolute flex gap-8 transition-all duration-200 ease-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${50}px` : `${82 + (orangePos.faceX || 0)}px`,
                  top: (password.length > 0 && showPassword) ? `${85}px` : `${90 + (orangePos.faceY || 0)}px`,
                }}
              >
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
              </div>
            </div>

            {/* Yellow tall rectangle character - Front right */}
            <div 
              ref={yellowRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '310px',
                width: '140px',
                height: '230px',
                backgroundColor: '#E8D754',
                borderRadius: '70px 70px 0 0',
                zIndex: 4,
                transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              {/* Eyes - just pupils, no white */}
              <div 
                className="absolute flex gap-6 transition-all duration-200 ease-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${20}px` : `${52 + (yellowPos.faceX || 0)}px`,
                  top: (password.length > 0 && showPassword) ? `${35}px` : `${40 + (yellowPos.faceY || 0)}px`,
                }}
              >
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
              </div>
              {/* Horizontal line for mouth */}
              <div 
                className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${10}px` : `${40 + (yellowPos.faceX || 0)}px`,
                  top: (password.length > 0 && showPassword) ? `${88}px` : `${88 + (yellowPos.faceY || 0)}px`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="relative z-20 flex items-center gap-8 text-sm text-primary-foreground/60">
          <a href="#" className="hover:text-primary-foreground transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-primary-foreground transition-colors">
            Terms of Service
          </a>
          <a href="#" className="hover:text-primary-foreground transition-colors">
            Contact
          </a>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute top-1/4 right-1/4 size-64 bg-primary-foreground/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 size-96 bg-primary-foreground/5 rounded-full blur-3xl" />
      </div>

      {/* Right Login Section */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-12">
            <Logo />
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {authStep === 'setup-2fa' ? "Secure your account" : authStep === '2fa' ? "Two-Factor Authentication" : (isSignUp ? "Create an account" : "Welcome back!")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {authStep === 'setup-2fa'
                ? "Choose your preferred two-factor authentication method"
                : authStep === '2fa' 
                ? `Enter the 6-digit code sent to your ${mfaMethod === 'email' ? 'email' : mfaMethod === 'sms' ? 'phone' : 'authenticator app'}` 
                : (isSignUp ? "Enter your details to get started" : "Please enter your details")}
            </p>
            {auth.currentUser && (
              <button 
                onClick={() => auth.signOut()}
                className="mt-4 text-xs text-brand-blue hover:underline font-bold uppercase tracking-widest"
              >
                Not you? Sign out
              </button>
            )}
          </div>

          {authStep === 'login' ? (
            <>
              {/* Social Login - Primary */}
              <div className="mb-8">
                <Button 
                  variant="outline" 
                  className="w-full h-14 bg-background border-border/60 hover:bg-accent text-lg font-bold shadow-sm"
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <Mail className="mr-3 size-6 text-red-500" />
                  Continue with Google
                </Button>
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground font-bold tracking-widest">Or continue with email</span>
                </div>
              </div>

              {/* Login Form - Secondary */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder=""
                    value={email}
                    autoComplete="off"
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    required
                    className="h-12 bg-background border-border/60 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder=""
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 pr-10 bg-background border-border/60 focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="size-5" />
                      ) : (
                        <Eye className="size-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" />
                    <Label
                      htmlFor="remember"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Remember for 30 days
                    </Label>
                  </div>
                  <a
                    href="#"
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </a>
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium" 
                  size="lg" 
                  disabled={isLoading}
                >
                  {isLoading ? (isSignUp ? "Creating account..." : "Signing in...") : (isSignUp ? "Sign Up" : "Log in")}
                </Button>
              </form>

              {/* Sign Up Link */}
              <div className="text-center text-sm text-muted-foreground mt-8">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <button 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-foreground font-medium hover:underline"
                >
                  {isSignUp ? "Log in" : "Sign Up"}
                </button>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={() => authHelpers.clearAllSessions()}
                  className="text-xs text-muted-foreground hover:text-foreground mt-8"
                >
                  Clear all sessions (for testing)
                </button>
              </div>

              {/* Mobile Link QR Code */}
              <div className="mt-12 pt-8 border-t border-border/40 flex flex-col items-center gap-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Open on your iPhone</p>
                <div className="bg-white p-2 rounded-lg shadow-sm border border-border/40">
                  <QRCode value={window.location.href} size={80} />
                </div>
                <p className="text-[10px] text-muted-foreground text-center max-w-[200px]">
                  Scan to open HypeRemote on your mobile device and test real-time features.
                </p>
              </div>
            </>
          ) : authStep === 'setup-2fa' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => setMfaMethod('email')}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                    mfaMethod === 'email' ? "border-primary bg-primary/5" : "border-border/60 hover:border-border"
                  )}
                >
                  <div className={cn("p-2 rounded-lg", mfaMethod === 'email' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Email Verification</p>
                    <p className="text-xs text-muted-foreground">Receive a code on your email address</p>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    setMfaMethod('google');
                    toast.info("Google Authenticator selected. Scan the QR code below.");
                  }}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                    mfaMethod === 'google' ? "border-primary bg-primary/5" : "border-border/60 hover:border-border"
                  )}
                >
                  <div className={cn("p-2 rounded-lg", mfaMethod === 'google' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Google Authenticator</p>
                    <p className="text-xs text-muted-foreground">Use Google Auth App for secure OTP</p>
                  </div>
                </button>
              </div>

              {mfaMethod === 'google' && (
                <div className="p-6 bg-muted/30 rounded-2xl border border-border/60 flex flex-col items-center space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    {mfaQrUrl ? (
                      <QRCode value={mfaQrUrl} size={128} />
                    ) : (
                      <div className="w-32 h-32 bg-slate-900 flex items-center justify-center text-white text-[10px] text-center p-2">
                        Generating QR Code...
                      </div>
                    )}
                  </div>
                  <div className="w-full space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Enter code from app</Label>
                    <Input 
                      placeholder="000 000" 
                      className="h-12 text-center text-xl font-mono tracking-[0.5em]"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Button onClick={handleSetupMfa} className="w-full h-12 text-base font-medium">
                {mfaMethod === 'google' ? "Verify and Save" : "Save and Continue"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleVerifyMfa} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <Input
                        key={i}
                        type="text"
                        maxLength={1}
                        className="w-12 h-14 text-center text-2xl font-bold bg-background border-border/60 focus:border-primary"
                        value={mfaCode[i] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^\d?$/.test(val)) {
                            const newCode = mfaCode.split("");
                            newCode[i] = val;
                            setMfaCode(newCode.join(""));
                            // Auto-focus next
                            if (val && i < 5) {
                              const next = e.target.nextElementSibling as HTMLInputElement;
                              if (next) next.focus();
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !mfaCode[i] && i > 0) {
                            const prev = (e.target as HTMLInputElement).previousElementSibling as HTMLInputElement;
                            if (prev) prev.focus();
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full h-12 text-base font-medium">
                    Verify Code
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full"
                    onClick={async () => {
                      const code = Math.floor(100000 + Math.random() * 900000).toString();
                      setGeneratedCode(code);
                      if (mfaMethod === 'email') {
                        toast.info(`New code sent to ${email}: ${code}`);
                      } else {
                        toast.info(`New code generated: ${code}`);
                      }
                    }}
                  >
                    Resend Code
                  </Button>
                </div>
              </form>

              {/* Provider-specific MFA is enforced based on login method */}

              <button 
                onClick={() => setAuthStep('login')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors mt-4"
              >
                Back to login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
