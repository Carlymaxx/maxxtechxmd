import { ReactNode } from "react";
import { motion } from "framer-motion";

interface CyberCardProps {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  delay?: number;
}

export function CyberCard({ children, className = "", title, delay = 0 }: CyberCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`glass-panel rounded-xl overflow-hidden relative group ${className}`}
    >
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/50 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/50 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/50 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/50 rounded-br-lg" />
      
      {/* Scanline effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-1/2 -translate-y-full group-hover:animate-[scan_2s_ease-in-out_infinite] pointer-events-none" />

      {title && (
        <div className="px-6 py-4 border-b border-primary/20 bg-primary/5">
          <h3 className="font-mono text-lg font-semibold text-primary glow-text uppercase tracking-widest">{title}</h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  );
}
