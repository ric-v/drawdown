import React from 'react';
import { render, screen } from '@testing-library/react';
import { Sparkline, variantColorMap } from '../sparkline';

// Mock Recharts components since they require a DOM with SVG support
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="area-chart" data-points={data.length}>
      {children}
    </div>
  ),
  Area: (props: Record<string, unknown>) => (
    <div
      data-testid="area"
      data-stroke={props.stroke}
      data-fill={props.fill}
      data-datakey={props.dataKey}
    />
  ),
}));

describe('Sparkline', () => {
  const defaultProps = {
    data: [1, 2, 3, 4, 5],
    variant: 'positive' as const,
    ariaLabel: 'Total P&L trend over time',
  };

  it('renders with role="img" and the provided ariaLabel', () => {
    render(<Sparkline {...defaultProps} />);
    const sparkline = screen.getByRole('img', { name: 'Total P&L trend over time' });
    expect(sparkline).toBeInTheDocument();
  });

  it('requires ariaLabel prop (TypeScript enforces this at compile time)', () => {
    // This test verifies the ariaLabel is rendered as aria-label
    render(<Sparkline {...defaultProps} ariaLabel="Custom label" />);
    const sparkline = screen.getByRole('img', { name: 'Custom label' });
    expect(sparkline).toBeInTheDocument();
  });

  it('renders with 100% width and 32px height', () => {
    render(<Sparkline {...defaultProps} />);
    const sparkline = screen.getByRole('img');
    expect(sparkline).toHaveStyle({ width: '100%', height: '32px' });
  });

  it('renders a ResponsiveContainer with an AreaChart', () => {
    render(<Sparkline {...defaultProps} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.getByTestId('area')).toBeInTheDocument();
  });

  it('passes data points to the AreaChart', () => {
    render(<Sparkline {...defaultProps} />);
    const chart = screen.getByTestId('area-chart');
    expect(chart).toHaveAttribute('data-points', '5');
  });

  describe('CVA variant color resolution', () => {
    it('resolves positive variant to var(--positive)', () => {
      render(<Sparkline {...defaultProps} variant="positive" />);
      const area = screen.getByTestId('area');
      expect(area).toHaveAttribute('data-stroke', 'hsl(var(--positive))');
      expect(area).toHaveAttribute('data-fill', 'hsl(var(--positive) / 0.2)');
    });

    it('resolves negative variant to var(--negative)', () => {
      render(<Sparkline {...defaultProps} variant="negative" />);
      const area = screen.getByTestId('area');
      expect(area).toHaveAttribute('data-stroke', 'hsl(var(--negative))');
      expect(area).toHaveAttribute('data-fill', 'hsl(var(--negative) / 0.2)');
    });

    it('resolves neutral variant to var(--neutral)', () => {
      render(<Sparkline {...defaultProps} variant="neutral" />);
      const area = screen.getByTestId('area');
      expect(area).toHaveAttribute('data-stroke', 'hsl(var(--neutral))');
      expect(area).toHaveAttribute('data-fill', 'hsl(var(--neutral) / 0.2)');
    });
  });

  it('variantColorMap maps each variant to the correct CSS variable', () => {
    expect(variantColorMap.positive).toBe('var(--positive)');
    expect(variantColorMap.negative).toBe('var(--negative)');
    expect(variantColorMap.neutral).toBe('var(--neutral)');
  });

  it('applies additional className when provided', () => {
    render(<Sparkline {...defaultProps} className="mt-2" />);
    const sparkline = screen.getByRole('img');
    expect(sparkline).toHaveClass('mt-2');
  });

  it('renders with no axes or legend (AreaChart has no XAxis/YAxis/Legend children)', () => {
    render(<Sparkline {...defaultProps} />);
    // The mock only renders Area - no XAxis, YAxis, or Legend should be present
    const chart = screen.getByTestId('area-chart');
    expect(chart.children).toHaveLength(1); // Only the Area element
  });

  it('handles empty data array without crashing', () => {
    render(<Sparkline {...defaultProps} data={[]} />);
    const chart = screen.getByTestId('area-chart');
    expect(chart).toHaveAttribute('data-points', '0');
  });
});
