import { render, screen, waitFor } from '@testing-library/react';
import MermaidRenderer from './MermaidRenderer';
import mermaid from 'mermaid';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg role="img"><text>Mermaid OK</text></svg>' }),
  },
}));

describe('MermaidRenderer', () => {
  it('renders Mermaid flowchart SVG', async () => {
    render(<MermaidRenderer steps={['Backlog', 'Review']} />);

    await waitFor(() => expect(mermaid.render).toHaveBeenCalled());
    expect(screen.getByTestId('mermaid-renderer').innerHTML).toContain('Mermaid OK');
  });
});
