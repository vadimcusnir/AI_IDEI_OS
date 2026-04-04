import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface RadarDataPoint {
  label: string;
  value: number; // 0-100
}

interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  className?: string;
}

export function RadarChart({ data, size = 240, className }: RadarChartProps) {
  const center = size / 2;
  const radius = size / 2 - 30;
  const levels = 5;

  const points = useMemo(() => {
    const n = data.length;
    return data.map((d, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = (d.value / 100) * radius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
        labelX: center + (radius + 18) * Math.cos(angle),
        labelY: center + (radius + 18) * Math.sin(angle),
        ...d,
      };
    });
  }, [data, center, radius]);

  const polygonPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";

  // Grid levels
  const gridPolygons = useMemo(() => {
    const n = data.length;
    return Array.from({ length: levels }, (_, lvl) => {
      const r = ((lvl + 1) / levels) * radius;
      const pts = data.map((_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
      });
      return pts.join(" ");
    });
  }, [data, center, radius, levels]);

  // Axis lines
  const axes = useMemo(() => {
    const n = data.length;
    return data.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return {
        x2: center + radius * Math.cos(angle),
        y2: center + radius * Math.sin(angle),
      };
    });
  }, [data, center, radius]);

  if (data.length < 3) return null;

  return (
    <div className={cn("inline-flex", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid polygons */}
        {gridPolygons.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
            opacity={0.5}
          />
        ))}

        {/* Axis lines */}
        {axes.map((axis, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={axis.x2}
            y2={axis.y2}
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
            opacity={0.3}
          />
        ))}

        {/* Data polygon */}
        <path
          d={polygonPath}
          fill="hsl(var(--primary) / 0.15)"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill="hsl(var(--primary))"
            stroke="hsl(var(--background))"
            strokeWidth="2"
          />
        ))}

        {/* Labels */}
        {points.map((p, i) => (
          <text
            key={i}
            x={p.labelX}
            y={p.labelY}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-muted-foreground text-nano font-medium"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
