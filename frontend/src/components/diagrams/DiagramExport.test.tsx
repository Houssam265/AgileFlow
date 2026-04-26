import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toPng, toSvg } from 'html-to-image';
import DiagramExport from './DiagramExport';

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,diagram'),
  toSvg: vi.fn().mockResolvedValue('data:image/svg+xml,diagram'),
}));

describe('DiagramExport', () => {
  it('exports target element as PNG and SVG', async () => {
    const target = document.createElement('div');
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const user = userEvent.setup();

    render(<DiagramExport targetRef={{ current: target }} filename="release-flow" />);

    await user.click(screen.getByRole('button', { name: /PNG/i }));
    await user.click(screen.getByRole('button', { name: /SVG/i }));

    await waitFor(() => {
      expect(toPng).toHaveBeenCalledWith(target, expect.objectContaining({ cacheBust: true }));
      expect(toSvg).toHaveBeenCalledWith(target, expect.objectContaining({ cacheBust: true }));
    });
    expect(clickSpy).toHaveBeenCalledTimes(2);
    clickSpy.mockRestore();
  });
});
