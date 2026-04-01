import { useEffect, useState } from "react";
import { 
  useGetBotStatus, 
  useGetBotInfo, 
  useGetBotQr,
  useStartBot
} from "@workspace/api-client-react";
import { CyberCard } from "@/components/ui/cyber-card";
import { Button } from "@/components/ui/button";
import { Activity, Power, QrCode, Server, Clock, Users, ShieldAlert, Share2, Copy, CheckCircle2, ExternalLink } from "lucide-react";
import QRCode from "react-qr-code";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);

  const publicLinkUrl = `${window.location.origin}${import.meta.env.BASE_URL}link`;

  function copyPublicLink() {
    navigator.clipboard.writeText(publicLinkUrl);
    setCopiedLink(true);
    toast({ title: "Link copied!", description: "Share this with users to get their session ID." });
    setTimeout(() => setCopiedLink(false), 2500);
  }

  const { data: status, isLoading: statusLoading } = useGetBotStatus({
    query: { refetchInterval: 3000 }
  });
  const { data: info } = useGetBotInfo();
  
  // Only fetch QR if we know we are disconnected and might have one
  const { data: qrData, refetch: refetchQr } = useGetBotQr({
    query: { 
      enabled: status?.connected === false,
      refetchInterval: status?.connected === false ? 5000 : false
    }
  });

  const { mutate: startBot, isPending: isStarting } = useStartBot({
    mutation: {
      onSuccess: () => {
        toast({ title: "System Initializing", description: "Main bot sequence started." });
      },
      onError: (err) => {
        toast({ 
          variant: "destructive", 
          title: "Boot Failure", 
          description: err.error?.error || "Failed to start bot" 
        });
      }
    }
  });

  const uptimeStr = info?.uptime ? formatDistanceToNow(Date.now() - (info.uptime * 1000)) : "0m";

  return (
    <div className="space-y-6">
      {/* Public Pairing Link Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl border border-primary/25 bg-primary/5 mb-2">
        <div className="flex items-center gap-2 shrink-0">
          <Share2 className="w-4 h-4 text-primary" />
          <span className="font-mono text-sm text-primary font-bold">PUBLIC PAIRING LINK</span>
        </div>
        <div className="flex-1 min-w-0 font-mono text-xs text-muted-foreground truncate">{publicLinkUrl}</div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={copyPublicLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors font-mono text-xs"
          >
            {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedLink ? "Copied!" : "Copy"}
          </button>
          <a
            href={`${import.meta.env.BASE_URL}link`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors font-mono text-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open
          </a>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl">SYSTEM_STATUS</h1>
          <p className="text-muted-foreground font-mono mt-1">Real-time telemetry and control</p>
        </div>
        
        <div className="flex items-center gap-3 font-mono">
          <span className="text-sm text-muted-foreground">STATE:</span>
          <div className={`px-3 py-1 rounded-full border flex items-center gap-2 ${
            status?.connected 
              ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(0,200,255,0.3)]' 
              : 'bg-destructive/10 border-destructive text-destructive'
          }`}>
            <span className={`w-2 h-2 rounded-full ${status?.connected ? 'bg-primary animate-pulse' : 'bg-destructive'}`} />
            {status?.connected ? 'LINK_ESTABLISHED' : 'DISCONNECTED'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CyberCard delay={0.1} className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg text-primary border border-primary/20">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-mono text-muted-foreground">NODE_NAME</p>
              <p className="font-mono font-bold text-lg">{info?.botName || 'UNKNOWN'}</p>
            </div>
          </div>
        </CyberCard>
        
        <CyberCard delay={0.2} className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg text-primary border border-primary/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-mono text-muted-foreground">UPTIME</p>
              <p className="font-mono font-bold text-lg">{uptimeStr}</p>
            </div>
          </div>
        </CyberCard>

        <CyberCard delay={0.3} className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg text-primary border border-primary/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-mono text-muted-foreground">ACTIVE_SESSIONS</p>
              <p className="font-mono font-bold text-lg">{info?.activeSessions || 0}</p>
            </div>
          </div>
        </CyberCard>

        <CyberCard delay={0.4} className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg text-primary border border-primary/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-mono text-muted-foreground">CMD_PREFIX</p>
              <p className="font-mono font-bold text-lg">[{info?.prefix || '.'}]</p>
            </div>
          </div>
        </CyberCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <CyberCard title="Main Control Interface" className="lg:col-span-2" delay={0.5}>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => startBot()} 
                disabled={isStarting || status?.connected}
                className="flex-1 h-14 font-mono text-lg cyber-button bg-primary text-primary-foreground hover:bg-primary/90 glow-border"
              >
                <Power className="mr-2 h-5 w-5" />
                {isStarting ? 'INITIALIZING...' : 'BOOT_SEQUENCE'}
              </Button>
            </div>

            <div className="bg-black/40 border border-primary/10 rounded-lg p-4 font-mono text-sm text-primary/80 h-48 overflow-y-auto">
              <p className="text-muted-foreground mb-2">// SYSTEM LOGS</p>
              <p>&gt; Initializing connection to MAXX-XMD core...</p>
              {status?.connected && <p className="text-primary">&gt; SUCCESS: Quantum link established.</p>}
              {!status?.connected && <p className="text-destructive">&gt; WARNING: Link severed. Awaiting input.</p>}
              {qrData?.qr && <p className="text-yellow-500">&gt; NOTE: Generating new auth matrix (QR).</p>}
              <p className="animate-pulse">_</p>
            </div>
          </div>
        </CyberCard>

        <CyberCard title="Auth Matrix (QR)" delay={0.6}>
          <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
            {status?.connected ? (
              <div className="text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto glow-border">
                  <ShieldAlert className="w-12 h-12 text-primary" />
                </div>
                <h3 className="font-mono text-xl text-primary font-bold">LINK ACTIVE</h3>
                <p className="text-sm text-muted-foreground font-mono">Authentication matrix not required while connected.</p>
              </div>
            ) : qrData?.qr ? (
              <div className="space-y-6 text-center">
                <div className="bg-white p-4 rounded-xl shadow-[0_0_30px_rgba(0,200,255,0.3)]">
                  {/* Depending on backend format. If it's a data URL, use img. If it's raw text string, use QRCode component. Assuming string for safety */}
                  {qrData.qr.startsWith('data:image') ? (
                    <img src={qrData.qr} alt="WhatsApp QR" className="w-48 h-48" />
                  ) : (
                    <QRCode value={qrData.qr} size={200} bgColor="#ffffff" fgColor="#000000" />
                  )}
                </div>
                <div className="font-mono text-sm text-primary">
                  <QrCode className="inline-block mr-2 w-4 h-4" />
                  SCAN WITH WHATSAPP
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchQr()} className="font-mono">
                  REFRESH_MATRIX
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4 text-muted-foreground font-mono">
                <QrCode className="w-16 h-16 mx-auto opacity-20" />
                <p>Awaiting matrix generation...</p>
                {statusLoading && <p className="animate-pulse text-primary">Fetching...</p>}
              </div>
            )}
          </div>
        </CyberCard>
      </div>
    </div>
  );
}
