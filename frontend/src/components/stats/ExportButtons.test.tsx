import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportButtons from './ExportButtons';

describe('ExportButtons', () => {
  it('calls PDF and CSV export handlers', async () => {
    const user = userEvent.setup();
    const onExportPdf = vi.fn();
    const onExportCsv = vi.fn();

    render(<ExportButtons exporting={false} onExportPdf={onExportPdf} onExportCsv={onExportCsv} />);

    await user.click(screen.getByRole('button', { name: /pdf/i }));
    await user.click(screen.getByRole('button', { name: /csv/i }));

    expect(onExportPdf).toHaveBeenCalledTimes(1);
    expect(onExportCsv).toHaveBeenCalledTimes(1);
  });
});
