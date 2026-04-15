import * as React from 'react';
import { BookOpen, Search, Filter, Plus, FileText, Video, HelpCircle, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';

export function KnowledgeBase() {
  const categories = [
    { name: 'Getting Started', count: 12, icon: HelpCircle },
    { name: 'Agent Installation', count: 8, icon: FileText },
    { name: 'Remote Access', count: 15, icon: Video },
    { name: 'Patch Management', count: 10, icon: FileText },
    { name: 'Network Discovery', count: 6, icon: Search },
    { name: 'Billing & Account', count: 4, icon: HelpCircle },
  ];

  const recentArticles = [
    { title: 'How to install the HypeRemote agent on macOS', category: 'Agent Installation', date: '2 days ago' },
    { title: 'Configuring Flux for remote access', category: 'Remote Access', date: '5 days ago' },
    { title: 'Best practices for patch automation', category: 'Patch Management', date: '1 week ago' },
    { title: 'Troubleshooting network discovery issues', category: 'Network Discovery', date: '2 weeks ago' },
  ];

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto py-8"
      >
        <h1 className="text-3xl font-bold text-foreground">Knowledge Base</h1>
        <p className="text-muted-foreground">Search for help articles, video tutorials, and best practices.</p>
        <div className="relative w-full mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input 
            placeholder="Search for articles, guides, and more..." 
            className="pl-12 h-14 rounded-2xl border-border bg-card shadow-sm text-lg focus:ring-primary text-foreground" 
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group h-full bg-card">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <cat.icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground font-medium">{cat.count} articles</p>
                </div>
                <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
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
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            Recent Articles
          </h2>
          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden divide-y divide-border">
            {recentArticles.map((article, index) => (
              <motion.div 
                key={article.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + (index * 0.1) }}
                className="p-4 hover:bg-muted/20 transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{article.title}</h4>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-wider">{article.category} • {article.date}</p>
                  </div>
                  <ExternalLink size={14} className="text-muted-foreground" />
                </div>
              </motion.div>
            ))}
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
