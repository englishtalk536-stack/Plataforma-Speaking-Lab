export interface FeedbackRadarProps {
  fluency: number;
  grammar: number;
  pronunciation: number;
  vocabulary: number;
  className?: string;
}

interface Axis {
  label: string;
  value: number;
}

const SIZE = 360;
const SVG_PADDING = 95;
const CENTER = SIZE / 2;
const MAX_RADIUS = CENTER - SVG_PADDING;
const RINGS = [0.25, 0.5, 0.75, 1];

/** Point on the chart for a given axis index (0-based, out of `total`) at a given 0-1 fraction of MAX_RADIUS. */
function pointAt(index: number, total: number, fraction: number): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2; // start at 12 o'clock, go clockwise
  const radius = MAX_RADIUS * fraction;
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}

function polygonPoints(values: number[]): string {
  return values
    .map((value, index) => {
      const { x, y } = pointAt(index, values.length, Math.max(0, Math.min(value, 100)) / 100);
      return `${x},${y}`;
    })
    .join(' ');
}

/**
 * Hand-built SVG spider chart for the four Feedback Radar metrics. Built
 * from scratch rather than pulled in from a charting library so the shape,
 * grid weight, and brand-colored fill match SpeakingLab's palette exactly
 * rather than a library's default theme.
 */
export function FeedbackRadar({ fluency, grammar, pronunciation, vocabulary, className = '' }: FeedbackRadarProps) {
  const axes: Axis[] = [
    { label: 'Fluency', value: fluency },
    { label: 'Grammar', value: grammar },
    { label: 'Pronunciation', value: pronunciation },
    { label: 'Vocabulary', value: vocabulary },
  ];

  const dataPoints = polygonPoints(axes.map((axis) => axis.value));

  return (
    <div className={`w-full max-w-[420px] overflow-visible p-4 ${className}`}>
      <svg
        className="h-auto w-full"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label="Feedback radar: fluency, grammar, pronunciation, and vocabulary scores"
      >
        {/* Background rings */}
        {RINGS.map((fraction) => (
          <polygon
            key={fraction}
            points={polygonPoints(axes.map(() => fraction * 100))}
            fill="none"
            stroke="#103469"
            strokeOpacity={0.12}
            strokeWidth={1}
          />
        ))}

        {/* Axis spokes */}
        {axes.map((axis, index) => {
          const { x, y } = pointAt(index, axes.length, 1);
          return (
            <line
              key={axis.label}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke="#103469"
              strokeOpacity={0.12}
              strokeWidth={1}
            />
          );
        })}

        {/* Student's scores */}
        <polygon points={dataPoints} fill="#205088" fillOpacity={0.35} stroke="#205088" strokeWidth={2} />
        {axes.map((axis, index) => {
          const { x, y } = pointAt(index, axes.length, Math.max(0, Math.min(axis.value, 100)) / 100);
          return <circle key={axis.label} cx={x} cy={y} r={3.5} fill="#EAB135" stroke="#103469" strokeWidth={1} />;
        })}

        {/* Axis labels */}
        {axes.map((axis, index) => {
          const { x, y } = pointAt(index, axes.length, 1.1);
          return (
            <text
              key={axis.label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-body"
              fontSize={11}
              fill="#103469"
            >
              {axis.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
