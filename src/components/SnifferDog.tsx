"use client";

export default function SnifferDog({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      {/* Background circle */}
      <circle cx="100" cy="100" r="95" fill="url(#bgGrad)" />

      {/* Body */}
      <ellipse cx="100" cy="138" rx="38" ry="28" fill="#8B6914" />
      {/* Belly */}
      <ellipse cx="100" cy="145" rx="24" ry="16" fill="#D4A537" />

      {/* Head */}
      <circle cx="100" cy="90" r="32" fill="#B8860B" />

      {/* Ears */}
      <ellipse cx="72" cy="70" rx="14" ry="22" fill="#8B6914" transform="rotate(-15 72 70)" />
      <ellipse cx="128" cy="70" rx="14" ry="22" fill="#8B6914" transform="rotate(15 128 70)" />
      <ellipse cx="73" cy="72" rx="9" ry="16" fill="#A07010" transform="rotate(-15 73 72)" />
      <ellipse cx="127" cy="72" rx="9" ry="16" fill="#A07010" transform="rotate(15 127 72)" />

      {/* Face lighter patch */}
      <ellipse cx="100" cy="96" rx="20" ry="18" fill="#D4A537" />

      {/* Eyes */}
      <ellipse cx="89" cy="85" rx="5.5" ry="6" fill="#1a1a1a" />
      <ellipse cx="111" cy="85" rx="5.5" ry="6" fill="#1a1a1a" />
      <circle cx="91" cy="83" r="2" fill="white" />
      <circle cx="113" cy="83" r="2" fill="white" />

      {/* Nose */}
      <ellipse cx="100" cy="97" rx="7" ry="5" fill="#1a1a1a" />
      <ellipse cx="100" cy="96" rx="3" ry="1.5" fill="#444" opacity="0.5" />

      {/* Mouth */}
      <path d="M93 101 Q100 108 107 101" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M100 97 L100 104" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />

      {/* Tongue */}
      <ellipse cx="104" cy="106" rx="4" ry="5" fill="#E8627C" />
      <ellipse cx="104" cy="105" rx="2.5" ry="3" fill="#F08090" />

      {/* Backpack */}
      <rect x="60" y="120" rx="6" ry="6" width="22" height="28" fill="#3B82F6" />
      <rect x="63" y="124" rx="3" ry="3" width="16" height="10" fill="#60A5FA" />
      <rect x="64" y="138" rx="2" ry="2" width="14" height="6" fill="#2563EB" />
      <path d="M66 120 Q71 112 76 120" stroke="#2563EB" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Map in paw */}
      <rect x="120" y="130" rx="2" ry="2" width="20" height="15" fill="#FEF3C7" stroke="#D97706" strokeWidth="1" transform="rotate(10 130 137)" />
      <path d="M124 134 L128 138 L133 133 L138 137" stroke="#EF4444" strokeWidth="1.2" fill="none" strokeLinecap="round" transform="rotate(10 130 137)" />

      {/* Front paws */}
      <ellipse cx="80" cy="162" rx="10" ry="6" fill="#B8860B" />
      <ellipse cx="120" cy="162" rx="10" ry="6" fill="#B8860B" />

      {/* Tail */}
      <path d="M135 130 Q155 110 150 95" stroke="#8B6914" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="150" cy="95" r="4" fill="#D4A537" />

      {/* Collar */}
      <path d="M75 110 Q100 118 125 110" stroke="#EF4444" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="100" cy="115" r="4" fill="#FDE047" />

      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </radialGradient>
      </defs>
    </svg>
  );
}
