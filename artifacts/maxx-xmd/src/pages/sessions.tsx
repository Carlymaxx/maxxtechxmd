import { useState } from "react";
import {
  useListSessions,
  useStartSession,
  useStopSession,
  useDeleteSession,
} from "@workspace/api-client-react";
import { CyberCard } from "@/components/ui/cyber-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Trash2, Smartphone, Clock, RefreshCw, Wifi, WifiOff, Bot, Zap, Shield
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Sessions() {
  const { toast } = useToast();
  const { data, refetch, isLoading } = useListSessions({ query: { refetchInterval: 4000 } });
  const [sweeping, setSweeping] = useState(false);

  const startMut = useStartSession({
    mutation: { onSuccess: () => { toast({ title: "Bot Started" }); refetch(); } }
  });
  const stopMut = useStopSession({
    mutation: { onSuccess: () => { toast({ title: "Bot Stopped" }); refetch(); } }
  });
  const delMut = useDeleteSession({
    mutation: {
      onSuccess: () => { toast({ title: "Session deleted" }); refetch(); },
      onError: () => toast({ variant: "destructive", title: "Delete failed" })
    }
  });

  const sessions = data?.sessions || [];
  const online = sessions.filter(s => s.connected);
  const offline = sessions.filter(s => !s.connected);

  async function sweepOffline() {
    setSweeping(true);
    for (const s of offline) {
      try { await delMut.mutateAsync({ id: s.id }); } catch {}
    }
    setSweeping(false);
    toast({ title: "Cleanup complete", description: `${offline.length} expired session(s) removed` });
    refetch();
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl text-primary font-mono glow-text flex items-center gap-3">
            <Bot className="w-8 h-8" />
            MAXX-XMD BOTS
          </h1>
          <p className="text-muted-foreground font-mono mt-1">
            Live deployment status — refreshes every 4s
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live counter */}
          <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-black/40 border border-primary/20 font-mono text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-primary font-bold">{online.length}</span>
              <span className="text-muted-foreground">ONLINE</span>
            </span>
            <span className="text-muted-foreground/30">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="font-bold">{offline.length}</span>
              <span className="text-muted-foreground">OFFLINE</span>
            </span>
          </div>

          {offline.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={sweepOffline}
              disabled={sweeping}
              className="font-mono text-xs border-destructive/40 hover:bg-destructive/10 text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              {sweeping ? "CLEANING..." : `CLEAN ${offline.length} EXPIRED`}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="font-mono text-xs border-primary/30 hover:bg-primary/10 text-primary"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            REFRESH
          </Button>
        </div>
      </div>

      {/* Online bots first */}
      {online.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4 font-mono text-sm text-primary">
            <Wifi className="w-4 h-4" />
            <span>CONNECTED BOTS ({online.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {online.map((session, i) => (
              <BotCard
                key={session.id}
                session={session}
                delay={i * 0.1}
                onStop={() => stopMut.mutate({ id: session.id })}
                onDelete={() => {
                  if (confirm(`Delete session "${session.id}"?`)) delMut.mutate({ id: session.id });
                }}
                stopping={stopMut.isPending}
                deleting={delMut.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Offline sessions */}
      {offline.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4 font-mono text-sm text-muted-foreground">
            <WifiOff className="w-4 h-4" />
            <span>OFFLINE / EXPIRED ({offline.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {offline.map((session, i) => (
              <BotCard
                key={session.id}
                session={session}
                delay={i * 0.08}
                onStart={() => startMut.mutate({ id: session.id })}
                onDelete={() => {
                  if (confirm(`Delete session "${session.id}"?`)) delMut.mutate({ id: session.id });
                }}
                starting={startMut.isPending}
                deleting={delMut.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sessions.length === 0 && (
        <CyberCard className="py-24 text-center flex flex-col items-center">
          <Bot className="w-20 h-20 text-muted-foreground mb-4 opacity-30" />
          <h3 className="text-2xl font-mono text-primary mb-2">NO BOTS DEPLOYED</h3>
          <p className="text-muted-foreground font-mono text-sm">
            Pair a phone at{" "}
            <a href="https://pair.maxxtech.co.ke" target="_blank" rel="noopener noreferrer"
               className="text-primary underline underline-offset-4">
              pair.maxxtech.co.ke
            </a>{" "}
            to see your bot appear here.
          </p>
        </CyberCard>
      )}

      {isLoading && (
        <div className="text-center py-16 font-mono text-muted-foreground animate-pulse">
          Fetching bot status...
        </div>
      )}
    </div>
  );
}

type Session = {
  id: string;
  connected: boolean;
  phoneNumber?: string | null;
  type?: string | null;
  lastConnected?: string | number | null;
  autoRestart?: boolean;
};

function BotCard({
  session,
  delay = 0,
  onStart,
  onStop,
  onDelete,
  starting,
  stopping,
  deleting,
}: {
  session: Session;
  delay?: number;
  onStart?: () => void;
  onStop?: () => void;
  onDelete?: () => void;
  starting?: boolean;
  stopping?: boolean;
  deleting?: boolean;
}) {
  const isOnline = session.connected;

  return (
    <CyberCard delay={delay} className="flex flex-col relative overflow-hidden">
      {/* Online glow accent */}
      {isOnline && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
      )}

      {/* Top row */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          {/* Status orb */}
          <div className="relative">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 ${
              isOnline
                ? "bg-primary/15 border-primary shadow-[0_0_16px_rgba(0,200,255,0.5)]"
                : "bg-muted/20 border-muted-foreground/30"
            }`}>
              {isOnline
                ? <Zap className="w-5 h-5 text-primary" />
                : <Bot className="w-5 h-5 text-muted-foreground opacity-50" />
              }
            </div>
            {isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-black animate-pulse" />
            )}
          </div>

          <div>
            <h3 className="font-mono font-bold text-base leading-none truncate max-w-[130px]" title={session.id}>
              {session.id === "main" ? "MAXX-XMD" : session.id}
            </h3>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {session.type?.toUpperCase() || "BOT"}
            </p>
          </div>
        </div>

        {/* Online / Offline badge */}
        <div className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
          isOnline
            ? "bg-primary/10 text-primary border border-primary/30"
            : "bg-muted/20 text-muted-foreground border border-muted-foreground/20"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
          {isOnline ? "ONLINE" : "OFFLINE"}
        </div>
      </div>

      {/* Info rows */}
      <div className="space-y-2 mb-5 flex-1 font-mono text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span className={`truncate ${session.phoneNumber ? "text-foreground" : ""}`}>
            {session.phoneNumber ? `+${session.phoneNumber}` : "Not paired"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>
            {session.lastConnected
              ? `${formatDistanceToNow(
                  typeof session.lastConnected === "number"
                    ? session.lastConnected
                    : new Date(session.lastConnected)
                )} ago`
              : "Never seen"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 shrink-0" />
          <span>Auto-restart: <span className={session.autoRestart ? "text-primary" : ""}>{session.autoRestart ? "ON" : "OFF"}</span></span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-3 border-t border-primary/10">
        {isOnline ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onStop}
            disabled={stopping}
            className="flex-1 font-mono text-xs border-yellow-500/30 hover:bg-yellow-500/10 text-yellow-500"
          >
            HALT
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={onStart}
            disabled={starting}
            className="flex-1 font-mono text-xs border-primary/30 hover:bg-primary/10 text-primary"
          >
            BOOT
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
          disabled={deleting}
          className="font-mono text-xs border-destructive/30 hover:bg-destructive/10 text-destructive px-3"
          title="Delete session"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </CyberCard>
  );
}
