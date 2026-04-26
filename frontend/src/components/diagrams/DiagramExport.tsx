import type { RefObject } from 'react';
import { Button, Stack } from '@mui/material';
import { Code, Image } from '@mui/icons-material';
import { toPng, toSvg } from 'html-to-image';

interface DiagramExportProps {
  targetRef: RefObject<HTMLElement>;
  filename?: string;
  disabled?: boolean;
}

const download = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const DiagramExport = ({ targetRef, filename = 'diagramflow', disabled = false }: DiagramExportProps) => {
  const handleExportPng = async () => {
    if (!targetRef.current) return;
    download(await toPng(targetRef.current, { cacheBust: true, backgroundColor: '#ffffff' }), `${filename}.png`);
  };

  const handleExportSvg = async () => {
    if (!targetRef.current) return;
    download(await toSvg(targetRef.current, { cacheBust: true, backgroundColor: '#ffffff' }), `${filename}.svg`);
  };

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      <Button startIcon={<Image />} variant="outlined" onClick={handleExportPng} disabled={disabled}>
        PNG
      </Button>
      <Button startIcon={<Code />} variant="outlined" onClick={handleExportSvg} disabled={disabled}>
        SVG
      </Button>
    </Stack>
  );
};

export default DiagramExport;
