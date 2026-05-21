import { memo, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from 'reactflow';
import { Box, IconButton, TextField } from '@mui/material';
import { Close } from '@mui/icons-material';

export const DiagramEdge = memo((props: EdgeProps) => {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, selected, data } = props;
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(String(data?.label ?? props.label ?? ''));
  const [path, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const strokeDasharray = data?.edgeType === 'dependency' || data?.edgeType === 'return' || data?.edgeType === 'realization' ? '6 4' : undefined;
  const stroke = selected ? '#2563eb' : data?.color ?? '#1e293b';

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={{ stroke, strokeWidth: selected ? 2.5 : 1.8, strokeDasharray }} />
      <EdgeLabelRenderer>
        <Box sx={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {editing ? (
            <TextField
              autoFocus
              size="small"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              onBlur={() => {
                setEditing(false);
                data?.onChange?.(id, { label });
              }}
              inputProps={{ style: { fontSize: 12, padding: 4 } }}
            />
          ) : (
            <Box onDoubleClick={() => setEditing(true)} sx={{ px: 0.75, py: 0.25, bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 1, fontSize: 12, minWidth: 16, textAlign: 'center' }}>
              {label}
            </Box>
          )}
          {selected && (
            <IconButton size="small" onClick={() => data?.onDelete?.(id)} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
              <Close fontSize="inherit" />
            </IconButton>
          )}
        </Box>
      </EdgeLabelRenderer>
    </>
  );
});

DiagramEdge.displayName = 'DiagramEdge';

export const edgeTypes = {
  diagramEdge: DiagramEdge,
};
