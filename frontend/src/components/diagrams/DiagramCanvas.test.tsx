import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import DiagramCanvas from './DiagramCanvas';

vi.mock('reactflow', () => ({
  default: ({ nodes, edges, children }: { nodes: Array<{ id: string; data: { label: string } }>; edges: Array<{ id: string }>; children: ReactNode }) => (
    <div data-testid="react-flow">
      {nodes.map((node) => <span key={node.id}>{node.data.label}</span>)}
      {edges.map((edge) => <span key={edge.id}>{edge.id}</span>)}
      {children}
    </div>
  ),
  Background: () => <div data-testid="flow-background" />,
  Controls: () => <div data-testid="flow-controls" />,
  MiniMap: () => <div data-testid="flow-minimap" />,
  ReactFlowProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  MarkerType: { ArrowClosed: 'arrowclosed' },
}));

describe('DiagramCanvas', () => {
  it('renders generated React Flow nodes from steps', () => {
    render(<DiagramCanvas title="Release Flow" steps={['Backlog', 'Build', 'Review']} />);

    expect(screen.getByTestId('diagram-canvas')).toBeInTheDocument();
    expect(screen.getByText('Backlog')).toBeInTheDocument();
    expect(screen.getByText('Build')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });
});
