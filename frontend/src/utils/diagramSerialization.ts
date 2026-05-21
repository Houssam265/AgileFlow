import { MarkerType, type Edge, type Node } from 'reactflow';
import type { DiagramData, DiagramEdgeDTO, DiagramNodeDTO } from '../types';

const parseData = (raw?: string | null) => {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const cleanNodeData = (data: Record<string, unknown>) => {
  const serializable = { ...data };
  delete serializable.onChange;
  delete serializable.onDelete;
  return serializable;
};

const cleanEdgeData = (data: Record<string, unknown>) => {
  const serializable = { ...data };
  delete serializable.onChange;
  delete serializable.onDelete;
  return serializable;
};

const hasArrow = (value?: string | null) => value != null && value !== '' && value !== 'none';

export const toReactNodes = (diagram: DiagramData, onChange?: (id: string, patch: Record<string, unknown>) => void): Node[] => {
  if (diagram.nodes?.length) {
    return diagram.nodes.map((node) => {
      const data = {
        ...parseData(node.data),
        shape: node.type,
        locked: Boolean(node.locked),
        onChange,
      };

      return {
        id: node.id,
        type: 'diagramNode',
        position: { x: node.positionX ?? 0, y: node.positionY ?? 0 },
        width: node.width ?? undefined,
        height: node.height ?? undefined,
        draggable: !Boolean(data.locked),
        data,
        selected: false,
      };
    });
  }
  const raw = diagram.canvasData ?? diagram.content ?? diagram.json;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.nodes)) {
        return parsed.nodes.map((node: Node) => {
          const data = { ...node.data, onChange };
          return { ...node, draggable: !Boolean(data.locked), data };
        });
      }
    } catch {
      return [];
    }
  }
  return [];
};

export const toReactEdges = (diagram: DiagramData, onChange?: (id: string, patch: Record<string, unknown>) => void, onDelete?: (id: string) => void): Edge[] => {
  if (diagram.edges?.length) {
    return diagram.edges.map((edge) => {
      const arrowStart = edge.arrowStart ?? 'none';
      const arrowEnd = edge.arrowEnd ?? 'filled';

      return {
        id: edge.id,
        source: edge.sourceNodeId,
        target: edge.targetNodeId,
        sourceHandle: edge.sourceHandle ?? undefined,
        targetHandle: edge.targetHandle ?? undefined,
        type: 'diagramEdge',
        markerStart: hasArrow(arrowStart) ? { type: MarkerType.ArrowClosed } : undefined,
        markerEnd: hasArrow(arrowEnd) ? { type: MarkerType.ArrowClosed } : undefined,
        data: {
          ...parseData(edge.data),
          edgeType: edge.edgeType ?? 'association',
          arrowStart,
          arrowEnd,
          onChange,
          onDelete,
        },
      };
    });
  }
  const raw = diagram.canvasData ?? diagram.content ?? diagram.json;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.edges)) {
        return parsed.edges.map((edge: Edge) => ({ ...edge, type: edge.type ?? 'diagramEdge', data: { ...edge.data, onChange, onDelete } }));
      }
    } catch {
      return [];
    }
  }
  return [];
};

export const toNodeDTO = (node: Node, index: number): DiagramNodeDTO => ({
  id: node.id,
  type: String(node.data?.shape ?? node.type ?? 'rectangle'),
  positionX: node.position.x,
  positionY: node.position.y,
  width: Number(node.width ?? node.data?.width ?? 160),
  height: Number(node.height ?? node.data?.height ?? 80),
  data: JSON.stringify(cleanNodeData(node.data ?? {})),
  zIndex: index,
  locked: Boolean(node.data?.locked),
});

export const toEdgeDTO = (edge: Edge): DiagramEdgeDTO => ({
  id: edge.id,
  sourceNodeId: edge.source,
  targetNodeId: edge.target,
  sourceHandle: edge.sourceHandle ?? null,
  targetHandle: edge.targetHandle ?? null,
  edgeType: String(edge.data?.edgeType ?? edge.type ?? 'association'),
  arrowStart: String(edge.data?.arrowStart ?? 'none'),
  arrowEnd: String(edge.data?.arrowEnd ?? 'filled'),
  data: JSON.stringify(cleanEdgeData(edge.data ?? {})),
});

export const buildCanvasData = (title: string, type: string, nodes: Node[], edges: Edge[]) => JSON.stringify({
  title,
  type,
  nodes: nodes.map((node) => ({ ...node, data: cleanNodeData(node.data ?? {}) })),
  edges: edges.map((edge) => ({ ...edge, data: cleanEdgeData(edge.data ?? {}) })),
});
