import { V2_ROUTE_GEO } from "@/lib/v2HomeData";
import {
  buildTravelPath,
  projectGeoPoints,
  V2_MAP_VIEWBOX,
} from "@/lib/v2MapProjection";

type Props = {
  className?: string;
  highlight?: string;
  animate?: boolean;
  showLabels?: boolean;
  numbered?: boolean;
  compact?: boolean;
};

export default function V2RouteMap({
  className = "",
  highlight = "Nizza",
  animate = false,
  showLabels = true,
  numbered = false,
  compact = false,
}: Props) {
  const projected = projectGeoPoints(V2_ROUTE_GEO);
  const pathD = buildTravelPath(projected);
  const { width, height } = V2_MAP_VIEWBOX;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`${className}${animate ? " v2-map--animate" : ""}`}
      role="img"
      aria-label="Route Zürich, Nizza, Cannes, Saint-Tropez"
    >
      <rect width={width} height={height} fill="#dce8f0" className="v2-map-sea" />

      {/* Stilisiertes Land – Alpen / Mittelmeerküste */}
      <path
        d="M0 0 H320 V140 C260 120 200 130 150 155 C100 175 40 200 0 220 V0Z"
        fill="#d4e6d0"
        className="v2-map-land"
        opacity="0.85"
      />
      <path
        d="M0 220 C80 200 140 210 200 230 C250 245 290 260 320 270 V360 H0 V220Z"
        fill="#c8ddd4"
        className="v2-map-land"
        opacity="0.7"
      />

      <path
        d={pathD}
        fill="none"
        stroke="#0071e3"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="v2-map-route"
        pathLength={1}
      />

      {projected.map((p, i) => {
        const active = highlight === p.name;
        const num = i + 1;
        const labelRight = p.x < width * 0.55;
        const showThisLabel = showLabels && (!compact || active || p.kind === "origin");

        return (
          <g key={p.name} className="v2-map-marker" style={{ animationDelay: `${0.2 + i * 0.18}s` }}>
            <circle
              cx={p.x}
              cy={p.y}
              r={active ? 9 : 7}
              fill="#ffffff"
              stroke="#0071e3"
              strokeWidth="2"
            />
            {numbered ? (
              <text
                x={p.x}
                y={p.y + 3.5}
                textAnchor="middle"
                fontSize={active ? 8 : 7}
                fontWeight={700}
                fontFamily="var(--font-display), system-ui, sans-serif"
                fill="#0071e3"
              >
                {String(num).padStart(2, "0")}
              </text>
            ) : (
              <circle cx={p.x} cy={p.y} r={active ? 3.5 : 2.5} fill="#0071e3" />
            )}
            {showThisLabel && (
              <text
                x={labelRight ? p.x + 13 : p.x - 13}
                y={p.y + (p.name === "Zürich" ? -6 : 4)}
                textAnchor={labelRight ? "start" : "end"}
                fontSize={active ? 11 : compact ? 9 : 10}
                fontWeight={active ? 650 : 500}
                fontFamily="var(--font-display), system-ui, sans-serif"
                fill="#1d1d1f"
              >
                {p.name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
