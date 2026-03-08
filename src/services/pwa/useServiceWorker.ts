import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect, useRef } from 'react';
import { toast } from '@/shared/components/ui/toast';

export function useServiceWorker() {
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const offlineToastShown = useRef(false);
  const refreshToastShown = useRef(false);

  useEffect(() => {
    if (offlineReady && !offlineToastShown.current) {
      offlineToastShown.current = true;
      toast('App ready to work offline');
    }
  }, [offlineReady]);

  useEffect(() => {
    if (needRefresh && !refreshToastShown.current) {
      refreshToastShown.current = true;
      toast('New version available! Refresh to update.', {
        action: { label: 'Refresh', onClick: () => updateServiceWorker(true) },
        duration: Infinity,
      });
    }
  }, [needRefresh, updateServiceWorker]);
}
