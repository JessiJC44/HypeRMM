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
import { auth } from '../lib/firebase';
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

export function Scripts() {
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
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/scripts/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          description: aiPrompt,
          language: editingScript?.language,
          targetOs: editingScript?.targetOs?.[0] || 'windows'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setEditingScript(prev => ({ ...prev, content: data.content }));
        toast.success('Script generated!');
      } else {
        toast.error('AI generation failed');
      }
    } catch (error) {
      toast.error('Error connecting to AI service');
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
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 animate-in fade-in duration-500">
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

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader className="bg-muted/10 border-b border-border p-0">
            <div className="px-8 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <TabsList className="bg-transparent h-12 gap-8">
                <TabsTrigger value="my-scripts" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-2 font-black uppercase tracking-widest text-[11px]">
                  My Scripts ({scripts.length})
                </TabsTrigger>
                <TabsTrigger value="shared" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-12 px-2 font-black uppercase tracking-widest text-[11px]">
                  Shared Library ({sharedScripts.length})
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-3 pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    placeholder="Search scripts..." 
                    className="pl-10 h-10 w-full md:w-64 rounded-xl bg-muted/20 border-border font-bold text-xs"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-10 w-32 rounded-xl border-border bg-muted/20 font-bold text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Categories</SelectItem>
                    {(categories as string[]).map(c => <SelectItem key={c} value={c}>{(c as string).charAt(0).toUpperCase() + (c as string).slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TabsContent value="my-scripts" className="m-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="font-black uppercase tracking-widest text-[10px] py-4 pl-8">Name</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">Language</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">Category</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">OS</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">Stats</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px] text-right pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <RefreshCw className="animate-spin mx-auto text-primary" size={24} />
                      </TableCell>
                    </TableRow>
                  ) : filteredScripts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                        No scripts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredScripts.map((script) => (
                      <TableRow key={script.id} className="group border-border hover:bg-muted/20 transition-colors">
                        <TableCell className="py-4 pl-8">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-primary/5 text-primary rounded-xl border border-primary/10 group-hover:scale-110 transition-transform">
                              <FileCode2 size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-foreground">{script.name}</p>
                              <p className="text-[10px] text-muted-foreground font-medium line-clamp-1 max-w-[200px]">{script.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg font-black uppercase text-[9px] tracking-widest border-border text-muted-foreground">
                            {script.language === 'powershell' ? 'PS1' : (script.language === 'bash' ? 'SH' : 'PY')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{script.category}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {script.targetOs.map(os => (
                              <div key={os} title={os} className="p-1 rounded bg-muted/50">
                                <Monitor size={10} className="text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-black text-foreground">{script.runCount || 0} runs</span>
                            <span className="text-[9px] font-medium text-muted-foreground">
                              {script.lastRunAt ? `Last: ${new Date(script.lastRunAt).toLocaleDateString()}` : 'Never run'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                setRunningScript(script);
                                // Trigger device fetch
                                const fetchDevices = async () => {
                                  const idToken = await auth.currentUser?.getIdToken();
                                  if (!idToken) return;
                                  const res = await fetch('/api/flux/devices', { headers: { 'Authorization': `Bearer ${idToken}` } });
                                  if (res.ok) {
                                    const data = await res.json();
                                    setDevices(data.filter((d: any) => d.status === 'online'));
                                  }
                                };
                                fetchDevices();
                              }}
                              className="h-9 w-9 rounded-xl text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                            >
                              <Play size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setEditingScript(script)} className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5">
                              <Edit size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(script.id)} className="h-9 w-9 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="shared" className="m-0">
               <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="font-black uppercase tracking-widest text-[10px] py-4 pl-8">Name</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">Language</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">Category</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">OS</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px] text-right pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <RefreshCw className="animate-spin mx-auto text-primary" size={24} />
                      </TableCell>
                    </TableRow>
                  ) : sharedScripts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                        Community shared library is empty or unavailable
                      </TableCell>
                    </TableRow>
                  ) : (
                    sharedScripts.map((script) => (
                      <TableRow key={script.id} className="group border-border hover:bg-muted/20 transition-colors">
                        <TableCell className="py-4 pl-8">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-muted text-muted-foreground rounded-xl border border-border group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/20 transition-all">
                              <Globe size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-foreground">{script.name}</p>
                              <p className="text-[10px] text-muted-foreground font-medium line-clamp-1 max-w-[300px]">{script.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                           <Badge variant="outline" className="rounded-lg font-black uppercase text-[9px] tracking-widest border-border text-muted-foreground">
                            {script.language === 'powershell' ? 'PS1' : (script.language === 'bash' ? 'SH' : 'PY')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{script.category}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {script.targetOs.map(os => (
                              <div key={os} title={os} className="p-1 rounded bg-muted/50">
                                <Monitor size={10} className="text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleClone(script.id, true)} 
                            className="rounded-xl font-bold uppercase text-[9px] tracking-widest h-8 px-4 border-primary text-primary hover:bg-primary/5"
                          >
                            <Copy size={12} className="mr-2" />
                            Clone To library
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

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
