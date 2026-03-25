import { useState } from "react";
import { 
  useListSessions, 
  useCreateSession, 
  useStartSession, 
  useStopSession, 
  useDeleteSession 
} from "@workspace/api-client-react";
import { CyberCard } from "@/components/ui/cyber-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, Square, Trash2, Plus, TerminalSquare, 
  Smartphone, Clock, RefreshCw 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Sessions() {
  const { toast } = useToast();
  const { data, refetch } = useListSessions({ query: { refetchInterval: 5000 } });
  const [newSessionName, setNewSessionName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const createMut = useCreateSession({
    mutation: {
      onSuccess: () => {
        toast({ title: "Session Allocated", description: "New instance created." });
        setNewSessionName("");
        setIsDialogOpen(false);
        refetch();
      }
    }
  });

  const startMut = useStartSession({
    mutation: { onSuccess: () => { toast({ title: "Sequence Initiated" }); refetch(); } }
  });
  const stopMut = useStopSession({
    mutation: { onSuccess: () => { toast({ title: "Sequence Terminated" }); refetch(); } }
  });
  const delMut = useDeleteSession({
    mutation: { onSuccess: () => { toast({ title: "Instance Purged" }); refetch(); } }
  });

  const sessions = data?.sessions || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl text-primary font-mono glow-text">SESSION_MANAGER</h1>
          <p className="text-muted-foreground font-mono mt-1">Manage multiple WhatsApp instances</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="cyber-button font-mono bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> ALLOCATE_NEW
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-primary/30">
            <DialogHeader>
              <DialogTitle className="font-mono text-primary text-xl">NEW_SESSION_INSTANCE</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="font-mono text-muted-foreground">INSTANCE_ID (optional)</Label>
                <Input 
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="e.g. support-bot"
                  className="bg-black/50 border-primary/30 font-mono"
                />
              </div>
              <Button 
                onClick={() => createMut.mutate({ data: { name: newSessionName } })}
                disabled={createMut.isPending}
                className="w-full cyber-button font-mono"
              >
                {createMut.isPending ? 'PROCESSING...' : 'EXECUTE'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sessions.length === 0 ? (
        <CyberCard className="py-20 text-center flex flex-col items-center">
          <TerminalSquare className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-mono text-primary">NO_ACTIVE_SESSIONS</h3>
          <p className="text-muted-foreground font-mono mt-2">Allocate a new instance to begin.</p>
        </CyberCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sessions.map((session, i) => (
            <CyberCard key={session.id} delay={i * 0.1} className="flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${session.connected ? 'bg-primary animate-pulse shadow-[0_0_10px_#00c8ff]' : 'bg-muted-foreground'}`} />
                  <h3 className="font-mono font-bold text-lg truncate max-w-[150px]" title={session.id}>
                    {session.id}
                  </h3>
                </div>
                <div className="text-xs font-mono px-2 py-1 rounded bg-black/40 border border-primary/20 text-primary">
                  {session.type || 'MAIN'}
                </div>
              </div>

              <div className="space-y-3 mb-6 flex-1 font-mono text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>{session.phoneNumber || 'Unpaired'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Last seen: {session.lastConnected ? formatDistanceToNow(session.lastConnected) + ' ago' : 'Never'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Auto-restart: <span className={session.autoRestart ? 'text-primary' : ''}>{session.autoRestart ? 'ON' : 'OFF'}</span></span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-primary/10">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => startMut.mutate({ id: session.id })}
                  disabled={session.connected || startMut.isPending}
                  className="font-mono text-xs border-primary/30 hover:bg-primary/20 hover:text-primary"
                >
                  <Play className="w-3 h-3 mr-1" /> BOOT
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => stopMut.mutate({ id: session.id })}
                  disabled={!session.connected || stopMut.isPending}
                  className="font-mono text-xs border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-500"
                >
                  <Square className="w-3 h-3 mr-1" /> HALT
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    if(confirm('Purge this instance entirely?')) delMut.mutate({ id: session.id });
                  }}
                  disabled={delMut.isPending}
                  className="font-mono text-xs border-destructive/30 hover:bg-destructive/20 text-destructive"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> PURGE
                </Button>
              </div>
            </CyberCard>
          ))}
        </div>
      )}
    </div>
  );
}
