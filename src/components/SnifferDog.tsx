"use client";

export default function SnifferDog({ size = 320 }: { size?: number }) {
  const h = size * 0.55;
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 640 352"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-sm w-full h-auto"
    >
      {/* Sky gradient */}
      <rect width="640" height="352" rx="24" fill="url(#sky)" />

      {/* Clouds */}
      <ellipse cx="120" cy="60" rx="50" ry="18" fill="white" opacity="0.5" />
      <ellipse cx="145" cy="52" rx="35" ry="14" fill="white" opacity="0.4" />
      <ellipse cx="480" cy="75" rx="44" ry="16" fill="white" opacity="0.45" />
      <ellipse cx="505" cy="68" rx="30" ry="12" fill="white" opacity="0.35" />
      <ellipse cx="310" cy="42" rx="38" ry="13" fill="white" opacity="0.3" />

      {/* Sun */}
      <circle cx="560" cy="55" r="28" fill="#FDE68A" opacity="0.7" />
      <circle cx="560" cy="55" r="20" fill="#FCD34D" opacity="0.8" />

      {/* Mountains far back */}
      <path d="M0 200 L80 130 L160 180 L240 110 L320 160 L400 100 L480 150 L560 120 L640 170 L640 260 L0 260Z" fill="#CBD5E1" opacity="0.4" />
      <path d="M0 230 L100 170 L200 210 L300 155 L400 195 L500 160 L600 200 L640 185 L640 260 L0 260Z" fill="#94A3B8" opacity="0.3" />

      {/* Hotel building (right background) */}
      <rect x="485" y="155" width="55" height="75" rx="3" fill="#64748B" opacity="0.6" />
      <rect x="548" y="170" width="40" height="60" rx="3" fill="#64748B" opacity="0.5" />
      {/* Windows */}
      <rect x="493" y="163" width="10" height="10" rx="1.5" fill="#FDE68A" opacity="0.8" />
      <rect x="509" y="163" width="10" height="10" rx="1.5" fill="#FDE68A" opacity="0.6" />
      <rect x="525" y="163" width="10" height="10" rx="1.5" fill="#FDE68A" opacity="0.8" />
      <rect x="493" y="180" width="10" height="10" rx="1.5" fill="#FDE68A" opacity="0.7" />
      <rect x="509" y="180" width="10" height="10" rx="1.5" fill="#FDE68A" opacity="0.8" />
      <rect x="525" y="180" width="10" height="10" rx="1.5" fill="#FDE68A" opacity="0.6" />
      <rect x="493" y="197" width="10" height="10" rx="1.5" fill="#FDE68A" opacity="0.6" />
      <rect x="509" y="197" width="10" height="10" rx="1.5" fill="#FDE68A" opacity="0.7" />
      <rect x="525" y="197" width="10" height="10" rx="1.5" fill="#FDE68A" opacity="0.8" />
      <rect x="555" y="178" width="8" height="8" rx="1.5" fill="#FDE68A" opacity="0.7" />
      <rect x="570" y="178" width="8" height="8" rx="1.5" fill="#FDE68A" opacity="0.6" />
      <rect x="555" y="193" width="8" height="8" rx="1.5" fill="#FDE68A" opacity="0.8" />
      <rect x="570" y="193" width="8" height="8" rx="1.5" fill="#FDE68A" opacity="0.7" />
      <rect x="555" y="208" width="8" height="8" rx="1.5" fill="#FDE68A" opacity="0.6" />
      <rect x="570" y="208" width="8" height="8" rx="1.5" fill="#FDE68A" opacity="0.8" />
      {/* Hotel sign */}
      <rect x="498" y="148" width="30" height="10" rx="2" fill="#3B82F6" opacity="0.7" />
      <text x="513" y="156" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif">HOTEL</text>

      {/* Trees left background */}
      <ellipse cx="55" cy="200" rx="22" ry="30" fill="#059669" opacity="0.35" />
      <rect x="52" y="220" width="6" height="15" rx="2" fill="#65A30D" opacity="0.3" />
      <ellipse cx="95" cy="195" rx="18" ry="25" fill="#10B981" opacity="0.3" />
      <rect x="92" y="212" width="5" height="12" rx="2" fill="#65A30D" opacity="0.25" />
      <ellipse cx="35" cy="210" rx="15" ry="20" fill="#059669" opacity="0.25" />

      {/* Airplane */}
      <g transform="translate(200, 35) rotate(-8)">
        <path d="M0 8 L30 4 L42 0 L44 6 L34 8 L44 14 L42 16 L30 12 L8 14 L10 10 L0 12Z" fill="#64748B" opacity="0.55" />
        <path d="M18 5 L18 -4 L24 -2 L24 6Z" fill="#64748B" opacity="0.4" />
        <path d="M18 14 L18 22 L24 20 L24 12Z" fill="#64748B" opacity="0.4" />
        {/* Contrail */}
        <line x1="-2" y1="9" x2="-40" y2="14" stroke="white" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
        <line x1="-2" y1="11" x2="-38" y2="16" stroke="white" strokeWidth="1" opacity="0.15" strokeLinecap="round" />
      </g>

      {/* Ground / grass */}
      <path d="M0 240 Q160 230 320 242 Q480 254 640 238 L640 352 L0 352Z" fill="url(#grass)" />

      {/* Path / road */}
      <path d="M-10 310 Q80 290 180 295 Q300 300 380 280 Q460 262 540 268 Q600 272 660 260" stroke="#D4B896" strokeWidth="32" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M-10 310 Q80 290 180 295 Q300 300 380 280 Q460 262 540 268 Q600 272 660 260" stroke="#C4A87A" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.3" strokeDasharray="8 12" />

      {/* Train on tracks (far left/mid) */}
      <g transform="translate(60, 252)">
        {/* Rails */}
        <line x1="-15" y1="18" x2="82" y2="18" stroke="#78716C" strokeWidth="1.5" opacity="0.4" />
        <line x1="-15" y1="21" x2="82" y2="21" stroke="#78716C" strokeWidth="1.5" opacity="0.4" />
        {/* Rail ties */}
        {[0, 10, 20, 30, 40, 50, 60, 70].map((x) => (
          <rect key={x} x={x - 2} y="16" width="4" height="7" rx="0.5" fill="#78716C" opacity="0.25" />
        ))}
        {/* Locomotive */}
        <rect x="0" y="4" width="26" height="14" rx="3" fill="#DC2626" opacity="0.65" />
        <rect x="2" y="7" width="8" height="6" rx="1.5" fill="#93C5FD" opacity="0.5" />
        <rect x="13" y="7" width="8" height="6" rx="1.5" fill="#93C5FD" opacity="0.5" />
        <circle cx="7" cy="18" r="3" fill="#44403C" opacity="0.5" />
        <circle cx="19" cy="18" r="3" fill="#44403C" opacity="0.5" />
        {/* Wagon */}
        <rect x="29" y="6" width="22" height="12" rx="2.5" fill="#3B82F6" opacity="0.55" />
        <rect x="32" y="8" width="6" height="6" rx="1" fill="#BAE6FD" opacity="0.5" />
        <rect x="42" y="8" width="6" height="6" rx="1" fill="#BAE6FD" opacity="0.5" />
        <circle cx="35" cy="18" r="3" fill="#44403C" opacity="0.5" />
        <circle cx="45" cy="18" r="3" fill="#44403C" opacity="0.5" />
        {/* Wagon 2 */}
        <rect x="54" y="6" width="22" height="12" rx="2.5" fill="#22C55E" opacity="0.45" />
        <rect x="57" y="8" width="6" height="6" rx="1" fill="#BBF7D0" opacity="0.4" />
        <rect x="67" y="8" width="6" height="6" rx="1" fill="#BBF7D0" opacity="0.4" />
        <circle cx="60" cy="18" r="3" fill="#44403C" opacity="0.5" />
        <circle cx="70" cy="18" r="3" fill="#44403C" opacity="0.5" />
      </g>

      {/* Car on road (right side) */}
      <g transform="translate(440, 255)">
        <rect x="0" y="6" width="36" height="14" rx="5" fill="#6366F1" opacity="0.6" />
        <rect x="4" y="0" width="24" height="12" rx="4" fill="#818CF8" opacity="0.5" />
        <rect x="7" y="2" width="8" height="7" rx="1.5" fill="#C7D2FE" opacity="0.5" />
        <rect x="18" y="2" width="8" height="7" rx="1.5" fill="#C7D2FE" opacity="0.5" />
        <circle cx="9" cy="20" r="4" fill="#1E1B4B" opacity="0.6" />
        <circle cx="27" cy="20" r="4" fill="#1E1B4B" opacity="0.6" />
        <circle cx="9" cy="20" r="2" fill="#4338CA" opacity="0.3" />
        <circle cx="27" cy="20" r="2" fill="#4338CA" opacity="0.3" />
      </g>

      {/* Flowers / details on grass */}
      {[160, 250, 350, 520, 590].map((x, i) => (
        <g key={i}>
          <line x1={x} y1={250 + (i % 3) * 4} x2={x} y2={258 + (i % 3) * 4} stroke="#16A34A" strokeWidth="1.2" opacity="0.4" />
          <circle cx={x} cy={249 + (i % 3) * 4} r={2} fill={i % 2 === 0 ? "#FBBF24" : "#F472B6"} opacity="0.5" />
        </g>
      ))}

      {/* === THE DOG (center, sniffing the path) === */}
      <g transform="translate(270, 268)">
        {/* Shadow */}
        <ellipse cx="28" cy="52" rx="30" ry="6" fill="black" opacity="0.08" />

        {/* Tail - wagging up */}
        <path d="M-4 14 Q-16 -4 -10 -14" stroke="#B8860B" strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="-10" cy="-14" r="3" fill="#D4A537" />

        {/* Back legs */}
        <rect x="0" y="34" width="8" height="18" rx="3.5" fill="#9A7209" />
        <rect x="12" y="34" width="8" height="18" rx="3.5" fill="#B8860B" />
        <ellipse cx="4" cy="52" rx="6" ry="3.5" fill="#8B6914" />
        <ellipse cx="16" cy="52" rx="6" ry="3.5" fill="#9A7209" />

        {/* Body */}
        <ellipse cx="26" cy="26" rx="28" ry="18" fill="#B8860B" />
        <ellipse cx="28" cy="30" rx="18" ry="11" fill="#D4A537" opacity="0.5" />

        {/* Front legs */}
        <rect x="38" y="32" width="8" height="20" rx="3.5" fill="#9A7209" />
        <rect x="48" y="30" width="8" height="22" rx="3.5" fill="#B8860B" />
        <ellipse cx="42" cy="52" rx="6" ry="3.5" fill="#8B6914" />
        <ellipse cx="52" cy="52" rx="6" ry="3.5" fill="#9A7209" />

        {/* Collar */}
        <path d="M40 18 Q48 22 54 16" stroke="#EF4444" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <circle cx="48" cy="21" r="2.5" fill="#FDE047" />

        {/* Neck */}
        <ellipse cx="50" cy="18" rx="12" ry="12" fill="#B8860B" />

        {/* Head - angled down (sniffing) */}
        <g transform="translate(52, 16) rotate(35)">
          {/* Head shape */}
          <ellipse cx="12" cy="6" rx="16" ry="13" fill="#B8860B" />
          {/* Lighter face */}
          <ellipse cx="16" cy="10" rx="10" ry="9" fill="#D4A537" />
          {/* Snout */}
          <ellipse cx="24" cy="10" rx="9" ry="7" fill="#D4A537" />
          <ellipse cx="28" cy="9" rx="5" ry="4" fill="#C49A2A" />
          {/* Nose */}
          <ellipse cx="30" cy="8" rx="3.5" ry="2.8" fill="#1a1a1a" />
          <ellipse cx="30" cy="7.5" rx="1.5" ry="0.8" fill="#555" opacity="0.5" />
          {/* Eye */}
          <ellipse cx="12" cy="3" rx="3" ry="3.5" fill="#1a1a1a" />
          <circle cx="13" cy="2" r="1.2" fill="white" />
          {/* Ear (floppy, hanging) */}
          <ellipse cx="4" cy="-4" rx="8" ry="12" fill="#8B6914" transform="rotate(-20 4 -4)" />
          <ellipse cx="5" cy="-2" rx="5" ry="8" fill="#A07010" transform="rotate(-20 5 -2)" />
          {/* Mouth hint */}
          <path d="M25 12 Q28 15 31 12" stroke="#1a1a1a" strokeWidth="1" fill="none" opacity="0.5" />
        </g>

        {/* Sniff lines (emanating from nose) */}
        <g opacity="0.3">
          <path d="M82 46 Q88 44 92 46" stroke="#8B6914" strokeWidth="1.2" fill="none" />
          <path d="M84 50 Q90 47 95 50" stroke="#8B6914" strokeWidth="1" fill="none" />
          <path d="M80 42 Q85 40 89 43" stroke="#8B6914" strokeWidth="1" fill="none" />
        </g>
      </g>

      {/* Paw prints on path (ahead of dog) */}
      <g opacity="0.15" fill="#6B5A2E">
        {/* Print 1 */}
        <ellipse cx="375" cy="285" rx="3" ry="4" />
        <circle cx="372" cy="280" r="1.5" />
        <circle cx="375" cy="278" r="1.5" />
        <circle cx="378" cy="280" r="1.5" />
        {/* Print 2 */}
        <ellipse cx="400" cy="280" rx="3" ry="4" />
        <circle cx="397" cy="275" r="1.5" />
        <circle cx="400" cy="273" r="1.5" />
        <circle cx="403" cy="275" r="1.5" />
        {/* Print 3 */}
        <ellipse cx="420" cy="276" rx="2.5" ry="3.5" />
        <circle cx="417" cy="272" r="1.3" />
        <circle cx="420" cy="270" r="1.3" />
        <circle cx="423" cy="272" r="1.3" />
      </g>

      {/* Signpost near dog */}
      <g transform="translate(220, 248)">
        <rect x="0" y="0" width="3" height="40" rx="1" fill="#78716C" opacity="0.5" />
        <rect x="-12" y="2" width="30" height="12" rx="3" fill="#F59E0B" opacity="0.55" />
        <rect x="-8" y="18" width="24" height="10" rx="3" fill="#F59E0B" opacity="0.45" transform="rotate(-5 4 23)" />
      </g>

      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="352">
          <stop offset="0%" stopColor="#DBEAFE" />
          <stop offset="50%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#D1FAE5" />
        </linearGradient>
        <linearGradient id="grass" x1="0" y1="230" x2="0" y2="352">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="100%" stopColor="#4ADE80" />
        </linearGradient>
      </defs>
    </svg>
  );
}
