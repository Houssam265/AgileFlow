import { useCallback, useEffect, useRef, useState } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { useAuthStore } from '../store/authStore';

export type WebSocketState = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';

export interface UseWebSocketReturn {
  subscribe: (topic: string, callback: (message: IMessage) => void) => StompSubscription | null;
  publish: (destination: string, body: unknown, retry?: boolean) => void;
  disconnect: () => void;
  connectionState: WebSocketState;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [connectionState, setConnectionState] = useState<WebSocketState>('DISCONNECTED');
  const clientRef = useRef<Client | null>(null);
  const isConnecting = useRef(false);
  const subscriptionsRef = useRef<Map<string, StompSubscription>>(new Map());
  const { token } = useAuthStore();

  const connect = useCallback(() => {
    if (clientRef.current?.active || isConnecting.current) return;

    isConnecting.current = true;
    setConnectionState('CONNECTING');

    // Use native WebSocket instead of SockJS for better compatibility
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
    const client = new Client({
      webSocketFactory: () => new WebSocket(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        isConnecting.current = false;
        setConnectionState('CONNECTED');
      },
      onDisconnect: () => {
        isConnecting.current = false;
        setConnectionState('DISCONNECTED');
      },
      onStompError: (frame) => {
        isConnecting.current = false;
        console.error('STOMP error:', frame.headers?.message);
        setConnectionState('DISCONNECTED');
      },
      onWebSocketError: (event) => {
        isConnecting.current = false;
        console.error('WebSocket error:', event);
        setConnectionState('DISCONNECTED');
      },
      onWebSocketClose: () => {
        isConnecting.current = false;
        setConnectionState('DISCONNECTED');
      },
    });

    client.activate();
    clientRef.current = client;
  }, [token]);

  const disconnect = useCallback(() => {
    isConnecting.current = false;
    subscriptionsRef.current.forEach((subscription) => {
      subscription.unsubscribe();
    });
    subscriptionsRef.current.clear();

    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    setConnectionState('DISCONNECTED');
  }, []);

  const subscribe = useCallback((topic: string, callback: (message: IMessage) => void): StompSubscription | null => {
    if (!clientRef.current?.connected) {
      console.warn('Cannot subscribe - WebSocket not connected');
      return null;
    }

    const subscription = clientRef.current.subscribe(topic, callback);
    subscriptionsRef.current.set(topic, subscription);
    return subscription;
  }, []);

  const publish = useCallback((destination: string, body: unknown, retry: boolean = true) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: `/app${destination}`,
        body: JSON.stringify(body),
        headers: {
          'content-type': 'application/json',
        },
      });
    } else if (retry) {
      setTimeout(() => publish(destination, body, false), 500);
    } else {
      console.error(`Cannot publish to /app${destination} - WebSocket not connected after retry`);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    subscribe,
    publish,
    disconnect,
    connectionState,
  };
};