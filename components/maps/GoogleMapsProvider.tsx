import React, { useEffect, useState, createContext, useContext } from 'react';
import {
  APIProvider,
  useApiIsLoaded,
  useApiLoadingStatus,
  APILoadingStatus,
} from '@vis.gl/react-google-maps';

interface MapsKeyContextValue {
  apiKey: string;
  isResolved: boolean;
}

const MapsKeyContext = createContext<MapsKeyContextValue>({
  apiKey: '',
  isResolved: false,
});

export const useGoogleMapsConfig = () => useContext(MapsKeyContext);

export const triggerGmpQuotaBanner = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

export const isGmpQuotaError = (err: unknown): boolean => {
  const msg = String((err as any)?.message || err || '').toUpperCase();
  return (
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('QUOTA') ||
    msg.includes('429')
  );
};

const MapsStatusWatcher: React.FC = () => {
  const status = useApiLoadingStatus();
  useEffect(() => {
    if (status === APILoadingStatus.AUTH_FAILURE) {
      triggerGmpQuotaBanner();
    }
  }, [status]);
  return null;
};

export const MapsReadyGuard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const { apiKey, isResolved } = useGoogleMapsConfig();
  const isLoaded = useApiIsLoaded();
  const status = useApiLoadingStatus();

  if (!isResolved) {
    return (
      <div className="w-full h-full min-h-[280px] flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-xl text-xs text-slate-500 dark:text-slate-400">
        Initializing Google Maps Platform...
      </div>
    );
  }

  if (!apiKey) {
    return (
      <>
        {fallback || (
          <div className="w-full h-full min-h-[280px] flex flex-col items-center justify-center p-6 text-center bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Google Maps API Key Required
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
              Configure <code className="font-mono">VITE_GOOGLE_MAPS_API_KEY</code> in your environment to render interactive Google Maps, Places search, and routing.
            </p>
          </div>
        )}
      </>
    );
  }

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="w-full h-full min-h-[280px] flex flex-col items-center justify-center p-6 text-center bg-amber-50/70 dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/40 space-y-2">
        <p className="text-sm font-semibold text-amber-950 dark:text-amber-300">
          Unable to load interactive Google Map
        </p>
        <p className="text-xs text-amber-800 dark:text-slate-300 max-w-md">
          Please check your network connection or API key permissions for Maps JavaScript API, Places API (New), and Routes API.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full min-h-[280px] flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-xl text-xs text-slate-500 dark:text-slate-400">
        Loading Google Maps Platform...
      </div>
    );
  }

  return <>{children}</>;
};

export const GoogleMapsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() || '';
  const [apiKey, setApiKey] = useState<string>(envKey);
  const [isResolved, setIsResolved] = useState<boolean>(Boolean(envKey));

  useEffect(() => {
    if (envKey) {
      setApiKey(envKey);
      setIsResolved(true);
      return;
    }

    let cancelled = false;
    fetch('/api/maps/client-config')
      .then((res) =>
        res.ok && (res.headers.get('content-type') || '').toLowerCase().includes('application/json')
          ? res.json()
          : { apiKey: '' }
      )
      .then((data) => {
        if (!cancelled) {
          setApiKey(typeof data?.apiKey === 'string' ? data.apiKey.trim() : '');
          setIsResolved(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsResolved(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [envKey]);

  return (
    <MapsKeyContext.Provider value={{ apiKey, isResolved }}>
      {apiKey ? (
        <APIProvider
          apiKey={apiKey}
          libraries={['places', 'marker', 'routes', 'geometry', 'core']}
          language="en"
          region="ZA"
        >
          <MapsStatusWatcher />
          {children}
        </APIProvider>
      ) : (
        <>{children}</>
      )}
    </MapsKeyContext.Provider>
  );
};
