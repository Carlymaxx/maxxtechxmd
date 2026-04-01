import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  Activity, 
  MessageSquare, 
  Settings, 
  Link as LinkIcon,
  Menu,
  X,
  TerminalSquare
} from "lucide-react";
import { useGetBotStatus } from "@workspace/api-client-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Activity },
  { href: "/sessions", label: "Sessions", icon: TerminalSquare },
  { href: "/pair", label: "Pair Device", icon: LinkIcon },
  { href: "/send", label: "Send Msg", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { data: status } = useGetBotStatus({
    query: { refetchInterval: 5000 }
  });

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden">
      {/* Background ambient image */}
      <div 
        className="fixed inset-0 z-0 opacity-10 pointer-events-none mix-blend-screen"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/cyber-bg.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-y-0 border-l-0 z-10 relative">
        <div className="p-6 flex items-center gap-3 border-b border-primary/20 bg-background/50">
          <div className="relative">
            <img 
              src={`${import.meta.env.BASE_URL}images/bot-logo.png`} 
              alt="MAXX-XMD" 
              className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(0,200,255,0.8)]"
            />
            {status?.connected && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full animate-pulse border-2 border-background" />
            )}
          </div>
          <div>
            <h1 className="font-mono text-xl font-bold text-primary glow-text tracking-wider">MAXX-XMD</h1>
            <p className="text-xs text-muted-foreground font-mono">SYSTEM_CORE v1.0</p>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-sm transition-all duration-200
                  ${isActive 
                    ? "bg-primary/10 text-primary border border-primary/30 glow-border" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground border border-transparent"}
                `}>
                  <item.icon className={`w-5 h-5 ${isActive ? "animate-pulse shadow-primary" : ""}`} />
                  {item.label}
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active" 
                      className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-primary/20 bg-black/20">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${status?.connected ? 'bg-primary animate-pulse' : 'bg-destructive'}`} />
            STATUS: {status?.connected ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 glass-panel flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <Bot className="text-primary w-6 h-6" />
          <h1 className="font-mono text-lg font-bold text-primary">MAXX-XMD</h1>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-primary hover:bg-primary/10 rounded-md"
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-20 px-4"
          >
            <nav className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className="block"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className={`
                    flex items-center gap-4 px-4 py-4 rounded-xl font-mono text-lg
                    ${location === item.href 
                      ? "bg-primary/20 text-primary border border-primary/50" 
                      : "text-muted-foreground"}
                  `}>
                    <item.icon className="w-6 h-6" />
                    {item.label}
                  </div>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen pt-16 md:pt-0 relative z-10 overflow-y-auto">
        <div className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
