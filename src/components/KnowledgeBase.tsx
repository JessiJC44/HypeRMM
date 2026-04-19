import * as React from 'react';
import { BookOpen, Search, Filter, Plus, FileText, Video, HelpCircle, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import { toast } from 'sonner';

export function KnowledgeBase() {
  const [articles, setArticles] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      
      const queryParams = new URLSearchParams();
      if (selectedCategory) queryParams.append('category', selectedCategory);
      if (search) queryParams.append('search', search);

      const response = await fetch(`/api/kb/articles?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch articles');
      const data = await response.json();
      setArticles(data);
    } catch (err) {
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const response = await fetch('/api/kb/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    fetchCategories();
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchArticles();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  const defaultCategories = [
    { name: 'Getting Started', icon: HelpCircle },
    { name: 'Agent Installation', icon: FileText },
    { name: 'Remote Access', icon: Video },
    { name: 'Patch Management', icon: FileText },
    { name: 'Network Discovery', icon: Search },
    { name: 'Billing & Account', icon: HelpCircle },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 bg-background min-h-screen animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto py-4 lg:py-8"
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Knowledge Base</h1>
        <p className="text-muted-foreground text-sm lg:text-base">Search for help articles, video tutorials, and best practices.</p>
        <div className="relative w-full mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for articles, guides, and more..." 
            className="pl-12 h-12 lg:h-14 rounded-2xl border-border bg-card shadow-sm text-base lg:text-lg focus:ring-primary text-foreground" 
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {defaultCategories.map((cat, index) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card 
              className={cn(
                "border-none shadow-sm hover:shadow-md transition-all cursor-pointer group h-full bg-card active:scale-[0.98]",
                selectedCategory === cat.name && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-2xl transition-colors",
                  selectedCategory === cat.name ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                )}>
                  <cat.icon size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground font-medium">Click to filter</p>
                </div>
                <ChevronRight size={18} className={cn(
                  "transition-colors",
                  selectedCategory === cat.name ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                )} />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <FileText size={20} className="text-primary" />
              {selectedCategory ? `${selectedCategory} Articles` : 'Recent Articles'}
            </h2>
            {loading && <Loader2 className="animate-spin text-primary" size={20} />}
          </div>
          
          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden divide-y divide-border min-h-[200px]">
            <AnimatePresence mode="popLayout">
              {articles.length === 0 && !loading ? (
                <div className="p-12 text-center text-muted-foreground font-medium italic">
                  No articles found for this search/category.
                </div>
              ) : (
                articles.map((article, index) => (
                  <motion.div 
                    key={article.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-muted/20 transition-colors cursor-pointer group"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">{article.title}</h4>
                        <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-wider">
                          {article.category} • {new Date(article.createdAt?._seconds * 1000 || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                      <ExternalLink size={14} className="text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
          <Button variant="ghost" className="w-full text-primary font-bold hover:bg-primary/10">View All Articles</Button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Video size={20} className="text-purple-500" />
            Video Tutorials
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {[1, 2].map((i, index) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + (index * 0.1) }}
                className="relative aspect-video bg-muted rounded-2xl overflow-hidden group cursor-pointer"
              >
                <img 
                  src={`https://picsum.photos/seed/rmm-video-${i}/640/360`} 
                  alt="Video thumbnail" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-primary border-b-[8px] border-b-transparent ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white font-bold text-sm">Mastering the Agent Console</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
