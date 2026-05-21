import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const clearRemoteSelection = (nodes: Node[], edges: Edge[]) => ({
  nodes: nodes.map((node) => ({ ...node, selected: false })),
  edges: edges.map((edge) => ({ ...edge, selected: false })),
});

export const useCollaboration = ({ diagramId, currentUser, onRemoteContent }: UseCollaborationArgs) => {
  const [activeUsers, setActiveUsers] = useState<CollaboratorInfo[]>([]);
  const [lockedElements, setLockedElements] = useState<Map<string, { userId: number; color: string }>>(new Map());
  const { subscribe, publish, connectionState } = useWebSocket();
  const currentUserId = currentUser?.id;
  const currentUserName = useMemo(() => (
    currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email : ''
  ), [currentUser?.email, currentUser?.firstName, currentUser?.lastName]);
  const userColor = useMemo(() => COLORS[(currentUserId ?? 0) % COLORS.length], [currentUserId]);
  const onRemoteContentRef = useRef(onRemoteContent);
  const leaveTimersRef = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    onRemoteContentRef.current = onRemoteContent;
  }, [onRemoteContent]);

  const cancelLeaveTimer = useCallback((userId: number) => {
    const timer = leaveTimersRef.current.get(userId);
    if (timer) {
      window.clearTimeout(timer);
      leaveTimersRef.current.delete(userId);
    }
  }, []);

  const mergeUser = useCallback((message: DiagramUpdateMessage | { userId: number; userName?: string; userColor?: string }) => {
    if (!message.userId || message.userId === currentUserId) return;
    cancelLeaveTimer(message.userId);
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
  }, [cancelLeaveTimer, currentUserId]);

  const scheduleUserLeave = useCallback((userId: number) => {
    if (!userId || userId === currentUserId) return;
    cancelLeaveTimer(userId);
    const timer = window.setTimeout(() => {
      setActiveUsers((prev) => prev.filter((user) => user.userId !== userId));
      leaveTimersRef.current.delete(userId);
    }, 1500);
    leaveTimersRef.current.set(userId, timer);
  }, [cancelLeaveTimer, currentUserId]);

  const handleMessage = useCallback((message: DiagramUpdateMessage) => {
    if (message.userId === currentUserId) return;
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
    if ((message.type === 'CONTENT_UPDATE' || message.type === 'FULL_SYNC') && onRemoteContentRef.current) {
      const payload = message.payload as { nodes?: Node[]; edges?: Edge[] };
      mergeUser(message);
      onRemoteContentRef.current(payload.nodes ?? [], payload.edges ?? []);
    }
  }, [currentUserId, mergeUser]);

  useEffect(() => {
    if (!diagramId || !currentUserId || connectionState !== 'CONNECTED') return;
    const diagramSub = subscribe(`/topic/diagram/${diagramId}`, (raw: IMessage) => handleMessage(JSON.parse(raw.body)));
    const presenceSub = subscribe(`/topic/diagram/${diagramId}/presence`, (raw: IMessage) => {
      const message = JSON.parse(raw.body) as { type: string; userId: number; userName: string; userColor: string };
      if (message.type === 'LEAVE') {
        scheduleUserLeave(message.userId);
      } else {
        mergeUser(message);
      }
    });
    publish(`/diagram/${diagramId}/join`, {
      type: 'JOIN',
      diagramId,
      userId: currentUserId,
      userName: currentUserName,
      userColor,
      payload: null,
    });
    return () => {
      publish(`/diagram/${diagramId}/leave`, {
        type: 'LEAVE',
        diagramId,
        userId: currentUserId,
        userName: currentUserName,
        userColor,
        payload: null,
      }, false);
      diagramSub?.unsubscribe();
      presenceSub?.unsubscribe();
    };
  }, [connectionState, currentUserId, currentUserName, diagramId, handleMessage, mergeUser, publish, scheduleUserLeave, subscribe, userColor]);

  useEffect(() => () => {
    leaveTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    leaveTimersRef.current.clear();
  }, []);

  const sendUpdate = useCallback((nodes: Node[], edges: Edge[]) => {
    if (!diagramId || !currentUserId) return;
    const payload = clearRemoteSelection(nodes, edges);
    publish(`/diagram/${diagramId}`, {
      type: 'CONTENT_UPDATE',
      diagramId,
      userId: currentUserId,
      userName: currentUserName,
      userColor,
      payload,
    });
  }, [currentUserId, currentUserName, diagramId, publish, userColor]);

  const sendCursor = useCallback((x: number, y: number) => {
    if (!diagramId || !currentUserId) return;
    publish(`/diagram/${diagramId}`, {
      type: 'CURSOR_MOVE',
      diagramId,
      userId: currentUserId,
      userName: currentUserName,
      userColor,
      payload: { x, y },
    }, false);
  }, [currentUserId, currentUserName, diagramId, publish, userColor]);

  const lockElement = useCallback((elementId: string) => {
    if (!diagramId || !currentUserId) return;
    publish(`/diagram/${diagramId}`, {
      type: 'ELEMENT_LOCK',
      diagramId,
      userId: currentUserId,
      userName: currentUserName,
      userColor,
      payload: elementId,
    });
  }, [currentUserId, currentUserName, diagramId, publish, userColor]);

  const unlockElement = useCallback((elementId: string) => {
    if (!diagramId || !currentUserId) return;
    publish(`/diagram/${diagramId}`, {
      type: 'ELEMENT_UNLOCK',
      diagramId,
      userId: currentUserId,
      userName: currentUserName,
      userColor,
      payload: elementId,
    });
  }, [currentUserId, currentUserName, diagramId, publish, userColor]);

  return { activeUsers, lockedElements, userColor, connectionState, sendUpdate, sendCursor, lockElement, unlockElement };
};
