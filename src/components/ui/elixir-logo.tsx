"use client";

/**
 * Elixir MD INC logo mark — the circle staircase from the brand guide:
 * three rows of debossed circles (3 / 4 / 5), right-aligned into a rising
 * step, shading light (top-left) to deep blue (bottom-right).
 *
 * Pure SVG, no asset request. Hover plays a subtle staggered "press"
 * ripple across the circles (CSS in globals.css under .elixir-logo).
 */

interface ElixirLogoProps {
  /** Rendered width in px; height scales automatically. */
  size?: number;
  className?: string;
}

const UNIT = 56; // grid cell
const R = 24; // circle radius

// Rows are right-aligned on a 5-column grid: top 3, middle 4, bottom 5.
const ROWS: { cols: number[]; y: number }[] = [
  { cols: [2, 3, 4], y: 0 },
  { cols: [1, 2, 3, 4], y: 1 },
  { cols: [0, 1, 2, 3, 4], y: 2 },
];

// Light aqua-blue (top-left) → deep brand blue (bottom-right).
const SHADE_FROM = { r: 0xb8, g: 0xd8, b: 0xf0 };
const SHADE_TO = { r: 0x2a, g: 0x52, b: 0xb0 };

function shade(t: number): string {
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${mix(SHADE_FROM.r, SHADE_TO.r)}, ${mix(SHADE_FROM.g, SHADE_TO.g)}, ${mix(SHADE_FROM.b, SHADE_TO.b)})`;
}

export function ElixirLogo({ size = 96, className = "" }: ElixirLogoProps) {
  const width = 5 * UNIT;
  const height = 3 * UNIT;

  const circles: { cx: number; cy: number; fill: string; delay: number }[] = [];
  let index = 0;
  for (const row of ROWS) {
    for (const col of row.cols) {
      // Diagonal shading: progress from top-left to bottom-right.
      const t = (col / 4) * 0.55 + (row.y / 2) * 0.45;
      circles.push({
        cx: col * UNIT + UNIT / 2,
        cy: row.y * UNIT + UNIT / 2,
        fill: shade(t),
        delay: index * 40,
      });
      index++;
    }
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={size}
      height={(size * height) / width}
      className={`elixir-logo ${className}`}
      role="img"
      aria-label="Elixir MD INC"
    >
      <defs>
        {/* Debossed look: soft dark inner edge at top, faint light rim below. */}
        <filter id="elx-inset" x="-30%" y="-30%" width="160%" height="160%">
          <feOffset dy="2" in="SourceAlpha" result="off" />
          <feGaussianBlur stdDeviation="2.5" in="off" result="blur" />
          <feComposite
            in="SourceGraphic"
            in2="blur"
            operator="arithmetic"
            k2="1"
            k3="-0.45"
            result="inset"
          />
        </filter>
        <radialGradient id="elx-sheen" cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="45%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {circles.map((c, i) => (
        <g
          key={i}
          className="elixir-logo-dot"
          style={{ transitionDelay: `${c.delay}ms` }}
        >
          {/* Recessed well behind the circle */}
          <circle
            cx={c.cx}
            cy={c.cy}
            r={R + 3}
            fill="rgba(10, 14, 40, 0.10)"
          />
          <circle
            cx={c.cx}
            cy={c.cy}
            r={R}
            fill={c.fill}
            filter="url(#elx-inset)"
          />
          {/* Glass sheen on top */}
          <circle cx={c.cx} cy={c.cy} r={R} fill="url(#elx-sheen)" />
        </g>
      ))}
    </svg>
  );
}
