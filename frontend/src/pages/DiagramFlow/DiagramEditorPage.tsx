import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack, FiberManualRecord } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Connection,
  ConnectionMode,
  Controls,
  Edge,
  EdgeChange,
  MarkerType,
  MiniMap,
  Node,
  NodeChange,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { fetchDiagram, updateDiagramContent } from '../../api/diagramsApi';
import { useAuth } from '../../context/AuthContext';
import { DiagramToolbar } from '../../components/diagram/DiagramToolbar';
import { ShapeDefinition, ShapeLibrary } from '../../components/diagram/ShapeLibrary';
import { PropertiesPanel } from '../../components/diagram/PropertiesPanel';
import { LiveCursors } from '../../components/diagram/LiveCursors';
import { nodeTypes } from '../../components/diagram/nodes/DiagramNodes';
import { edgeTypes } from '../../components/diagram/edges/DiagramEdges';
import { DIAGRAM_TYPE_LABELS } from '../../data/diagramTemplates';
import { useCollaboration } from '../../hooks/useCollaboration';
import { useDiagramHistory } from '../../hooks/useDiagramHistory';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { applyAutoLayout } from '../../utils/autoLayout';
import { exportToPNG, exportToSVG } from '../../utils/diagramExport';
import { buildCanvasData, toEdgeDTO, toNodeDTO, toReactEdges, toReactNodes } from '../../utils/diagramSerialization';
import type { DiagramData, UpdateDiagramPayload } from '../../types';

const makeId = () => (crypto.randomUUID ? crypto.randomUUID() : `node-${Date.now()}-${Math.round(Math.random() * 10000)}`);

const attachNodeHandlers = (nodes: Node[], onChange: (id: string, patch: Record<string, unknown>) => void) =>
  nodes.map((node) => ({ ...node, data: { ...node.data, onChange } }));

const attachEdgeHandlers = (edges: Edge[], onChange: (id: string, patch: Record<string, unknown>) => void, onDelete: (id: string) => void) =>
  edges.map((edge) => ({ ...edge, type: 'diagramEdge', data: { ...edge.data, onChange, onDelete } }));

const EditorInner = () => {
  const { id } = useParams();
  const diagramId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reactFlow = useReactFlow();
  const saveTimer = useRef<number | null>(null);
  const cursorTimer = useRef<number | null>(null);
  const clipboardRef = useRef<Node[]>([]);

  const [diagram, setDiagram] = useState<DiagramData | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [selectedShape, setSelectedShape] = useState<ShapeDefinition | null>(null);
  const [selectedTool, setSelectedTool] = useState('select');
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNodePatch = useCallback((nodeId: string, patch: Record<string, unknown>) => {
    setNodes((current) => current.map((node) => {
      if (node.id !== nodeId) return node;
      const nextPosition = patch.positionX !== undefined || patch.positionY !== undefined
        ? { x: Number(patch.positionX ?? node.position.x), y: Number(patch.positionY ?? node.position.y) }
        : node.position;
      return {
        ...node,
        position: nextPosition,
        width: patch.width !== undefined ? Number(patch.width) : node.width,
        height: patch.height !== undefined ? Number(patch.height) : node.height,
        data: { ...node.data, ...patch },
      };
    }));
  }, []);

  const handleEdgePatch = useCallback((edgeId: string, patch: Record<string, unknown>) => {
    setEdges((current) => current.map((edge) => (
      edge.id === edgeId
        ? { ...edge, animated: patch.animated !== undefined ? Boolean(patch.animated) : edge.animated, data: { ...edge.data, ...patch }, label: patch.label !== undefined ? String(patch.label) : edge.label }
        : edge
    )));
  }, []);

  const handleEdgeDelete = useCallback((edgeId: string) => {
    setEdges((current) => current.filter((edge) => edge.id !== edgeId));
  }, []);

  const { activeUsers, connectionState, sendUpdate, sendCursor, lockElement, unlockElement } = useCollaboration({
    diagramId: Number.isFinite(diagramId) ? diagramId : null,
    currentUser: user,
    onRemoteContent: (remoteNodes, remoteEdges) => {
      setNodes(attachNodeHandlers(remoteNodes, handleNodePatch));
      setEdges(attachEdgeHandlers(remoteEdges, handleEdgePatch, handleEdgeDelete));
    },
  });

  const history = useDiagramHistory();

  const load = useCallback(async () => {
    if (!Number.isFinite(diagramId)) return;
    setLoading(true);
    setError(null);
    try {
      const row = await fetchDiagram(diagramId);
      setDiagram(row);
      setNodes(toReactNodes(row, handleNodePatch));
      setEdges(toReactEdges(row, handleEdgePatch, handleEdgeDelete));
      setTimeout(() => reactFlow.fitView({ padding: 0.2 }), 100);
    } catch {
      setError('Impossible de charger le diagramme.');
    } finally {
      setLoading(false);
    }
  }, [diagramId, handleEdgeDelete, handleEdgePatch, handleNodePatch, reactFlow]);

  useEffect(() => {
    load();
  }, [load]);

  const saveNow = useCallback(async (nextNodes = nodes, nextEdges = edges) => {
    if (!diagram) return;
    setSaving(true);
    try {
      const canvasData = buildCanvasData(diagram.title ?? diagram.titre, diagram.type, nextNodes, nextEdges);
      const payload: UpdateDiagramPayload = {
        title: diagram.title ?? diagram.titre,
        titre: diagram.title ?? diagram.titre,
        description: diagram.description ?? '',
        type: diagram.type,
        taskId: diagram.taskId,
        etapes: diagram.etapes ?? [],
        shared: diagram.shared,
        isShared: diagram.isShared ?? diagram.shared,
        canvasData,
        content: canvasData,
        nodes: nextNodes.map(toNodeDTO),
        edges: nextEdges.map(toEdgeDTO),
      };
      const updated = await updateDiagramContent(diagram.id, payload);
      setDiagram(updated);
    } finally {
      setSaving(false);
    }
  }, [diagram, edges, nodes]);

  const scheduleSave = useCallback((nextNodes: Node[], nextEdges: Edge[]) => {
    sendUpdate(nextNodes, nextEdges);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => saveNow(nextNodes, nextEdges), 2000);
  }, [saveNow, sendUpdate]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((current) => {
      history.push(current, edges);
      const next = attachNodeHandlers(applyNodeChanges(changes, current), handleNodePatch);
      scheduleSave(next, edges);
      return next;
    });
  }, [edges, handleNodePatch, history, scheduleSave]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((current) => {
      history.push(nodes, current);
      const next = attachEdgeHandlers(applyEdgeChanges(changes, current), handleEdgePatch, handleEdgeDelete);
      scheduleSave(nodes, next);
      return next;
    });
  }, [handleEdgeDelete, handleEdgePatch, history, nodes, scheduleSave]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((current) => {
      history.push(nodes, current);
      const next = attachEdgeHandlers(addEdge({
        ...connection,
        id: `edge-${makeId()}`,
        type: 'diagramEdge',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: { edgeType: 'association', label: '' },
      }, current), handleEdgePatch, handleEdgeDelete);
      scheduleSave(nodes, next);
      return next;
    });
  }, [handleEdgeDelete, handleEdgePatch, history, nodes, scheduleSave]);

  const createNode = useCallback((shape: ShapeDefinition, x: number, y: number) => {
    const newNode: Node = {
      id: makeId(),
      type: 'diagramNode',
      position: { x, y },
      width: shape.width,
      height: shape.height,
      data: {
        shape: shape.type,
        label: shape.label,
        fill: shape.type === 'note' ? '#fef9c3' : '#ffffff',
        borderColor: '#2563eb',
        width: shape.width,
        height: shape.height,
        onChange: handleNodePatch,
      },
    };
    setNodes((current) => {
      const next = [...current, newNode];
      history.push(current, edges);
      scheduleSave(next, edges);
      return next;
    });
  }, [edges, handleNodePatch, history, scheduleSave]);

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData('application/agileflow-shape');
    if (!raw || !wrapperRef.current) return;
    const shape = JSON.parse(raw) as ShapeDefinition;
    const bounds = wrapperRef.current.getBoundingClientRect();
    const position = reactFlow.project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    createNode(shape, position.x, position.y);
  }, [createNode, reactFlow]);

  const onPaneClick = useCallback((event: React.MouseEvent) => {
    if (!selectedShape || !wrapperRef.current) return;
    const bounds = wrapperRef.current.getBoundingClientRect();
    const position = reactFlow.project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    createNode(selectedShape, position.x, position.y);
    setSelectedShape(null);
  }, [createNode, reactFlow, selectedShape]);

  const onMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapperRef.current) return;
    if (cursorTimer.current) return;
    cursorTimer.current = window.setTimeout(() => {
      cursorTimer.current = null;
    }, 100);
    const bounds = wrapperRef.current.getBoundingClientRect();
    const position = reactFlow.project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    sendCursor(position.x, position.y);
  }, [reactFlow, sendCursor]);

  const selected = useMemo(() => ({
    node: nodes.find((node) => node.selected) ?? selectedNode,
    edge: edges.find((edge) => edge.selected) ?? selectedEdge,
  }), [edges, nodes, selectedEdge, selectedNode]);

  const handlers = useMemo(() => ({
    undo: () => {
      const previous = history.undo(nodes, edges);
      if (previous) {
        setNodes(attachNodeHandlers(previous.nodes, handleNodePatch));
        setEdges(attachEdgeHandlers(previous.edges, handleEdgePatch, handleEdgeDelete));
        scheduleSave(previous.nodes, previous.edges);
      }
    },
    redo: () => {
      const next = history.redo(nodes, edges);
      if (next) {
        setNodes(attachNodeHandlers(next.nodes, handleNodePatch));
        setEdges(attachEdgeHandlers(next.edges, handleEdgePatch, handleEdgeDelete));
        scheduleSave(next.nodes, next.edges);
      }
    },
    selectAll: () => setNodes((current) => current.map((node) => ({ ...node, selected: true }))),
    deleteSelected: () => {
      const selectedIds = new Set(nodes.filter((node) => node.selected).map((node) => node.id));
      const nextNodes = nodes.filter((node) => !selectedIds.has(node.id));
      const nextEdges = edges.filter((edge) => !edge.selected && !selectedIds.has(edge.source) && !selectedIds.has(edge.target));
      setNodes(nextNodes);
      setEdges(nextEdges);
      scheduleSave(nextNodes, nextEdges);
    },
    clearSelection: () => {
      setNodes((current) => current.map((node) => ({ ...node, selected: false })));
      setEdges((current) => current.map((edge) => ({ ...edge, selected: false })));
    },
    copySelected: () => {
      clipboardRef.current = nodes.filter((node) => node.selected);
    },
    pasteSelected: () => {
      const pasted = clipboardRef.current.map((node) => ({
        ...node,
        id: makeId(),
        position: { x: node.position.x + 24, y: node.position.y + 24 },
        selected: true,
      }));
      const nextNodes = [...nodes.map((node) => ({ ...node, selected: false })), ...attachNodeHandlers(pasted, handleNodePatch)];
      setNodes(nextNodes);
      scheduleSave(nextNodes, edges);
    },
    duplicateSelected: () => {
      clipboardRef.current = nodes.filter((node) => node.selected);
      const pasted = clipboardRef.current.map((node) => ({ ...node, id: makeId(), position: { x: node.position.x + 24, y: node.position.y + 24 } }));
      const nextNodes = [...nodes, ...attachNodeHandlers(pasted, handleNodePatch)];
      setNodes(nextNodes);
      scheduleSave(nextNodes, edges);
    },
    fitView: () => reactFlow.fitView({ padding: 0.2 }),
    zoomIn: () => reactFlow.zoomIn(),
    zoomOut: () => reactFlow.zoomOut(),
    saveNow: () => saveNow(),
  }), [edges, handleEdgeDelete, handleEdgePatch, handleNodePatch, history, nodes, reactFlow, saveNow, scheduleSave]);

  useKeyboardShortcuts(handlers);

  useEffect(() => () => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    if (cursorTimer.current) window.clearTimeout(cursorTimer.current);
  }, []);

  if (loading) {
    return <Box sx={{ display: 'grid', placeItems: 'center', height: 480 }}><CircularProgress /></Box>;
  }

  if (error || !diagram) {
    return <Alert severity="error">{error ?? 'Diagramme introuvable.'}</Alert>;
  }

  const title = diagram.title ?? diagram.titre;
  const filename = title.replace(/\s+/g, '-').toLowerCase();

  return (
    <Box sx={{ height: 'calc(100vh - 96px)', display: 'flex', flexDirection: 'column', bgcolor: 'grey.50', m: -3 }}>
      <Box sx={{ height: 56, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'grey.200', px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton onClick={() => navigate('/diagrams')}><ArrowBack /></IconButton>
          <TextField
            variant="standard"
            value={title}
            onChange={(event) => setDiagram({ ...diagram, title: event.target.value, titre: event.target.value })}
            onBlur={() => saveNow()}
            InputProps={{ disableUnderline: true, sx: { fontSize: 20, fontWeight: 800 } }}
          />
          <Chip label={DIAGRAM_TYPE_LABELS[diagram.type] ?? diagram.type} color="primary" size="small" />
          <Typography variant="body2" color="text.secondary">{diagram.projectName}</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <FiberManualRecord sx={{ fontSize: 12, color: connectionState === 'CONNECTED' ? 'success.main' : 'warning.main' }} />
          <Typography variant="body2" color="text.secondary">{connectionState === 'CONNECTED' ? 'Temps reel actif' : 'Connexion...'}</Typography>
          {activeUsers.slice(0, 4).map((collaborator) => (
            <Chip key={collaborator.userId} size="small" label={collaborator.username} sx={{ borderColor: collaborator.color }} variant="outlined" />
          ))}
        </Stack>
      </Box>

      <DiagramToolbar
        selectedTool={selectedTool}
        zoom={zoom}
        showGrid={showGrid}
        snapToGrid={snapToGrid}
        undoCount={history.undoCount}
        redoCount={history.redoCount}
        saving={saving}
        onToolChange={setSelectedTool}
        onUndo={handlers.undo}
        onRedo={handlers.redo}
        onZoomIn={() => reactFlow.zoomIn()}
        onZoomOut={() => reactFlow.zoomOut()}
        onFit={() => reactFlow.fitView({ padding: 0.2 })}
        onToggleGrid={() => setShowGrid((value) => !value)}
        onToggleSnap={() => setSnapToGrid((value) => !value)}
        onAutoLayout={() => {
          const next = attachNodeHandlers(applyAutoLayout(nodes, edges), handleNodePatch);
          setNodes(next);
          scheduleSave(next, edges);
        }}
        onExportPNG={() => wrapperRef.current && exportToPNG(wrapperRef.current, filename)}
        onExportSVG={() => wrapperRef.current && exportToSVG(wrapperRef.current, filename)}
        onShare={() => setDiagram({ ...diagram, shared: true, isShared: true })}
        onSave={() => saveNow()}
      />

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <ShapeLibrary selectedShape={selectedShape?.type ?? null} onSelectShape={setSelectedShape} />
        <Box ref={wrapperRef} sx={{ flex: 1, minWidth: 0, position: 'relative' }} onDrop={onDrop} onDragOver={(event) => event.preventDefault()} onMouseMove={onMouseMove}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneClick={onPaneClick}
            onSelectionChange={({ nodes: selectedNodes, edges: selectedEdges }) => {
              const nextNode = selectedNodes[0] ?? null;
              const nextEdge = selectedEdges[0] ?? null;
              if (selectedNode && selectedNode.id !== nextNode?.id) unlockElement(selectedNode.id);
              if (nextNode) lockElement(nextNode.id);
              setSelectedNode(nextNode);
              setSelectedEdge(nextEdge);
            }}
            connectionMode={ConnectionMode.Loose}
            panOnDrag={selectedTool === 'pan'}
            nodesDraggable={selectedTool !== 'pan'}
            nodesConnectable
            snapToGrid={snapToGrid}
            snapGrid={[8, 8]}
            fitView
            multiSelectionKeyCode="Shift"
            deleteKeyCode={null}
            onMove={(_, viewport) => setZoom(Math.round(viewport.zoom * 100))}
            defaultEdgeOptions={{ type: 'diagramEdge', markerEnd: { type: MarkerType.ArrowClosed } }}
          >
            {showGrid && <Background variant={BackgroundVariant.Dots} gap={18} size={1} />}
            <MiniMap position="bottom-right" nodeColor={(node) => String(node.data?.fill ?? '#e2e8f0')} maskColor="rgba(15,23,42,.08)" />
            <Controls position="bottom-left" />
            <LiveCursors users={activeUsers} currentUserId={user?.id} />
          </ReactFlow>
        </Box>
        <PropertiesPanel
          selectedNode={selected.node}
          selectedEdge={selected.edge}
          collaborators={activeUsers}
          onNodeChange={handleNodePatch}
          onEdgeChange={handleEdgePatch}
        />
      </Box>
    </Box>
  );
};

const DiagramEditorPage = () => (
  <ReactFlowProvider>
    <EditorInner />
  </ReactFlowProvider>
);

export default DiagramEditorPage;
