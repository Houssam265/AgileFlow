import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import ReactFlow, { Background, Controls, MiniMap, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { buildReactFlowData, parseDiagramJson } from '../../utils/diagramGeneration';

interface DiagramCanvasProps {
  title?: string;
  steps: string[];
  json?: string;
}

const DiagramCanvas = ({ title, steps, json }: DiagramCanvasProps) => {
  const { nodes, edges } = useMemo(() => {
    const parsed = parseDiagramJson(json);
    if (parsed?.nodes?.length) {
      return { nodes: parsed.nodes, edges: parsed.edges ?? [] };
    }
    return buildReactFlowData(steps);
  }, [json, steps]);

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
        {title || 'Diagram Canvas'}
      </Typography>
      <Box data-testid="diagram-canvas" sx={{ height: 420, minHeight: 420, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'grey.200', bgcolor: 'white' }}>
        <ReactFlowProvider>
          <ReactFlow nodes={nodes} edges={edges} fitView nodesDraggable nodesConnectable={false}>
            <MiniMap pannable zoomable />
            <Controls />
            <Background gap={18} size={1} />
          </ReactFlow>
        </ReactFlowProvider>
      </Box>
    </Paper>
  );
};

export default DiagramCanvas;
