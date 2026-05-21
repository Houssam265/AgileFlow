import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Edge, Node } from 'reactflow';
import type { IMessage } from '@stomp/stompjs';
import { useWebSocket } from './useWebSocket';
import type { CollaboratorInfo, DiagramUpdateMessage, User } from '../types';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

interface UseCollaborationArgs {
  diagramId: number | null;
  currentUser: User | null;
  onRemoteContent?: (nodes: Node[], edges: Edge[]) => void;
}

export const useCollaboration = ({ diagramId, currentUser, onRemoteContent }: UseCollaborationArgs) => {
  const [activeUsers, setActiveUsers] = useState<CollaboratorInfo[]>([]);
  const [lockedElements, setLockedElements] = useState<Map<string, { userId: number; color: string }>>(new Map());
  const { subscribe, publish, connectionState } = useWebSocket();
  const userColor = useMemo(() => COLORS[(currentUser?.id ?? 0) % COLORS.length], [currentUser?.id]);

  const mergeUser = useCallback((message: DiagramUpdateMessage | { userId: number; userName?: string; userColor?: string }) => {
    if (!message.userId || message.userId === currentUser?.id) return;
    setActiveUsers((prev) => {
      const next = prev.filter((user) => user.userId !== message.userId);
      next.push({
        userId: message.userId,
        username: message.userName ?? `Utilisateur ${message.userId}`,
        color: message.userColor ?? COLORS[message.userId % COLORS.length],
        cursorX: 0,
        cursorY: 0,
        isActive: true,
        lastSeen: Date.now(),
      });
      return next;
    });
  }, [currentUser?.id]);

  const handleMessage = useCallback((message: DiagramUpdateMessage) => {
    if (message.userId === currentUser?.id) return;
    if (message.type === 'CURSOR_MOVE') {
      const cursor = message.payload as { x?: number; y?: number };
      mergeUser(message);
      setActiveUsers((prev) => prev.map((user) => (
        user.userId === message.userId
          ? { ...user, cursorX: cursor.x ?? user.cursorX, cursorY: cursor.y ?? user.cursorY, isActive: true, lastSeen: Date.now() }
          : user
      )));
      return;
    }
    if (message.type === 'ELEMENT_LOCK') {
      setLockedElements((prev) => new Map(prev).set(String(message.payload), { userId: message.userId, color: message.userColor }));
      return;
    }
    if (message.type === 'ELEMENT_UNLOCK') {
      setLockedElements((prev) => {
        const next = new Map(prev);
        next.delete(String(message.payload));
        return next;
      });
      return;
    }
    if ((message.type === 'CONTENT_UPDATE' || message.type === 'FULL_SYNC') && onRemoteContent) {
      const payload = message.payload as { nodes?: Node[]; edges?: Edge[] };
      onRemoteContent(payload.nodes ?? [], payload.edges ?? []);
    }
  }, [currentUser?.id, mergeUser, onRemoteContent]);

  useEffect(() => {
    if (!diagramId || !currentUser || connectionState !== 'CONNECTED') return;
    const diagramSub = subscribe(`/topic/diagram/${diagramId}`, (raw: IMessage) => handleMessage(JSON.parse(raw.body)));
    const presenceSub = subscribe(`/topic/diagram/${diagramId}/presence`, (raw: IMessage) => {
      const message = JSON.parse(raw.body) as { type: string; userId: number; userName: string; userColor: string };
      if (message.type === 'LEAVE') {
        setActiveUsers((prev) => prev.filter((user) => user.userId !== message.userId));
      } else {
        mergeUser(message);
      }
    });
    publish(`/diagram/${diagramId}/join`, {
      type: 'JOIN',
      diagramId,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email,
      userColor,
      payload: null,
    });
    return () => {
      publish(`/diagram/${diagramId}/leave`, {
        type: 'LEAVE',
        diagramId,
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email,
        userColor,
        payload: null,
      }, false);
      diagramSub?.unsubscribe();
      presenceSub?.unsubscribe();
    };
  }, [connectionState, currentUser, diagramId, handleMessage, mergeUser, publish, subscribe, userColor]);

  const sendUpdate = useCallback((nodes: Node[], edges: Edge[]) => {
    if (!diagramId || !currentUser) return;
    publish(`/diagram/${diagramId}`, {
      type: 'CONTENT_UPDATE',
      diagramId,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email,
      userColor,
      payload: { nodes, edges },
    });
  }, [currentUser, diagramId, publish, userColor]);

  const sendCursor = useCallback((x: number, y: number) => {
    if (!diagramId || !currentUser) return;
    publish(`/diagram/${diagramId}`, {
      type: 'CURSOR_MOVE',
      diagramId,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email,
      userColor,
      payload: { x, y },
    }, false);
  }, [currentUser, diagramId, publish, userColor]);

  const lockElement = useCallback((elementId: string) => {
    if (!diagramId || !currentUser) return;
    publish(`/diagram/${diagramId}`, {
      type: 'ELEMENT_LOCK',
      diagramId,
      userId: currentUser.id,
      userName: currentUser.email,
      userColor,
      payload: elementId,
    });
  }, [currentUser, diagramId, publish, userColor]);

  const unlockElement = useCallback((elementId: string) => {
    if (!diagramId || !currentUser) return;
    publish(`/diagram/${diagramId}`, {
      type: 'ELEMENT_UNLOCK',
      diagramId,
      userId: currentUser.id,
      userName: currentUser.email,
      userColor,
      payload: elementId,
    });
  }, [currentUser, diagramId, publish, userColor]);

  return { activeUsers, lockedElements, userColor, connectionState, sendUpdate, sendCursor, lockElement, unlockElement };
};
