import React from 'react';
import { useOSStore } from '@/store/use-os-store';
import { X, Copy, Share2, QrCode, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
export function TrackingOverlay({ onClose }: { onClose: () => void }) {
  const isSharingLive = useOSStore((s) => s.isSharingLive);
  const trackingId = useOSStore((s) => s.trackingId);
  const startLiveShare = useOSStore((s) => s.startLiveShare);
  const stopLiveShare = useOSStore((s) => s.stopLiveShare);
  const shareUrl = `${window.location.origin}/track/${trackingId}`;
  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Tracking link copied to clipboard');
  };
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-10 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[3rem] p-12 relative overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-muted-foreground hover:text-white transition-colors">
          <X className="w-10 h-10" />
        </button>
        <div className="space-y-10">
          <div className="space-y-3">
            <h2 className="text-5xl font-black tracking-tight">Live360 Tracking</h2>
            <p className="text-xl text-muted-foreground font-medium">Share your real-time location with family or friends.</p>
          </div>
          <AnimatePresence mode="wait">
            {!isSharingLive ? (
              <motion.div 
                key="start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="py-10 text-center space-y-8"
              >
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <Share2 className="w-12 h-12" />
                </div>
                <Button 
                  size="lg" 
                  className="h-20 px-12 rounded-[1.5rem] text-2xl font-black bg-primary shadow-glow-lg w-full"
                  onClick={startLiveShare}
                >
                  Start Sharing Now
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                key="active"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                <div className="bg-zinc-950 p-8 rounded-[2rem] border border-white/5 space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="p-6 bg-white/5 rounded-2xl">
                      <QrCode className="w-16 h-16 text-muted-foreground opacity-50" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1">Public Share Link</div>
                      <div className="text-xl font-mono truncate opacity-70 mb-4">{shareUrl}</div>
                      <Button onClick={copyLink} className="h-14 px-8 rounded-xl text-lg font-bold gap-2">
                        <Copy className="w-5 h-5" /> Copy Tracking Link
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xl font-bold text-red-500">Sharing is active</span>
                  </div>
                  <Button variant="destructive" onClick={stopLiveShare} className="h-14 px-8 rounded-xl font-bold gap-2">
                    <Power className="w-5 h-5" /> Stop Sharing
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}