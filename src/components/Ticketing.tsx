import * as React from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Clock,
  User,
  MessageSquare
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Ticket } from '@/src/types';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { motion } from 'motion/react';
import { toast } from 'sonner';

import { firestoreService } from '../services/firestoreService';

import { auth } from '../lib/firebase';

export function Ticketing() {
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newTicket, setNewTicket] = React.useState({
    title: '',
    customer: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    assignedTo: 'John Doe'
  });

  React.useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = firestoreService.subscribeToTickets(user.uid, (data) => {
      setTickets(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      await firestoreService.addTicket(user.uid, {
        ...newTicket,
        status: 'open'
      });
      toast.success("Ticket created successfully");
      setIsAddDialogOpen(false);
      setNewTicket({
        title: '',
        customer: '',
        priority: 'medium',
        assignedTo: 'John Doe'
      });
    } catch (error) {
      toast.error("Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-brand-blue/10 text-brand-blue border-brand-blue/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-brand-green/10 text-brand-green border-brand-green/20';
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'resolved': return 'bg-brand-blue/10 text-brand-blue border-brand-blue/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-8 bg-background min-h-screen animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Ticketing System</h1>
          <p className="text-sm text-muted-foreground font-medium">Manage and track IT support requests from all customers.</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger
                  render={
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 h-11 font-bold shadow-lg shadow-primary/10 gap-2 transition-all hover:scale-[1.02] active:scale-95 w-full sm:w-auto">
                      <Plus size={18} />
                      New Ticket
                    </Button>
                  }
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Create a new support request for a customer.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create New Ticket</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Fill in the details to open a new support request.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTicket} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium text-foreground">Issue Title</label>
                <Input 
                  id="title" 
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                  placeholder="e.g. Cannot connect to VPN" 
                  className="bg-muted/20 border-border text-foreground"
                  required 
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="customer" className="text-sm font-medium text-foreground">Customer Name</label>
                <Input 
                  id="customer" 
                  value={newTicket.customer}
                  onChange={(e) => setNewTicket({...newTicket, customer: e.target.value})}
                  placeholder="e.g. Acme Corp" 
                  className="bg-muted/20 border-border text-foreground"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="priority" className="text-sm font-medium text-foreground">Priority</label>
                  <select 
                    id="priority"
                    className="flex h-10 w-full rounded-md border border-border bg-muted/20 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground"
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                  >
                    <option value="low" className="bg-card">Low</option>
                    <option value="medium" className="bg-card">Medium</option>
                    <option value="high" className="bg-card">High</option>
                    <option value="critical" className="bg-card">Critical</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="assigned" className="text-sm font-medium text-foreground">Assign To</label>
                  <Input 
                    id="assigned" 
                    value={newTicket.assignedTo}
                    onChange={(e) => setNewTicket({...newTicket, assignedTo: e.target.value})}
                    placeholder="Staff Name" 
                    className="bg-muted/20 border-border text-foreground"
                    required 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {isSubmitting ? 'Creating...' : 'Create Ticket'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row items-center gap-4"
      >
        <div className="relative flex-1 w-full">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input placeholder="Search tickets..." className="pl-12 h-12 rounded-xl border-border bg-card shadow-sm focus:ring-primary text-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Search by ID, title, or customer name.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="gap-2 h-12 px-6 rounded-xl border-border bg-card font-bold text-muted-foreground hover:bg-muted/50 transition-all hover:scale-[1.02] w-full sm:w-auto">
                <Filter size={18} />
                Filters
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Apply advanced filters to the ticket list.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-border bg-card overflow-x-auto shadow-sm"
      >
        <div className="min-w-[1000px]">
          <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-b border-border">
              <TableHead className="w-[100px] text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 whitespace-nowrap">ID</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 whitespace-nowrap">Ticket Details</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 whitespace-nowrap">Customer</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 whitespace-nowrap">Status</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 whitespace-nowrap">Priority</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 whitespace-nowrap">Assigned To</TableHead>
              <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Loading tickets...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-bold uppercase tracking-widest">
                  No tickets found.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket, index) => (
                <motion.tr 
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + (index * 0.05) }}
                  className="hover:bg-muted/20 border-b border-border transition-colors group"
                >
                <TableCell className="font-mono text-[11px] font-bold text-muted-foreground whitespace-nowrap">{ticket.id}</TableCell>
                <TableCell className="py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">{ticket.title}</span>
                    <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 mt-1.5 uppercase tracking-wider">
                      <Clock size={12} className="text-primary" />
                      Opened {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-bold text-muted-foreground whitespace-nowrap">{ticket.customer}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant="outline" className={cn("capitalize rounded-full px-3 py-0.5 font-bold text-[10px] border-none", getStatusColor(ticket.status))}>
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant="outline" className={cn("capitalize rounded-full px-3 py-0.5 font-bold text-[10px] border-none", getPriorityColor(ticket.priority))}>
                    {ticket.priority}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground border border-border">
                      {ticket.assignedTo.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm font-bold text-muted-foreground">{ticket.assignedTo}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex justify-end gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                            onClick={() => toast.info(`Opening chat for ticket ${ticket.id}`)}
                          >
                            <MessageSquare size={18} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Open internal chat for this ticket.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                            onClick={() => toast.info(`Opening options for ticket ${ticket.id}`)}
                          >
                            <MoreVertical size={18} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">More ticket actions.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </motion.tr>
            )))}
          </TableBody>
        </Table>
        </div>
      </motion.div>
    </div>
  );
}
