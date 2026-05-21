import { memo, useState } from 'react';
import { Handle, NodeProps, NodeResizer, Position } from 'reactflow';
import { Box, IconButton, TextField, Typography } from '@mui/material';
import { Add, LockOutlined } from '@mui/icons-material';

const handleStyle = { width: 8, height: 8, background: '#2563eb' };

const Handles = ({ all = false }: { all?: boolean }) => (
  <>
    <Handle type="target" position={Position.Top} id="top" style={handleStyle} />
    <Handle type="source" position={Position.Bottom} id="bottom" style={handleStyle} />
    <Handle type="target" position={Position.Left} id="left" style={handleStyle} />
    <Handle type="source" position={Position.Right} id="right" style={handleStyle} />
    {all && (
      <>
        <Handle type="source" position={Position.Top} id="top-right" style={{ ...handleStyle, left: '75%' }} />
        <Handle type="target" position={Position.Top} id="top-left" style={{ ...handleStyle, left: '25%' }} />
        <Handle type="source" position={Position.Bottom} id="bottom-right" style={{ ...handleStyle, left: '75%' }} />
        <Handle type="target" position={Position.Bottom} id="bottom-left" style={{ ...handleStyle, left: '25%' }} />
      </>
    )}
  </>
);

const EditableLabel = ({ value, onChange, centered = true }: { value: string; onChange: (value: string) => void; centered?: boolean }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (editing) {
    return (
      <TextField
        autoFocus
        size="small"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          setEditing(false);
          onChange(draft);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            setEditing(false);
            onChange(draft);
          }
        }}
        inputProps={{ style: { textAlign: centered ? 'center' : 'left', fontSize: 13, padding: 4 } }}
      />
    );
  }
  return (
    <Typography
      component="div"
      onDoubleClick={() => setEditing(true)}
      sx={{ fontSize: 13, fontWeight: 700, textAlign: centered ? 'center' : 'left', whiteSpace: 'pre-line', cursor: 'text' }}
    >
      {value || 'Sans nom'}
    </Typography>
  );
};

const ClassContent = ({ id, data }: { id: string; data: any }) => {
  const attributes: string[] = data.attributes ?? ['- id: Long'];
  const methods: string[] = data.methods ?? ['+ operation(): void'];
  const update = (patch: Record<string, unknown>) => data.onChange?.(id, patch);
  return (
    <Box sx={{ width: '100%', height: '100%', display: 'grid', gridTemplateRows: '34px 1fr 1fr', overflow: 'hidden' }}>
      <Box sx={{ bgcolor: data.borderColor ?? '#2563eb', color: 'white', display: 'grid', placeItems: 'center' }}>
        <EditableLabel value={data.label ?? 'Classe'} onChange={(label) => update({ label })} />
      </Box>
      <Box sx={{ px: 1, py: 0.5, borderTop: '1px solid #cbd5e1', textAlign: 'left', position: 'relative' }}>
        {attributes.map((attr) => <Typography key={attr} sx={{ fontSize: 12 }}>{attr}</Typography>)}
        <IconButton size="small" sx={{ position: 'absolute', right: 2, bottom: 2 }} onClick={() => update({ attributes: [...attributes, '- champ: Type'] })}><Add fontSize="inherit" /></IconButton>
      </Box>
      <Box sx={{ px: 1, py: 0.5, borderTop: '1px solid #cbd5e1', textAlign: 'left', position: 'relative' }}>
        {methods.map((method) => <Typography key={method} sx={{ fontSize: 12 }}>{method}</Typography>)}
        <IconButton size="small" sx={{ position: 'absolute', right: 2, bottom: 2 }} onClick={() => update({ methods: [...methods, '+ methode(): void'] })}><Add fontSize="inherit" /></IconButton>
      </Box>
    </Box>
  );
};

export const DiagramNode = memo(({ id, data, selected }: NodeProps) => {
  const shape = data.shape ?? data.type ?? 'rectangle';
  const locked = Boolean(data.locked);
  const borderColor = locked ? '#f97316' : selected ? '#2563eb' : data.borderColor ?? '#1e293b';
  const fill = data.fill ?? '#ffffff';
  const update = (patch: Record<string, unknown>) => data.onChange?.(id, patch);
  const label = data.label ?? data.name ?? 'Element';

  if (shape === 'actor') {
    return (
      <Box sx={{ width: 90, height: 120, display: 'grid', placeItems: 'center', color: '#0f172a' }}>
        <Handles />
        <svg width="54" height="78" aria-hidden>
          <circle cx="27" cy="13" r="12" fill="white" stroke={borderColor} strokeWidth="2" />
          <path d="M27 25v25M8 35h38M27 50 10 72M27 50l17 22" stroke={borderColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
        <EditableLabel value={label} onChange={(value) => update({ label: value })} />
      </Box>
    );
  }

  if (shape === 'class') {
    return (
      <Box sx={{ minWidth: 210, minHeight: 160, bgcolor: fill, border: `2px solid ${borderColor}`, borderRadius: 1, overflow: 'hidden', boxShadow: selected ? '0 0 0 3px rgba(37,99,235,.18)' : 'none' }}>
        <NodeResizer isVisible={selected && !locked} minWidth={180} minHeight={130} />
        <Handles all />
        <ClassContent id={id} data={data} />
      </Box>
    );
  }

  if (shape === 'lifeline') {
    return (
      <Box sx={{ width: 140, height: data.height ?? 420, textAlign: 'center', position: 'relative' }}>
        <Handles />
        <Box sx={{ border: `2px solid ${borderColor}`, bgcolor: fill, borderRadius: 1, p: 1 }}>
          <EditableLabel value={label} onChange={(value) => update({ label: value })} />
        </Box>
        <Box sx={{ position: 'absolute', top: 44, left: '50%', height: 'calc(100% - 44px)', borderLeft: '2px dashed #94a3b8' }} />
        <Box sx={{ position: 'absolute', top: 100, left: 'calc(50% - 5px)', width: 10, height: 70, bgcolor: '#bfdbfe', border: '1px solid #2563eb' }} />
      </Box>
    );
  }

  const common = {
    bgcolor: fill,
    border: `2px ${shape === 'systemBoundary' ? 'dashed' : 'solid'} ${borderColor}`,
    color: '#0f172a',
    boxShadow: selected ? '0 0 0 3px rgba(37,99,235,.18)' : 'none',
  };

  if (shape === 'start' || shape === 'end') {
    return (
      <Box sx={{ width: 44, height: 44, borderRadius: '50%', border: shape === 'end' ? '5px double #111827' : 'none', bgcolor: shape === 'start' ? '#111827' : '#fff' }}>
        {shape === 'start' ? <Handle type="source" position={Position.Bottom} id="bottom" style={handleStyle} /> : <Handle type="target" position={Position.Top} id="top" style={handleStyle} />}
      </Box>
    );
  }

  if (shape === 'decision') {
    return (
      <Box sx={{ width: 120, height: 120, position: 'relative' }}>
        <Handles />
        <Box sx={{ ...common, width: 86, height: 86, transform: 'rotate(45deg)', position: 'absolute', left: 17, top: 17 }} />
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', px: 2 }}>
          <EditableLabel value={label} onChange={(value) => update({ label: value })} />
        </Box>
      </Box>
    );
  }

  if (shape === 'useCase') {
    return (
      <Box sx={{ ...common, minWidth: 160, minHeight: 70, borderRadius: '999px', display: 'grid', placeItems: 'center', px: 2 }}>
        <Handles />
        <NodeResizer isVisible={selected && !locked} minWidth={120} minHeight={54} />
        {data.stereotype && <Typography sx={{ fontSize: 11, color: '#64748b' }}>«{data.stereotype}»</Typography>}
        <EditableLabel value={label} onChange={(value) => update({ label: value })} />
      </Box>
    );
  }

  if (shape === 'systemBoundary') {
    return (
      <Box sx={{ ...common, width: data.width ?? 420, height: data.height ?? 260, borderRadius: 1, bgcolor: 'rgba(255,255,255,.45)', p: 1 }}>
        <NodeResizer isVisible={selected && !locked} minWidth={260} minHeight={160} />
        <EditableLabel value={label} onChange={(value) => update({ label: value })} centered={false} />
      </Box>
    );
  }

  const borderRadius = shape === 'activity' ? 999 : shape === 'note' ? 1 : 1;
  return (
    <Box sx={{ ...common, minWidth: data.width ?? 150, minHeight: data.height ?? 70, borderRadius, display: 'grid', placeItems: 'center', px: 2, position: 'relative', bgcolor: shape === 'note' ? '#fef9c3' : fill }}>
      <NodeResizer isVisible={selected && !locked} minWidth={90} minHeight={48} />
      <Handles all={shape !== 'note'} />
      {locked && <LockOutlined sx={{ position: 'absolute', right: 4, top: 4, fontSize: 14, color: '#f97316' }} />}
      {shape === 'component' && <Typography sx={{ fontSize: 11, color: '#64748b' }}>«component»</Typography>}
      {shape === 'artifact' && <Typography sx={{ fontSize: 11, color: '#64748b' }}>«artifact»</Typography>}
      {shape === 'nodeBox' && <Typography sx={{ fontSize: 11, color: '#64748b' }}>«{data.stereotype ?? 'node'}»</Typography>}
      <EditableLabel value={label} onChange={(value) => update({ label: value })} />
    </Box>
  );
});

DiagramNode.displayName = 'DiagramNode';

export const nodeTypes = {
  diagramNode: DiagramNode,
};
