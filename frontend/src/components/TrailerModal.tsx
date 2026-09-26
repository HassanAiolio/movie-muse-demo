import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface TrailerModalProps {
  videoKey: string | null;
  title: string;
  open: boolean;
  onClose: () => void;
}

export function TrailerModal({ videoKey, title, open, onClose }: TrailerModalProps) {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && videoKey && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} trailer`}
        >
          <motion.div
            className="relative w-full max-w-5xl"
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeButton}
              onClick={onClose}
              aria-label="Close trailer"
              className="absolute -top-12 right-0 flex items-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span className="text-sm">Close</span>
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0`}
                title={`${title} trailer`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
