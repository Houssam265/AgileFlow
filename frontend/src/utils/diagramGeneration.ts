import { MarkerType, type Edge, type Node } from 'reactflow';
import type { DiagramType } from '../types';

export interface DiagramJsonPayload {
  title: string;
  type: DiagramType;
  steps: string[];
  mermaid: string;
  nodes: Node[];
  edges: Edge[];
}

export const cleanDiagramSteps = (steps: string[]) => steps
  .map((step) => step.trim())
  .filter(Boolean);

const mermaidLabel = (step: string) => step.replace(/"/g, "'");

export const buildMermaid = (steps: string[]) => {
  const cleanSteps = cleanDiagramSteps(steps);
  if (cleanSteps.length === 0) return 'flowchart TD';
  return [
    'flowchart TD',
    ...cleanSteps.flatMap((step, index) => {
      const current = `S${index + 1}["${mermaidLabel(step)}"]`;
      if (index === 0) return [`  ${current}`];
      return [`  ${current}`, `  S${index} --> S${index + 1}`];
    }),
  ].join('\n');
};

export const buildReactFlowData = (steps: string[]) => {
  const cleanSteps = cleanDiagramSteps(steps);
  const nodes: Node[] = cleanSteps.map((step, index) => ({
    id: `S${index + 1}`,
    type: 'default',
    position: { x: (index % 3) * 260, y: Math.floor(index / 3) * 140 },
    data: { label: step },
  }));
  const edges: Edge[] = cleanSteps.slice(1).map((_, index) => ({
    id: `S${index + 1}-S${index + 2}`,
    source: `S${index + 1}`,
    target: `S${index + 2}`,
    type: 'smoothstep',
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
  }));
  return { nodes, edges };
};

export const buildDiagramJson = (title: string, type: DiagramType, steps: string[]) => {
  const cleanSteps = cleanDiagramSteps(steps);
  const flow = buildReactFlowData(cleanSteps);
  const payload: DiagramJsonPayload = {
    title: title.trim(),
    type,
    steps: cleanSteps,
    mermaid: buildMermaid(cleanSteps),
    nodes: flow.nodes,
    edges: flow.edges,
  };
  return payload;
};

export const stringifyDiagramJson = (title: string, type: DiagramType, steps: string[]) => (
  JSON.stringify(buildDiagramJson(title, type, steps))
);

export const parseDiagramJson = (json?: string | null): Partial<DiagramJsonPayload> | null => {
  if (!json) return null;
  try {
    return JSON.parse(json) as Partial<DiagramJsonPayload>;
  } catch {
    return null;
  }
};
