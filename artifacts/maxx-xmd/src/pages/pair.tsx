import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRequestPairing, useGetPairingStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone, Copy, CheckCircle2, ShieldCheck, AlertCircle,
  Zap, Server, Globe, ChevronRight, Terminal, ArrowRight, Timer,
} from "lucide-react";

function useCountdown(startFrom: number, active: boolean) {
  const [seconds, setSeconds] = useState(startFrom);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    setSeconds(startFrom);
    if (!active) return;
    ref.current = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [active, startFrom]);
  return seconds;
}

const formSchema = z.object({
  number: z
    .string()
    .min(10, "Must include country code, e.g., 2348123456789")
    .regex(/^\d+$/, "Numbers only — no + or spaces"),
});

const DEPLOY_PLATFORMS = [
  {
    name: "Heroku",
    icon: "🟣",
    url: "https://heroku.com",
    color: "from-purple-500/20 to-purple-900/10 border-purple-500/30",
    badge: "Popular",
  },
  {
    name: "Railway",
    icon: "🚂",
    url: "https://railway.app",
    color: "from-blue-500/20 to-blue-900/10 border-blue-500/30",
    badge: "Easy",
  },
  {
    name: "Koyeb",
    icon: "⚡",
    url: "https://koyeb.com",
    color: "from-orange-500/20 to-orange-900/10 border-orange-500/30",
    badge: "Free",
  },
  {
    name: "Render",
    icon: "🌐",
    url: "https://render.com",
    color: "from-green-500/20 to-green-900/10 border-green-500/30",
    badge: "Stable",
  },
];

const STEPS = [
  { n: "01", label: "Enter Number", desc: "Type your WhatsApp number with country code" },
  { n: "02", label: "Get Code", desc: "Click the button to generate your 8-digit pairing code" },
  { n: "03", label: "Link Device", desc: "WhatsApp → Menu → Linked Devices → Link with phone number" },
  { n: "04", label: "Copy Session", desc: "Your SESSION_ID will appear here and be sent to your WhatsApp" },
  { n: "05", label: "Deploy Bot", desc: "Paste SESSION_ID as environment variable on your chosen platform" },
];

const FEATURES = [
  { icon: "⚡", label: "150+ Commands" },
  { icon: "🤖", label: "AI Powered" },
  { icon: "🎵", label: "Music & Video" },
  { icon: "📸", label: "Photo Gen" },
  { icon: "🛡️", label: "Group Admin" },
  { icon: "🎮", label: "Fun & Games" },
];

export default function Pair() {
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedSession, setCopiedSession] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { number: "" },
  });

  const pairMut = useRequestPairing({
    mutation: {
      onSuccess: (data) => {
        setSessionId(data.sessionId ?? null);
        setPairingCode(data.pairingCode ?? null);
        setErrorMsg(null);
        setActiveStep(2);
        toast({ title: "✅ Code Generated", description: "Enter this code in WhatsApp now." });
      },
      onError: (err: any) => {
        const msg = err?.data?.error || err?.message || "Failed to generate pairing code.";
        setErrorMsg(msg);
        toast({ variant: "destructive", title: "Error", description: msg });
      },
    },
  });

  const { data: status } = useGetPairingStatus(sessionId ?? "", {
    query: {
      enabled: !!sessionId,
      refetchInterval: (query) => (query.state.data?.connected ? false : 3000),
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setErrorMsg(null);
    setActiveStep(1);
    pairMut.mutate({ data: values });
  }

  function reset() {
    setPairingCode(null);
    setSessionId(null);
    setErrorMsg(null);
    setCopied(false);
    setCopiedSession(false);
    setActiveStep(0);
    form.reset();
  }

  function copyCode() {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode.replace(/-/g, ""));
      setCopied(true);
      toast({ title: "Code copied!" });
      setTimeout(() => setCopied(false), 2500);
    }
  }

  function copySessionId() {
    if (status?.deploySessionId) {
      navigator.clipboard.writeText(status.deploySessionId);
      setCopiedSession(true);
      toast({ title: "🎉 Session ID copied!" });
      setTimeout(() => setCopiedSession(false), 2500);
    }
  }

  const isConnected = !!status?.connected;
  const codeDigits = pairingCode ? pairingCode.replace(/-/g, "").split("") : [];

  const codeSeconds = useCountdown(60, !!pairingCode && !isConnected);
  const sessionSeconds = useCountdown(20, isConnected && !status?.deploySessionId);
  const codeExpired = codeSeconds === 0;
  const codeProgress = codeSeconds / 60;

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-black via-background to-primary/5"
      >
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(rgba(0,200,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow orb */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative px-6 py-10 md:py-14 flex flex-col md:flex-row items-center gap-8">
          {/* Bot image */}
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl border-2 border-primary/40 overflow-hidden bg-black/60 shadow-[0_0_40px_rgba(0,200,255,0.3)]">
              <img
                src={`${import.meta.env.BASE_URL}images/bot-logo.png`}
                alt="MAXX-XMD"
                className="w-full h-full object-contain p-2"
              />
            </div>
            <span className="absolute -bottom-2 -right-2 bg-primary text-black text-xs font-mono font-bold px-2 py-0.5 rounded-full animate-pulse">
              LIVE
            </span>
          </div>

          {/* Text */}
          <div className="text-center md:text-left space-y-3">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Terminal className="w-5 h-5 text-primary" />
              <span className="font-mono text-primary text-sm tracking-widest uppercase">WhatsApp Bot</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-mono font-bold text-white">
              MAXX<span className="text-primary">-XMD</span>
            </h1>
            <p className="text-muted-foreground font-mono text-sm md:text-base max-w-lg">
              The most powerful WhatsApp bot. Generate your session ID in seconds, then deploy anywhere.
            </p>
            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
              {FEATURES.map((f) => (
                <span key={f.label} className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary font-mono text-xs px-2 py-1 rounded-full">
                  {f.icon} {f.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Steps bar ── */}
      <div className="hidden md:flex items-center justify-between bg-black/40 border border-primary/10 rounded-xl px-6 py-4">
        {STEPS.map((step, i) => (
          <div key={step.n} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${i <= activeStep ? "text-primary" : "text-muted-foreground/40"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold border
                ${i < activeStep ? "bg-primary text-black border-primary" :
                  i === activeStep ? "border-primary text-primary animate-pulse" :
                    "border-muted-foreground/20"}`}>
                {i < activeStep ? <CheckCircle2 className="w-4 h-4" /> : step.n}
              </div>
              <span className="font-mono text-xs font-medium hidden lg:block">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className={`w-4 h-4 mx-1 ${i < activeStep ? "text-primary" : "text-muted-foreground/20"}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Main Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-black/60 border border-primary/20 rounded-2xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-primary/10 bg-primary/5 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" />
            <span className="font-mono text-primary text-sm font-bold tracking-wider">ENTER PHONE NUMBER</span>
          </div>
          <div className="p-5 space-y-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-primary text-sm">+</span>
                          <Input
                            placeholder="254700000000"
                            {...field}
                            className="pl-7 font-mono text-xl tracking-widest h-14 bg-black/70 border-primary/30 focus-visible:ring-primary focus-visible:border-primary text-white placeholder:text-muted-foreground/30"
                            disabled={pairMut.isPending || !!pairingCode}
                          />
                        </div>
                      </FormControl>
                      <p className="text-[11px] text-muted-foreground font-mono pl-1">
                        Country code + number, no spaces. E.g.{" "}
                        <span className="text-primary">254700000000</span>
                      </p>
                      <FormMessage className="font-mono text-xs" />
                    </FormItem>
                  )}
                />

                {errorMsg && (
                  <div className="flex items-start gap-2 bg-red-950/40 border border-red-500/40 rounded-lg p-3 text-xs font-mono text-red-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {errorMsg}
                  </div>
                )}

                {!pairingCode ? (
                  <Button
                    type="submit"
                    className="w-full h-12 font-mono text-sm font-bold bg-primary hover:bg-primary/90 text-black transition-all shadow-[0_0_20px_rgba(0,200,255,0.3)] hover:shadow-[0_0_30px_rgba(0,200,255,0.5)]"
                    disabled={pairMut.isPending}
                  >
                    {pairMut.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        GENERATING CODE...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        GENERATE PAIRING CODE
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={reset}
                    className="w-full font-mono border-primary/30 text-primary hover:bg-primary/10"
                  >
                    ↺ START OVER
                  </Button>
                )}
              </form>
            </Form>

            {/* How-to steps */}
            <div className="space-y-2 border-t border-primary/10 pt-4">
              {STEPS.slice(0, 3).map((step, i) => (
                <div key={step.n} className={`flex gap-3 transition-colors ${i <= activeStep ? "text-foreground" : "text-muted-foreground/40"}`}>
                  <span className={`font-mono text-xs w-5 shrink-0 pt-0.5 ${i <= activeStep ? "text-primary" : ""}`}>{step.n}</span>
                  <p className="text-xs font-mono leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right: Status Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-3 bg-black/60 border border-primary/20 rounded-2xl overflow-hidden flex flex-col"
        >
          <div className="px-5 py-4 border-b border-primary/10 bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              <span className="font-mono text-primary text-sm font-bold tracking-wider">PAIRING STATUS</span>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-mono ${isConnected ? "text-primary" : pairingCode ? "text-yellow-400" : "text-muted-foreground/50"}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-primary animate-pulse" : pairingCode ? "bg-yellow-400 animate-pulse" : "bg-muted-foreground/30"}`} />
              {isConnected ? "CONNECTED" : pairingCode ? "AWAITING" : "IDLE"}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-6 min-h-[380px]">
            <AnimatePresence mode="wait">

              {/* IDLE */}
              {!pairingCode && !isConnected && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-4 text-muted-foreground/40"
                >
                  <div className="w-24 h-24 mx-auto rounded-2xl border border-muted-foreground/10 bg-black/40 flex items-center justify-center">
                    <Smartphone className="w-12 h-12 opacity-30" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-mono text-sm">Awaiting phone number...</p>
                    <p className="font-mono text-xs opacity-60">Enter your number to begin pairing</p>
                  </div>
                </motion.div>
              )}

              {/* CODE */}
              {pairingCode && !isConnected && (
                <motion.div
                  key="code"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full space-y-5 text-center"
                >
                  <div>
                    <p className="font-mono text-xs text-yellow-400 animate-pulse tracking-widest uppercase mb-1">
                      ⏳ Waiting for device confirmation
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      Open WhatsApp → Menu → Linked Devices → Link with phone number
                    </p>
                  </div>

                  {/* Countdown ring + digits */}
                  <div className="flex items-center justify-center gap-6">
                    {/* SVG countdown ring */}
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(0,200,255,0.1)" strokeWidth="6" />
                        <circle
                          cx="40" cy="40" r="34" fill="none"
                          stroke={codeExpired ? "#ef4444" : codeSeconds <= 10 ? "#f59e0b" : "#00c8ff"}
                          strokeWidth="6"
                          strokeDasharray={`${2 * Math.PI * 34}`}
                          strokeDashoffset={`${2 * Math.PI * 34 * (1 - codeProgress)}`}
                          strokeLinecap="round"
                          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`font-mono text-xl font-bold leading-none ${codeExpired ? "text-red-400" : codeSeconds <= 10 ? "text-yellow-400" : "text-primary"}`}>
                          {codeSeconds}
                        </span>
                        <span className="font-mono text-[9px] text-muted-foreground">SEC</span>
                      </div>
                    </div>

                    {/* Code digits */}
                    <div className="space-y-2">
                      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Pairing Code</p>
                      <div className="flex gap-1.5 justify-center flex-wrap">
                        {codeDigits.map((digit, i) => (
                          <motion.div
                            key={i}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: i * 0.06 }}
                            className={`w-10 h-12 bg-black/80 border-2 rounded-xl flex items-center justify-center font-mono text-xl font-bold text-white shadow-[0_0_15px_rgba(0,200,255,0.15)] ${codeExpired ? "border-red-500/50" : "border-primary/50"}`}
                          >
                            {digit}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={copyCode}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-primary/40 text-primary hover:bg-primary/10 transition-all font-mono text-sm font-bold"
                  >
                    {copied ? (
                      <><CheckCircle2 className="w-4 h-4" /> COPIED!</>
                    ) : (
                      <><Copy className="w-4 h-4" /> COPY CODE</>
                    )}
                  </button>

                  {codeExpired ? (
                    <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3 text-center">
                      <p className="font-mono text-xs text-red-400 font-bold">⛔ Code expired — click START OVER to get a new one</p>
                    </div>
                  ) : (
                    <div className={`border rounded-xl p-3 text-left space-y-1 ${codeSeconds <= 10 ? "bg-red-950/20 border-red-500/20" : "bg-yellow-500/5 border-yellow-500/20"}`}>
                      <p className={`font-mono text-xs font-bold ${codeSeconds <= 10 ? "text-red-400" : "text-yellow-400"}`}>
                        <Timer className="w-3 h-3 inline mr-1" />
                        {codeSeconds <= 10 ? `⚠ HURRY — ${codeSeconds}s left!` : `Code expires in ${codeSeconds}s`}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">After linking, your SESSION_ID will appear here and be sent to your WhatsApp.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* CONNECTED */}
              {isConnected && (
                <motion.div
                  key="connected"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full space-y-5 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="w-20 h-20 mx-auto bg-primary/20 rounded-full border-2 border-primary flex items-center justify-center shadow-[0_0_40px_rgba(0,200,255,0.4)]"
                  >
                    <ShieldCheck className="w-10 h-10 text-primary" />
                  </motion.div>

                  <div>
                    <h3 className="text-2xl font-mono font-bold text-primary">LINKED!</h3>
                    <p className="text-xs font-mono text-muted-foreground mt-1">Device paired successfully</p>
                  </div>

                  {!status?.deploySessionId && (
                    <div className="space-y-3 w-full">
                      <div className="flex items-center justify-center gap-3">
                        {/* Small spinner ring with seconds */}
                        <div className="relative w-14 h-14 flex-shrink-0">
                          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                            <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(0,200,255,0.1)" strokeWidth="4" />
                            <circle
                              cx="28" cy="28" r="22" fill="none"
                              stroke="#00c8ff"
                              strokeWidth="4"
                              strokeDasharray={`${2 * Math.PI * 22}`}
                              strokeDashoffset={`${2 * Math.PI * 22 * (1 - sessionSeconds / 20)}`}
                              strokeLinecap="round"
                              style={{ transition: "stroke-dashoffset 1s linear" }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="font-mono text-sm font-bold text-primary leading-none">{sessionSeconds}</span>
                            <span className="font-mono text-[8px] text-muted-foreground">SEC</span>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-mono text-primary animate-pulse font-bold">Sending to WhatsApp...</p>
                          <p className="text-[11px] font-mono text-muted-foreground">Check your WhatsApp in a moment</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {status?.deploySessionId ? (
                    <div className="space-y-3 w-full text-left">
                      <div className="bg-black/80 border border-primary/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">SESSION_ID</span>
                          <span className="font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded">ENV VARIABLE</span>
                        </div>
                        <p className="font-mono text-xs text-primary/80 break-all leading-relaxed bg-black/60 rounded-lg p-2 border border-primary/10">
                          {status.deploySessionId.substring(0, 80)}...
                        </p>
                      </div>
                      <button
                        onClick={copySessionId}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-black transition-all font-mono text-sm font-bold shadow-[0_0_20px_rgba(0,200,255,0.3)]"
                      >
                        {copiedSession ? (
                          <><CheckCircle2 className="w-5 h-5" /> SESSION ID COPIED!</>
                        ) : (
                          <><Copy className="w-5 h-5" /> COPY FULL SESSION ID</>
                        )}
                      </button>
                      <p className="text-[11px] font-mono text-muted-foreground text-center">
                        ✅ Also sent to your WhatsApp
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm font-mono text-primary animate-pulse">
                      Sending session ID to your WhatsApp...
                    </p>
                  )}

                  <button onClick={reset} className="font-mono text-xs text-muted-foreground hover:text-primary underline underline-offset-4 transition-colors">
                    Pair another device
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* ── Deploy Guide ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="font-mono text-lg font-bold text-white">DEPLOY YOUR BOT</h2>
          <div className="flex-1 h-px bg-primary/10" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DEPLOY_PLATFORMS.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`relative group bg-gradient-to-br ${p.color} border rounded-xl p-4 text-center transition-all hover:scale-[1.03] hover:shadow-lg cursor-pointer`}
            >
              <div className="absolute top-2 right-2">
                <span className="font-mono text-[9px] text-muted-foreground bg-black/40 px-1.5 py-0.5 rounded-full">
                  {p.badge}
                </span>
              </div>
              <div className="text-3xl mb-2">{p.icon}</div>
              <p className="font-mono text-sm font-bold text-white">{p.name}</p>
              <p className="font-mono text-[10px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                Deploy <ArrowRight className="w-2.5 h-2.5" />
              </p>
            </a>
          ))}
        </div>

        {/* Env variable guide */}
        <div className="bg-black/60 border border-primary/15 rounded-xl p-5 font-mono text-xs space-y-3">
          <p className="text-primary font-bold uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4" /> Setup Instructions
          </p>
          <div className="space-y-1.5 text-muted-foreground">
            <p><span className="text-primary">1.</span> Copy your SESSION_ID from above</p>
            <p><span className="text-primary">2.</span> Fork the bot repo: <a href="https://github.com/Carlymaxx/maxxtechxmd" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">github.com/Carlymaxx/maxxtechxmd</a></p>
            <p><span className="text-primary">3.</span> On your platform, set this environment variable:</p>
          </div>
          <div className="bg-black/80 border border-primary/20 rounded-lg p-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-primary/60 text-[10px] mb-1">ENV VARIABLE</p>
              <p className="text-white">SESSION_ID=<span className="text-primary/70">MAXX-XMD~your_session_id_here</span></p>
            </div>
          </div>
          <p className="text-muted-foreground/60"><span className="text-primary">4.</span> Deploy and your bot goes live! 🚀</p>
        </div>
      </motion.div>

    </div>
  );
}
