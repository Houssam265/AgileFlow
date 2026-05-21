import { memo, useEffect, useState } from 'react';
import { Handle, NodeProps, NodeResizer, Position, useUpdateNodeInternals } from 'reactflow';
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

const LifelineMessageHandles = ({ height }: { height: number }) => {
  const slotCount = Math.max(3, Math.floor((height - 104) / 48) + 1);
  const slots = Array.from({ length: slotCount }, (_, index) => 72 + index * 48);

  return (
    <>
      {slots.map((top, index) => (
        <Box key={index}>
          <Handle type="source" position={Position.Right} id={`out-right-${index}`} style={{ ...handleStyle, top }} />
          <Handle type="target" position={Position.Left} id={`in-left-${index}`} style={{ ...handleStyle, top }} />
          <Handle type="source" position={Position.Left} id={`out-left-${index}`} style={{ ...handleStyle, top, background: '#7c3aed' }} />
          <Handle type="target" position={Position.Right} id={`in-right-${index}`} style={{ ...handleStyle, top, background: '#7c3aed' }} />
        </Box>
      ))}
    </>
  );
};

const EditableLabel = ({
  value,
  onChange,
  centered = true,
  bold = true,
  fontSize = 13,
}: {
  value: string;
  onChange: (value: string) => void;
  centered?: boolean;
  bold?: boolean;
  fontSize?: number;
}) => {
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
        inputProps={{ style: { textAlign: centered ? 'center' : 'left', fontSize, fontWeight: bold ? 700 : 400, padding: 4 } }}
      />
    );
  }
  return (
    <Typography
      component="div"
      onDoubleClick={() => setEditing(true)}
      sx={{ fontSize, fontWeight: bold ? 700 : 400, textAlign: centered ? 'center' : 'left', whiteSpace: 'pre-line', cursor: 'text' }}
    >
      {value || 'Sans nom'}
    </Typography>
  );
};

const EditableTextArea = ({
  value,
  onChange,
  bold = false,
  fontSize = 14,
}: {
  value: string;
  onChange: (value: string) => void;
  bold?: boolean;
  fontSize?: number;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) {
      setDraft(value);
    }
  }, [editing, value]);

  if (editing) {
    return (
      <TextField
        autoFocus
        multiline
        fullWidth
        minRows={3}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          setEditing(false);
          onChange(draft);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            setEditing(false);
            onChange(draft);
          }
        }}
        inputProps={{ style: { fontSize, fontWeight: bold ? 700 : 400, padding: 0 } }}
        sx={{
          '& .MuiOutlinedInput-root': { p: 0.75 },
          '& fieldset': { borderColor: '#cbd5e1' },
        }}
      />
    );
  }

  return (
    <Typography
      component="div"
      onDoubleClick={() => setEditing(true)}
      sx={{
        width: '100%',
        height: '100%',
        fontSize,
        fontWeight: bold ? 700 : 400,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        cursor: 'text',
      }}
    >
      {value || 'Texte'}
    </Typography>
  );
};

const ClassContent = ({ id, data }: { id: string; data: any }) => {
  const attributes: string[] = data.attributes ?? ['- id: Long'];
  const methods: string[] = data.methods ?? ['+ operation(): void'];
  const update = (patch: Record<string, unknown>) => data.onChange?.(id, patch);
  const bold = Boolean(data.bold);
  const fontSize = Number(data.fontSize ?? 13);
  return (
    <Box sx={{ width: '100%', height: '100%', display: 'grid', gridTemplateRows: data.stereotype ? '44px 1fr 1fr' : '34px 1fr 1fr', overflow: 'hidden' }}>
      <Box sx={{ bgcolor: data.borderColor ?? '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        {data.stereotype && <Typography sx={{ fontSize: 10, lineHeight: 1 }}>{`<<${data.stereotype}>>`}</Typography>}
        <EditableLabel value={data.label ?? 'Classe'} onChange={(label) => update({ label })} bold={bold} fontSize={fontSize} />
      </Box>
      <Box sx={{ px: 1, py: 0.5, borderTop: '1px solid #cbd5e1', textAlign: 'left', position: 'relative' }}>
        {attributes.map((attr, index) => <Typography key={`attr-${index}`} sx={{ fontSize: Math.max(11, fontSize - 1), fontWeight: bold ? 700 : 400 }}>{attr}</Typography>)}
        <IconButton size="small" sx={{ position: 'absolute', right: 2, bottom: 2 }} onClick={() => update({ attributes: [...attributes, '- champ: Type'] })}><Add fontSize="inherit" /></IconButton>
      </Box>
      <Box sx={{ px: 1, py: 0.5, borderTop: '1px solid #cbd5e1', textAlign: 'left', position: 'relative' }}>
        {methods.map((method, index) => <Typography key={`method-${index}`} sx={{ fontSize: Math.max(11, fontSize - 1), fontWeight: bold ? 700 : 400 }}>{method}</Typography>)}
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
  const borderWidth = Number(data.borderWidth ?? 2);
  const textBold = Boolean(data.bold);
  const labelFontSize = Number(data.fontSize ?? 13);
  const nodeWidth = Number(data.width ?? 140);
  const nodeHeight = Number(data.height ?? 420);
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    if (shape === 'lifeline') {
      updateNodeInternals(id);
    }
  }, [id, nodeHeight, nodeWidth, shape, updateNodeInternals]);

  if (shape === 'actor') {
    return (
      <Box sx={{ width: 90, height: 120, display: 'grid', placeItems: 'center', color: '#0f172a' }}>
        <Handles />
        <svg width="54" height="78" aria-hidden>
          <circle cx="27" cy="13" r="12" fill="white" stroke={borderColor} strokeWidth={borderWidth} />
          <path d="M27 25v25M8 35h38M27 50 10 72M27 50l17 22" stroke={borderColor} strokeWidth={Math.max(2, borderWidth + 1)} fill="none" strokeLinecap="round" />
        </svg>
        <EditableLabel value={label} onChange={(value) => update({ label: value })} bold={textBold} fontSize={labelFontSize} />
      </Box>
    );
  }

  if (shape === 'class') {
    return (
      <Box sx={{ minWidth: 210, minHeight: 160, bgcolor: fill, border: `${borderWidth}px solid ${borderColor}`, borderRadius: 1, overflow: 'hidden', boxShadow: selected ? '0 0 0 3px rgba(37,99,235,.18)' : 'none' }}>
        <NodeResizer isVisible={selected && !locked} minWidth={180} minHeight={130} />
        <Handles all />
        <ClassContent id={id} data={data} />
      </Box>
    );
  }

  if (shape === 'textBox') {
    const textWidth = Number(data.width ?? 220);
    const textHeight = Number(data.height ?? 90);

    return (
      <Box
        sx={{
          width: textWidth,
          height: textHeight,
          p: 1,
          bgcolor: fill === 'transparent' ? 'transparent' : fill,
          border: selected ? `${Math.max(1, borderWidth)}px dashed ${borderColor}` : `${Math.max(1, borderWidth)}px dashed transparent`,
          borderRadius: 1,
          color: '#0f172a',
          overflow: 'hidden',
          boxShadow: selected ? '0 0 0 3px rgba(37,99,235,.12)' : 'none',
        }}
      >
        <NodeResizer
          isVisible={selected && !locked}
          minWidth={80}
          minHeight={40}
          onResize={(_, params) => update({ width: params.width, height: params.height })}
        />
        <EditableTextArea value={label} onChange={(value) => update({ label: value })} bold={textBold} fontSize={labelFontSize} />
      </Box>
    );
  }

  if (shape === 'lifeline') {
    return (
      <Box sx={{ width: nodeWidth, height: nodeHeight, textAlign: 'center', position: 'relative' }}>
        <NodeResizer
          isVisible={selected && !locked}
          minWidth={110}
          minHeight={360}
          onResize={(_, params) => update({ width: params.width, height: params.height })}
        />
        <LifelineMessageHandles height={nodeHeight} />
        <Box sx={{ border: `${borderWidth}px solid ${borderColor}`, bgcolor: fill, borderRadius: 1, p: 1 }}>
          <EditableLabel value={label} onChange={(value) => update({ label: value })} bold={textBold} fontSize={labelFontSize} />
        </Box>
        <Box sx={{ position: 'absolute', top: 44, left: '50%', height: 'calc(100% - 44px)', borderLeft: `${borderWidth}px dashed #94a3b8` }} />
        <Box sx={{ position: 'absolute', top: 100, left: 'calc(50% - 5px)', width: 10, height: 70, bgcolor: '#bfdbfe', border: '1px solid #2563eb' }} />
      </Box>
    );
  }

  const common = {
    bgcolor: fill,
    border: `${borderWidth}px ${shape === 'systemBoundary' ? 'dashed' : 'solid'} ${borderColor}`,
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
          <EditableLabel value={label} onChange={(value) => update({ label: value })} bold={textBold} fontSize={labelFontSize} />
        </Box>
      </Box>
    );
  }

  if (shape === 'useCase') {
    return (
      <Box sx={{ ...common, minWidth: 160, minHeight: 70, borderRadius: '999px', display: 'grid', placeItems: 'center', px: 2 }}>
        <Handles />
        <NodeResizer isVisible={selected && !locked} minWidth={120} minHeight={54} />
        <EditableLabel value={label} onChange={(value) => update({ label: value })} bold={textBold} fontSize={labelFontSize} />
      </Box>
    );
  }

  if (shape === 'systemBoundary') {
    const systemWidth = Number(data.width ?? 420);
    const systemHeight = Number(data.height ?? 260);

    return (
      <Box sx={{ ...common, width: systemWidth, height: systemHeight, borderRadius: 1, bgcolor: 'rgba(255,255,255,.45)', p: 1 }}>
        <NodeResizer
          isVisible={selected && !locked}
          minWidth={260}
          minHeight={160}
          onResize={(_, params) => update({ width: params.width, height: params.height })}
        />
        <EditableLabel value={label} onChange={(value) => update({ label: value })} centered={false} bold={textBold} fontSize={labelFontSize} />
      </Box>
    );
  }

  if (shape === 'sequenceFrame') {
    const frameWidth = Number(data.width ?? 460);
    const frameHeight = Number(data.height ?? 240);
    const tabWidth = Math.max(64, Math.min(120, String(label).length * 12 + 34));
    const tabHeight = 34;
    const tabCut = 16;
    const strokeOffset = borderWidth / 2;
    const outerPath = `M${strokeOffset} ${strokeOffset} H${frameWidth - strokeOffset} V${frameHeight - strokeOffset} H${strokeOffset} Z`;
    const tabPoints = [
      `${strokeOffset},${strokeOffset}`,
      `${tabWidth},${strokeOffset}`,
      `${tabWidth},${tabHeight - tabCut}`,
      `${tabWidth - tabCut},${tabHeight}`,
      `${strokeOffset},${tabHeight}`,
    ].join(' ');
    const tabLine = `M${strokeOffset} ${tabHeight} H${tabWidth - tabCut} L${tabWidth} ${tabHeight - tabCut} V${strokeOffset}`;

    return (
      <Box sx={{ width: frameWidth, height: frameHeight, position: 'relative', bgcolor: 'transparent' }}>
        <NodeResizer
          isVisible={selected && !locked}
          minWidth={240}
          minHeight={120}
          onResize={(_, params) => update({ width: params.width, height: params.height })}
        />
        <svg
          width={frameWidth}
          height={frameHeight}
          viewBox={`0 0 ${frameWidth} ${frameHeight}`}
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
          aria-hidden
        >
          <polygon points={tabPoints} fill="white" />
          <path d={outerPath} fill="none" stroke={borderColor} strokeWidth={borderWidth} strokeLinejoin="miter" />
          <path d={tabLine} fill="none" stroke={borderColor} strokeWidth={borderWidth} strokeLinejoin="miter" strokeLinecap="square" />
        </svg>
        <Box
          sx={{
            position: 'absolute',
            left: strokeOffset,
            top: strokeOffset,
            width: tabWidth - tabCut,
            height: tabHeight,
            display: 'grid',
            placeItems: 'center',
            px: 1,
          }}
        >
          <EditableLabel value={label} onChange={(value) => update({ label: value })} bold={textBold} fontSize={labelFontSize} />
        </Box>
      </Box>
    );
  }

  const borderRadius = shape === 'activity' ? 999 : shape === 'note' ? 1 : 1;
  return (
    <Box sx={{ ...common, minWidth: data.width ?? 150, minHeight: data.height ?? 70, borderRadius, display: 'grid', placeItems: 'center', px: 2, position: 'relative', bgcolor: shape === 'note' ? '#fef9c3' : fill }}>
      <NodeResizer isVisible={selected && !locked} minWidth={90} minHeight={48} />
      <Handles all={shape !== 'note'} />
      {locked && <LockOutlined sx={{ position: 'absolute', right: 4, top: 4, fontSize: 14, color: '#f97316' }} />}
      {shape === 'component' && <Typography sx={{ fontSize: 11, color: '#64748b' }}>«{data.stereotype ?? 'component'}»</Typography>}
      {shape === 'artifact' && <Typography sx={{ fontSize: 11, color: '#64748b' }}>«{data.stereotype ?? 'artifact'}»</Typography>}
      {shape === 'nodeBox' && <Typography sx={{ fontSize: 11, color: '#64748b' }}>«{data.stereotype ?? 'node'}»</Typography>}
      <EditableLabel value={label} onChange={(value) => update({ label: value })} bold={textBold} fontSize={labelFontSize} />
    </Box>
  );
});

DiagramNode.displayName = 'DiagramNode';

export const nodeTypes = {
  diagramNode: DiagramNode,
};
