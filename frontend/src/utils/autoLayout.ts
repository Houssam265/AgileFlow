import type { Edge, Node } from 'reactflow';

export const applyAutoLayout = (nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'LR') => {
  const levels = new Map<string, number>();
  nodes.forEach((node) => levels.set(node.id, 0));
  edges.forEach((edge) => {
    const sourceLevel = levels.get(edge.source) ?? 0;
    levels.set(edge.target, Math.max(levels.get(edge.target) ?? 0, sourceLevel + 1));
  });

  const buckets = new Map<number, Node[]>();
  nodes.forEach((node) => {
    const level = levels.get(node.id) ?? 0;
    buckets.set(level, [...(buckets.get(level) ?? []), node]);
  });

  return nodes.map((node) => {
    const level = levels.get(node.id) ?? 0;
    const bucket = buckets.get(level) ?? [];
    const index = bucket.findIndex((item) => item.id === node.id);
    const x = direction === 'LR' ? level * 260 : index * 240;
    const y = direction === 'LR' ? index * 160 : level * 160;
    return { ...node, position: { x, y } };
  });
};
