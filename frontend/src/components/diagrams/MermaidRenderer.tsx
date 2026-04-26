import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Paper, Typography } from '@mui/material';
import mermaid from 'mermaid';
import { buildMermaid, parseDiagramJson } from '../../utils/diagramGeneration';

interface MermaidRendererProps {
  steps: string[];
  json?: string;
}

const MermaidRenderer = ({ steps, json }: MermaidRendererProps) => {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);
  const renderId = useRef(`diagram-${Math.random().toString(36).slice(2)}`);

  const source = useMemo(() => {
    const parsed = parseDiagramJson(json);
    return parsed?.mermaid || buildMermaid(steps);
  }, [json, steps]);

  useEffect(() => {
    let active = true;
    setError(false);
    mermaid.initialize({ startOnLoad: false, theme: 'base', securityLevel: 'strict' });
    mermaid.render(renderId.current, source)
      .then(({ svg: renderedSvg }) => {
        if (active) setSvg(renderedSvg);
      })
      .catch(() => {
        if (active) {
          setSvg('');
          setError(true);
        }
      });
    return () => {
      active = false;
    };
  }, [source]);

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
        Mermaid
      </Typography>
      {error ? (
        <Alert severity="warning">Rendu Mermaid indisponible.</Alert>
      ) : (
        <Box
          data-testid="mermaid-renderer"
          sx={{ minHeight: 220, display: 'grid', placeItems: 'center', overflow: 'auto', bgcolor: 'white', borderRadius: 1 }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </Paper>
  );
};

export default MermaidRenderer;
