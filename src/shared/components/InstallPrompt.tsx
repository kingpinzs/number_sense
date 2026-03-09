// InstallPrompt — Global PWA install prompt banner (Story 7.3)
// Mobile: full-width banner above BottomNav
// Desktop (>=768px): card in bottom-right corner
// iOS: custom instructions modal (no beforeinstallprompt support in Safari)

import { X, Download, Share } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { useInstallPrompt } from '@/services/pwa/useInstallPrompt';

export function InstallPrompt() {
  const { shouldShowPrompt, isIOS, triggerInstall, dismissPrompt } = useInstallPrompt();
  const shouldReduceMotion = useReducedMotion();

  if (!shouldShowPrompt) return null;

  // iOS Safari: show custom instructions dialog (no native prompt available)
  if (isIOS) {
    return (
      <Dialog open={true} onOpenChange={(open) => { if (!open) dismissPrompt(); }}>
        <DialogContent aria-describedby="ios-install-description">
          <DialogHeader>
            <DialogTitle>Install Discalculas</DialogTitle>
            <DialogDescription id="ios-install-description">
              Add this app to your home screen for quick access and offline use.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-start gap-3">
              <Share className="w-6 h-6 mt-0.5 text-primary shrink-0" aria-hidden="true" />
              <p className="text-sm text-foreground">
                Tap the <strong>Share</strong> button at the bottom of your browser
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Download className="w-6 h-6 mt-0.5 text-primary shrink-0" aria-hidden="true" />
              <p className="text-sm text-foreground">
                Scroll down and tap <strong>Add to Home Screen</strong>
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full min-h-[44px]"
            onClick={dismissPrompt}
          >
            Not Now
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Chromium: native install prompt available via beforeinstallprompt
  return (
    <AnimatePresence>
      <motion.div
        role="alert"
        aria-label="Install app prompt"
        className="fixed bottom-20 left-2 right-2 z-40 md:left-auto md:bottom-24 md:right-4 md:w-80"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-card border border-border rounded-lg shadow-lg p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-foreground font-medium leading-snug">
              Install Discalculas for quick access and offline use
            </p>
            <button
              aria-label="Dismiss install prompt"
              onClick={dismissPrompt}
              className="text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mt-1 -mr-1 shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              className="flex-1 min-h-[44px]"
              onClick={triggerInstall}
            >
              Install
            </Button>
            <Button
              variant="ghost"
              className="flex-1 min-h-[44px]"
              onClick={dismissPrompt}
            >
              Not Now
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
