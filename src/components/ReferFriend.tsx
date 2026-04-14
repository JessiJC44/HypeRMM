import * as React from 'react';
import { Gift, Copy, Share2, Mail, Facebook, CheckCircle2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

const XIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    className={className}
    fill="currentColor"
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

export function ReferFriend() {
  const referralCode = "HYPEREMOTE-PRO-2026";
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied to clipboard!");
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 bg-slate-50/50 min-h-screen animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-8 lg:space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-20 h-20 lg:w-24 lg:h-24 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto mb-6 lg:mb-8 shadow-lg shadow-brand-green/5"
          >
            <Gift size={40} className="lg:w-12 lg:h-12" strokeWidth={2.5} />
          </motion.div>
          <h1 className="text-3xl lg:text-5xl font-black text-brand-navy tracking-tight">Refer a Friend, Get Rewarded</h1>
          <p className="text-base lg:text-lg text-slate-500 max-w-2xl mx-auto font-medium">
            Share the power of HypeRemote with your fellow IT professionals. For every friend who signs up, you both get a <span className="text-brand-green font-black">$50 Amazon Gift Card</span>.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
          {[
            { step: '1', title: 'Share your link', desc: 'Send your unique referral link to your friends.' },
            { step: '2', title: 'They sign up', desc: 'Your friend starts a free trial using your link.' },
            { step: '3', title: 'Get rewarded', desc: 'Once they subscribe, you both get your reward!' },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="border-none shadow-sm text-center p-8 rounded-3xl bg-white h-full">
                <div className="w-12 h-12 bg-brand-blue text-white rounded-2xl flex items-center justify-center mx-auto mb-6 font-black text-lg shadow-lg shadow-brand-blue/20">
                  {item.step}
                </div>
                <h3 className="font-black text-brand-navy mb-2 tracking-tight">{item.title}</h3>
                <p className="text-sm text-slate-400 font-bold leading-relaxed">{item.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[2rem]">
            <CardContent className="p-6 lg:p-12 space-y-8 lg:space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block text-center">Your Unique Referral Code</label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl px-6 lg:px-8 h-16 flex items-center justify-between">
                    <span className="font-mono font-black text-xl lg:text-2xl text-brand-navy tracking-wider whitespace-nowrap">{referralCode}</span>
                    <Button variant="ghost" size="sm" onClick={copyToClipboard} className="text-brand-blue font-black gap-2 hover:bg-brand-blue/5 rounded-xl px-2 lg:px-4">
                      <Copy size={18} />
                      <span className="hidden sm:inline">Copy</span>
                    </Button>
                  </div>
                  <Button className="bg-brand-navy hover:bg-brand-navy/90 text-white rounded-2xl px-10 font-black h-16 gap-3 shadow-xl shadow-brand-navy/10 transition-all hover:scale-[1.02] active:scale-95 w-full sm:w-auto">
                    <Share2 size={20} />
                    Share Link
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 lg:gap-10 pt-4">
                {[
                  { icon: Mail, color: 'hover:bg-brand-blue' },
                  { icon: XIcon, color: 'hover:bg-black' },
                  { icon: Facebook, color: 'hover:bg-indigo-600' },
                ].map((social, i) => (
                  <motion.button 
                    key={i}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-4 rounded-2xl bg-slate-50 text-slate-400 ${social.color} hover:text-white transition-all shadow-sm`}
                  >
                    <social.icon size={28} />
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-[2rem] p-10 border-none shadow-sm"
        >
          <div className="flex items-center gap-5 mb-10">
            <div className="p-4 bg-amber-50 rounded-2xl text-amber-600 shadow-lg shadow-amber-500/5">
              <Trophy size={28} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-black text-brand-navy tracking-tight">Your Referral Stats</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {[
              { label: 'Total Referrals', value: '12', color: 'brand-blue' },
              { label: 'Pending', value: '3', color: 'amber-500' },
              { label: 'Successful', value: '9', color: 'brand-green' },
              { label: 'Rewards Earned', value: '$450', color: 'brand-green' },
            ].map((stat, index) => (
              <motion.div 
                key={stat.label} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + (index * 0.1) }}
                className="space-y-2"
              >
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className={cn("text-4xl font-black tracking-tight", 
                  stat.color === 'brand-blue' ? "text-brand-blue" : 
                  stat.color === 'brand-green' ? "text-brand-green" : "text-amber-500"
                )}>{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
