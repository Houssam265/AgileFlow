import { useCallback, useRef, useState } from 'react';
import type { Edge, Node } from 'reactflow';

interface DiagramState {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
}

const cloneState = (nodes: Node[], edges: Edge[]): DiagramState => ({
  nodes: nodes.map((node) => ({ ...node, data: { ...node.data }, position: { ...node.position } })),
  edges: edges.map((edge) => ({ ...edge, data: { ...edge.data } })),
  timestamp: Date.now(),
});

export const useDiagramHistory = (maxHistory = 50) => {
  const historyRef = useRef<DiagramState[]>([]);
  const redoRef = useRef<DiagramState[]>([]);
  const [counts, setCounts] = useState({ undo: 0, redo: 0 });

  const syncCounts = () => setCounts({ undo: historyRef.current.length, redo: redoRef.current.length });

  const push = useCallback((nodes: Node[], edges: Edge[]) => {
    historyRef.current = [...historyRef.current, cloneState(nodes, edges)].slice(-maxHistory);
    redoRef.current = [];
    syncCounts();
  }, [maxHistory]);

  const undo = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    const previous = historyRef.current.pop();
    if (!previous) return null;
    redoRef.current.push(cloneState(currentNodes, currentEdges));
    syncCounts();
    return previous;
  }, []);

  const redo = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    const next = redoRef.current.pop();
    if (!next) return null;
    historyRef.current.push(cloneState(currentNodes, currentEdges));
    syncCounts();
    return next;
  }, []);

  return { push, undo, redo, undoCount: counts.undo, redoCount: counts.redo };
};
