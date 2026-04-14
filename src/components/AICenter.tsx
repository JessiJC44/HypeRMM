import * as React from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  BrainCircuit, 
  Zap, 
  ShieldCheck, 
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { generateAIResponse } from '@/src/services/geminiService';
import { ChatMessage } from '@/src/types';
import { toast } from 'sonner';

export function AICenter() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Bonjour ! Je suis votre assistant HypeRemote IA. Comment puis-je vous aider aujourd'hui ? Je peux analyser vos appareils, vous aider avec les tickets ou suggérer des optimisations de sécurité.",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateAIResponse(input);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error("Erreur de connexion à l'IA. Vérifiez votre clé API.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const aiInsights = [
    {
      title: "Analyse de Sécurité",
      description: "3 serveurs n'ont pas reçu les derniers correctifs critiques.",
      icon: ShieldCheck,
      color: "text-brand-green",
      bg: "bg-brand-green/10"
    },
    {
      title: "Prédiction de Panne",
      description: "Le disque dur du poste 'PC-MARKETING-01' montre des signes de fatigue.",
      icon: AlertCircle,
      color: "text-rose-500",
      bg: "bg-rose-50"
    },
    {
      title: "Optimisation Réseau",
      description: "Le trafic sur le site 'Main Office' est saturé à 85% entre 14h et 16h.",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-50"
    }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] bg-background">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Chat Section */}
        <div className="flex-1 flex flex-col bg-card border-r border-border">
          <div className="p-4 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-sm border border-primary/20">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground tracking-tight">Assistant IA</h2>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">En ligne</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary rounded-xl h-9">
              Effacer l'historique
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4 lg:p-6" viewportRef={scrollRef}>
            <div className="space-y-6 max-w-3xl mx-auto">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 lg:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    msg.role === 'assistant' ? 'bg-brand-navy text-white' : 'bg-primary text-white'
                  }`}>
                    {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                  </div>
                  <div className={`flex flex-col space-y-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                    <div className={`p-3 lg:p-4 rounded-2xl text-sm leading-relaxed shadow-sm border ${
                      msg.role === 'assistant' 
                        ? 'bg-muted/30 border-border text-foreground rounded-tl-none' 
                        : 'bg-primary text-primary-foreground border-primary/20 rounded-tr-none'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4"
                >
                  <div className="w-10 h-10 rounded-2xl bg-brand-navy text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bot size={18} />
                  </div>
                  <div className="bg-muted/30 border border-border p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground font-medium italic">L'IA réfléchit...</span>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 lg:p-6 border-t border-border bg-muted/10">
            <div className="max-w-3xl mx-auto relative">
              <Input
                placeholder="Posez une question sur votre infrastructure..."
                className="pr-14 h-14 rounded-2xl border-border bg-card shadow-lg focus:ring-2 focus:ring-primary/20 text-sm font-medium text-foreground"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl h-10 w-10 shadow-md transition-all active:scale-95"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
              >
                <Send size={18} />
              </Button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-3 font-bold uppercase tracking-[0.1em]">
              Propulsé par Gemini 3.1 Flash • HypeRemote Intelligence
            </p>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="hidden lg:flex w-80 flex-col p-6 space-y-6 overflow-y-auto bg-background">
          <div>
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Insights Prédictifs</h3>
            <div className="space-y-4">
              {aiInsights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <Card className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group bg-card">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3 space-y-0">
                      <div className={`p-2 rounded-xl ${insight.bg} ${insight.color} group-hover:scale-110 transition-transform`}>
                        <insight.icon size={16} />
                      </div>
                      <CardTitle className="text-sm font-bold text-foreground">{insight.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                        {insight.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Capacités IA</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-card border-border text-[10px] font-bold py-1 px-3 rounded-lg text-muted-foreground">Analyse de Logs</Badge>
              <Badge variant="secondary" className="bg-card border-border text-[10px] font-bold py-1 px-3 rounded-lg text-muted-foreground">Audit Sécurité</Badge>
              <Badge variant="secondary" className="bg-card border-border text-[10px] font-bold py-1 px-3 rounded-lg text-muted-foreground">Scripts Auto</Badge>
              <Badge variant="secondary" className="bg-card border-border text-[10px] font-bold py-1 px-3 rounded-lg text-muted-foreground">Support N1</Badge>
            </div>
          </div>

          <Card className="bg-brand-navy text-white border-none rounded-2xl shadow-xl shadow-brand-navy/20 overflow-hidden relative">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
            <CardHeader className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <BrainCircuit size={16} className="text-brand-blue" />
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-blue">Statut du Modèle</span>
              </div>
              <CardTitle className="text-lg font-bold">IA Optimisée</CardTitle>
              <CardDescription className="text-white/60 text-xs font-medium">
                Votre instance Gemini est configurée pour l'analyse IT haute performance.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
