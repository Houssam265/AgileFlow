import { toPng, toSvg } from 'html-to-image';

const download = (href: string, filename: string) => {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
};

export const exportToPNG = async (target: HTMLElement, filename: string) => {
  const dataUrl = await toPng(target, { backgroundColor: '#ffffff', pixelRatio: 2 });
  download(dataUrl, `${filename}.png`);
};

export const exportToSVG = async (target: HTMLElement, filename: string) => {
  const dataUrl = await toSvg(target, { backgroundColor: '#ffffff' });
  download(dataUrl, `${filename}.svg`);
};
