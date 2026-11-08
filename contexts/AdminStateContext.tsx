import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Define types for broadcast payloads
export interface AdminActionPayload {
  type: string;
  data: any;
  timestamp: string;
  sender?: string;
}

interface AdminStateContextType {
  broadcastAdminAction: (type: string, data: any) => Promise<void>;
  lastAction: AdminActionPayload | null;
}

const AdminStateContext = createContext<AdminStateContextType | undefined>(undefined);

export const useAdminState = () => {
  const context = useContext(AdminStateContext);
  if (!context) {
    throw new Error('useAdminState must be used within an AdminStateProvider');
  }
  return context;
};

export const AdminStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastAction, setLastAction] = useState<AdminActionPayload | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // 1. Initialize Supabase Realtime channel for administrative state broadcasts
    const channel = supabase.channel('admin-state-broadcast', {
      config: {
        broadcast: { self: true }, // self: true allows the publisher to also receive its own broadcast
      }
    });

    channelRef.current = channel;

    // 2. Subscribe to the 'admin-action' broadcast event
    channel
      .on('broadcast', { event: 'admin-action' }, ({ payload }) => {
        console.log('REALTIME BROADCAST RECEIVED:', payload);
        setLastAction(payload as AdminActionPayload);
      })
      .subscribe((status) => {
        console.log(`Supabase Realtime subscription status: ${status}`);
      });

    // 3. Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Function to broadcast admin actions through Supabase Realtime
  const broadcastAdminAction = useCallback(async (type: string, data: any) => {
    try {
      if (!channelRef.current) {
        console.warn('Realtime channel is not initialized.');
        return;
      }

      const payload: AdminActionPayload = {
        type,
        data,
        timestamp: new Date().toISOString(),
        sender: 'SuperAdmin'
      };

      await channelRef.current.send({
        type: 'broadcast',
        event: 'admin-action',
        payload
      });

      console.log(`REALTIME BROADCAST DISPATCHED [${type}]:`, data);
    } catch (err) {
      console.error('Failed to dispatch realtime admin broadcast action:', err);
    }
  }, []);

  return (
    <AdminStateContext.Provider value={{ broadcastAdminAction, lastAction }}>
      {children}
    </AdminStateContext.Provider>
  );
};
