import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';

// Fallback Textarea component if not available in ui
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

import { Search, Plus, FileCode2, Play, Edit, Trash2, Library, Copy, Check, ChevronRight, Globe, Monitor, Terminal, Wand2, RefreshCw, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { generateScript } from '../services/geminiService';
import { auth, db } from '../lib/firebase';
import { useLanguage } from '../contexts/LanguageContext';

interface Script {
  id: string;
  name: string;
  description: string;
  category: string;
  language: 'powershell' | 'bash' | 'python';
  fileExtension: string;
  content: string;
  variables: { name: string; defaultValue: string; description: string }[];
  targetOs: ('windows' | 'mac' | 'linux')[];
  aiCopilotEnabled: boolean;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  runCount: number;
}

export function Scripts({ hideHeader = false }: { hideHeader?: boolean }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = React.useState('my-scripts');
  const [scripts, setScripts] = React.useState<Script[]>([]);
  const [sharedScripts, setSharedScripts] = React.useState<Script[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [filterOs, setFilterOs] = React.useState('all');

  // Editor State
  const [editingScript, setEditingScript] = React.useState<Partial<Script> | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  
  // AI Copilot State
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Run State
  const [runningScript, setRunningScript] = React.useState<Script | null>(null);
  const [selectedDevices, setSelectedDevices] = React.useState<string[]>([]);
  const [variableValues, setVariableValues] = React.useState<Record<string, string>>({});
  const [devices, setDevices] = React.useState<any[]>([]);

  const fetchScripts = async () => {
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const [myRes, sharedRes] = await Promise.all([
        fetch('/api/scripts', { headers: { 'Authorization': `Bearer ${idToken}` } }),
        fetch('/api/scripts/shared', { headers: { 'Authorization': `Bearer ${idToken}` } })
      ]);

      if (myRes.ok) setScripts(await myRes.json());
      if (sharedRes.ok) setSharedScripts(await sharedRes.json());
    } catch (error) {
      console.error('Fetch scripts error:', error);
      toast.error('Failed to load scripts');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchScripts();
    
    // Fetch devices for "Run" dialog
    const fetchDevices = async () => {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;
      
      const res = await fetch('/api/flux/devices', { 
        headers: { 'Authorization': `Bearer ${idToken}` } 
      });
      if (res.ok) {
        const data = await res.json();
        setDevices(data.filter((d: any) => d.status === 'online'));
      }
    };
    // fetchDevices(); // We'll trigger this when opening the run dialog to save tokens
  }, []);

  const handleCreateNew = () => {
    setEditingScript({
      name: '',
      description: '',
      category: 'maintenance',
      language: 'powershell',
      fileExtension: '.ps1',
      content: '# New script\n',
      variables: [],
      targetOs: ['windows'],
      aiCopilotEnabled: true
    });
  };

  const handleSave = async () => {
    if (!editingScript?.name || !editingScript?.content) {
      toast.error('Name and content are required');
      return;
    }

    setIsSaving(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const isUpdate = !!editingScript.id;
      const url = isUpdate ? `/api/scripts/${editingScript.id}` : '/api/scripts';
      const method = isUpdate ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(editingScript)
      });

      if (res.ok) {
        toast.success(isUpdate ? 'Script updated' : 'Script created');
        setEditingScript(null);
        fetchScripts();
      } else {
        toast.error('Failed to save script');
      }
    } catch (error) {
      toast.error('Error saving script');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this script?')) return;

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/scripts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });

      if (res.ok) {
        toast.success('Script deleted');
        fetchScripts();
      }
    } catch (error) {
      toast.error('Failed to delete script');
    }
  };

  const handleClone = async (id: string, isShared: boolean) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const url = isShared ? `/api/scripts/shared/${id}/clone` : `/api/scripts/${id}/clone`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });

      if (res.ok) {
        toast.success('Script cloned successfully');
        fetchScripts();
        setActiveTab('my-scripts');
      }
    } catch (error) {
      toast.error('Failed to clone script');
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const content = await generateScript(
        aiPrompt, 
        editingScript?.language || 'powershell', 
        editingScript?.targetOs?.[0] || 'windows'
      );
      setEditingScript(prev => ({ ...prev, content }));
      toast.success('Script generated!');
    } catch (error) {
      toast.error('AI generation failed');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRun = async () => {
    if (!runningScript || selectedDevices.length === 0) return;

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/scripts/${runningScript.id}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          deviceIds: selectedDevices,
          variableValues
        })
      });

      if (res.ok) {
        toast.success('Script execution queued on offline devices');
        setRunningScript(null);
        setSelectedDevices([]);
        setVariableValues({});
      }
    } catch (error) {
      toast.error('Failed to queue script');
    }
  };

  const filteredScripts = scripts.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || s.category === filterCategory;
    const matchesOs = filterOs === 'all' || s.targetOs.includes(filterOs as any);
    return matchesSearch && matchesCategory && matchesOs;
  });

  const categories = Array.from(new Set(scripts.map(s => s.category).concat(['maintenance', 'security', 'installation', 'monitoring', 'inventory'])));

  if (editingScript) {
    return (
      <div className="p-4 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setEditingScript(null)} className="rounded-xl">
              <X size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">
                {editingScript.id ? 'Edit Script' : 'Create Script'}
              </h1>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                {editingScript.language} • {editingScript.fileExtension}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setEditingScript(null)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-10 px-6">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-8 shadow-lg shadow-primary/10">
              {isSaving ? <><RefreshCw className="animate-spin mr-2" size={14} /> Saving...</> : 'Save Script'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-card">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Properties</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Script Name</Label>
                  <Input 
                    value={editingScript.name} 
                    onChange={e => setEditingScript(prev => ({ ...prev, name: e.target.value }))}
                    className="rounded-xl border-border bg-muted/20 font-bold" 
                    placeholder="e.g. Cleanup Temp Files"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Description</Label>
                  <Textarea 
                    value={editingScript.description} 
                    onChange={e => setEditingScript(prev => ({ ...prev, description: e.target.value }))}
                    className="rounded-xl border-border bg-muted/20 font-medium text-sm h-24 resize-none" 
                    placeholder="Explain what this script does..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Language</Label>
                  <Select 
                    value={editingScript.language} 
                    onValueChange={(v: any) => setEditingScript(prev => ({ ...prev, language: v, fileExtension: v === 'powershell' ? '.ps1' : (v === 'bash' ? '.sh' : '.py') }))}
                  >
                    <SelectTrigger className="rounded-xl border-border bg-muted/20 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="powershell">PowerShell</SelectItem>
                      <SelectItem value="bash">Bash</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Category</Label>
                  <Select value={editingScript.category} onValueChange={v => setEditingScript(prev => ({ ...prev, category: v }))}>
                    <SelectTrigger className="rounded-xl border-border bg-muted/20 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {(categories as string[]).map(c => <SelectItem key={c} value={c}>{(c as string).charAt(0).toUpperCase() + (c as string).slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-primary/5 border border-primary/10">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-primary">
                  <Wand2 size={16} />
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest">AI Copilot</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[10px] text-muted-foreground font-bold">
                  Describe what you want the script to do, and AI will generate the code for you.
                </p>
                <Textarea 
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  className="rounded-xl border-primary/20 bg-background/50 text-xs font-medium resize-none h-20"
                  placeholder="e.g. Delete all files in C:\Temp older than 7 days"
                />
                <Button 
                  onClick={handleAiGenerate}
                  disabled={isGenerating || !aiPrompt}
                  className="w-full bg-primary text-primary-foreground rounded-xl h-9 text-[10px] font-black uppercase tracking-widest"
                >
                  {isGenerating ? <><RefreshCw className="animate-spin mr-2" size={12} /> Generating...</> : "Generate Script"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-card h-full flex flex-col">
              <CardHeader className="border-b border-border bg-muted/10 px-8 py-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal size={18} className="text-primary" />
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Editor</CardTitle>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Target OS:</span>
                    <div className="flex gap-1">
                      {['windows', 'mac', 'linux'].map(os => (
                        <button
                          key={os}
                          onClick={() => {
                            const current = editingScript.targetOs || [];
                            const next = current.includes(os as any) 
                              ? current.filter(o => o !== os) 
                              : [...current, os as any];
                            setEditingScript(prev => ({ ...prev, targetOs: next }));
                          }}
                          className={cn(
                            "w-6 h-6 rounded-md flex items-center justify-center transition-colors",
                            editingScript.targetOs?.includes(os as any) 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted text-muted-foreground hover:bg-muted-foreground/10"
                          )}
                        >
                          <Monitor size={12} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <div className="flex-1 bg-zinc-950 font-mono text-sm min-h-[500px]">
                <CodeMirror
                  value={editingScript.content}
                  height="100%"
                  theme="dark"
                  extensions={[javascript()]}
                  onChange={(val) => setEditingScript(prev => ({ ...prev, content: val }))}
                  className="h-full outline-none"
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 animate-in fade-in duration-500", !hideHeader && "p-4 lg:p-8")}>
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">Script Library</h1>
            <p className="text-sm text-muted-foreground font-bold">Manage, organize, and execute automation scripts.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => fetchScripts()} className="rounded-xl h-11 px-6 font-bold text-muted-foreground border-border">
              <RefreshCw size={18} className={cn("mr-2", loading && "animate-spin")} />
              Sync
            </Button>
            <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl h-11 px-8 font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
              <Plus size={20} className="mr-2" />
              Create Script
            </Button>
          </div>
        </div>
      )}

      {hideHeader && (
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <FileCode2 size={20} />
            </div>
            <h2 className="text-lg font-black text-foreground uppercase tracking-widest">Script Repository</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => fetchScripts()} className="rounded-xl h-9 px-4 font-bold text-muted-foreground border-border text-[10px] uppercase tracking-widest">
              <RefreshCw size={14} className={cn("mr-2", loading && "animate-spin")} />
              Sync
            </Button>
            <Button size="sm" onClick={handleCreateNew} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-9 px-4 font-black uppercase tracking-widest text-[10px]">
              <Plus size={16} className="mr-2" />
              Create
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-muted/20 p-1 rounded-2xl h-12">
              <TabsTrigger value="my-scripts" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-black uppercase tracking-widest text-[10px]">
                My Scripts
              </TabsTrigger>
              <TabsTrigger value="shared" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-black uppercase tracking-widest text-[10px]">
                Marketplace
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input 
                  placeholder="Filter scripts..." 
                  className="pl-9 h-10 w-full md:w-48 rounded-xl bg-muted/20 border-border font-bold text-xs"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-10 w-32 rounded-xl border-border bg-muted/20 font-bold text-[10px] uppercase tracking-widest">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All</SelectItem>
                  {(categories as string[]).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="my-scripts" className="m-0 outline-none">
            {loading ? (
              <div className="py-24 text-center">
                <RefreshCw className="animate-spin mx-auto text-primary mb-4" size={32} />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loading scripts...</p>
              </div>
            ) : filteredScripts.length === 0 ? (
              <div className="py-24 text-center border-2 border-dashed border-border rounded-3xl">
                <FileCode2 className="mx-auto text-muted-foreground/20 mb-4" size={48} />
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">No matching scripts found</p>
                <Button variant="link" onClick={handleCreateNew} className="mt-2 text-primary uppercase text-[10px] font-black">Create your first script</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredScripts.map((script) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={script.id}
                  >
                    <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden group bg-card border border-border/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className={cn(
                            "p-3 rounded-2xl transition-colors",
                            script.language === 'powershell' ? "bg-blue-500/10 text-blue-500" : 
                            script.language === 'bash' ? "bg-zinc-500/10 text-zinc-500" : "bg-amber-500/10 text-amber-500"
                          )}>
                            <FileCode2 size={24} />
                          </div>
                          <div className="flex gap-1">
                            {script.targetOs.map(os => (
                              <div key={os} className="p-1.5 bg-muted/50 rounded-lg" title={os}>
                                <Monitor size={12} className="text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4">
                          <h4 className="text-lg font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{script.name}</h4>
                          <p className="text-xs text-muted-foreground font-medium line-clamp-2 mt-1 min-h-[32px]">{script.description}</p>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Lang:</span>
                            <span className="text-foreground">{script.language === 'powershell' ? 'PS1' : (script.language === 'bash' ? 'SH' : 'PY')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Runs:</span>
                            <span className="text-foreground">{script.runCount || 0}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                          <Button 
                            onClick={() => {
                              setRunningScript(script);
                              const fetchDevices = async () => {
                                const idToken = await auth.currentUser?.getIdToken();
                                if (!idToken) return;
                                const res = await fetch('/api/agent/devices', { headers: { 'Authorization': `Bearer ${idToken}` } });
                                if (res.ok) {
                                  const data = await res.json();
                                  setDevices(data.filter((d: any) => d.status === 'online'));
                                }
                              };
                              fetchDevices();
                            }}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-10 font-black uppercase text-[10px] tracking-widest"
                          >
                            <Play size={14} className="mr-2" />
                            Run
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => setEditingScript(script)}
                            className="w-10 h-10 rounded-xl border-border text-muted-foreground hover:text-primary hover:bg-primary/5"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleDelete(script.id)}
                            className="w-10 h-10 rounded-xl border-border text-muted-foreground hover:text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="shared" className="m-0 outline-none">
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sharedScripts.map((script) => (
                   <Card key={script.id} className="border-none shadow-sm rounded-3xl overflow-hidden group bg-card border border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="p-3 rounded-2xl bg-primary/5 text-primary">
                          <Globe size={24} />
                        </div>
                        <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase">Community</Badge>
                      </div>
                      <div className="mt-4">
                        <h4 className="text-lg font-black text-foreground tracking-tight">{script.name}</h4>
                        <p className="text-xs text-muted-foreground font-medium line-clamp-2 mt-1 min-h-[32px]">{script.description}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <span>{script.language === 'powershell' ? 'PowerShell' : (script.language === 'bash' ? 'Bash' : 'Python')}</span>
                        <span>•</span>
                        <span>{script.targetOs.join(', ')}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => handleClone(script.id, true)} 
                        className="w-full rounded-xl h-10 font-black uppercase text-[10px] tracking-widest border-primary text-primary hover:bg-primary/5"
                      >
                        <Copy size={14} className="mr-2" />
                        Clone to Library
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {sharedScripts.length === 0 && !loading && (
                   <div className="col-span-full py-24 text-center border-2 border-dashed border-border rounded-3xl">
                      <Globe className="mx-auto text-muted-foreground/20 mb-4" size={48} />
                      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Marketplace currently unavailable</p>
                   </div>
                )}
             </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Run Script Dialog */}
      <Dialog open={!!runningScript} onOpenChange={open => !open && setRunningScript(null)}>
        <DialogContent className="max-w-xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-primary/5 border-b border-primary/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                <Play size={24} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight">{runningScript?.name}</DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Run on Target Devices</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-8 space-y-6">
            {runningScript?.variables && runningScript.variables.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Variables</h4>
                <div className="grid grid-cols-1 gap-4">
                  {runningScript.variables.map(v => (
                    <div key={v.name} className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-widest flex items-center justify-between">
                        {v.name}
                        <span className="text-muted-foreground font-medium lowercase tracking-normal italic">{v.description}</span>
                      </Label>
                      <Input 
                        defaultValue={v.defaultValue}
                        onChange={e => setVariableValues(prev => ({ ...prev, [v.name]: e.target.value }))}
                        className="rounded-xl border-border bg-muted/20 font-bold h-10"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Target Devices</h4>
               <ScrollArea className="h-48 rounded-2xl border border-border bg-muted/10">
                  <div className="p-4 space-y-2">
                    {devices.map(device => (
                      <div 
                        key={device.id} 
                        onClick={() => {
                          setSelectedDevices(prev => 
                            prev.includes(device.id) ? prev.filter(id => id !== device.id) : [...prev, device.id]
                          );
                        }}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                          selectedDevices.includes(device.id) 
                            ? "bg-primary/10 border-primary text-primary shadow-sm" 
                            : "bg-background border-transparent hover:border-border text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Monitor size={16} />
                          <div className="flex flex-col">
                            <span className="text-sm font-black">{device.name}</span>
                            <span className="text-[10px] font-medium opacity-70">{device.os} • {device.ip}</span>
                          </div>
                        </div>
                        {selectedDevices.includes(device.id) && <Check size={16} />}
                      </div>
                    ))}
                    {devices.length === 0 && (
                      <div className="py-12 text-center space-y-2">
                        <AlertCircle className="mx-auto text-muted-foreground opacity-20" size={32} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No online devices found</p>
                      </div>
                    )}
                  </div>
               </ScrollArea>
               <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider text-right">
                  {selectedDevices.length} devices selected
               </p>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 bg-background">
            <Button variant="ghost" onClick={() => setRunningScript(null)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-6 h-12">Cancel</Button>
            <Button 
              onClick={handleRun}
              disabled={selectedDevices.length === 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black uppercase text-xs tracking-widest h-12 px-10 shadow-lg shadow-primary/20"
            >
              Run Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
