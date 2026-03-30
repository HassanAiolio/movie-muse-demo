import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GenrePillProps {
  name: string;
  isActive: boolean;
  onClick: () => void;
}

export function GenrePill({ name, isActive, onClick }: GenrePillProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border",
        isActive 
          ? "bg-primary text-background border-primary shadow-lg shadow-primary/20" 
          : "bg-secondary text-muted border-border hover:border-primary/50 hover:text-foreground"
      )}
    >
      {name}
    </motion.button>
  );
}
