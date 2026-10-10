import React from 'react';

/**
 * Unique Haute Coiffure & Bridal Lotus Emblem for AURA
 * Combines:
 * 1. Architectural Monogram 'A'
 * 2. Couture Styling Shears with delicate finger loops
 * 3. Sacred Blooming Bridal Lotus Flower (symbolizing South Indian Muhurtham artistry & wellness)
 * 4. Radiant Luminous Golden Halo (the namesake "AURA")
 * 5. Sparkling high-jewelry diamond pips
 */
export function AuraEmblem({ size = 44, className = "", animated = true }) {
  const id = React.useId().replace(/:/g, '');
  const goldGradId = `gold-grad-${id}`;
  const goldLightGradId = `gold-light-${id}`;
  const goldDeepGradId = `gold-deep-${id}`;
  const auraGlowId = `aura-glow-${id}`;
  const glowFilterId = `glow-filter-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-all duration-300 ${animated ? 'group-hover:scale-105 group-hover:rotate-[0.5deg]' : ''} ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Multi-Stop 24K Luxury Gold Gradient */}
        <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF7D6" />
          <stop offset="25%" stopColor="#E8C76D" />
          <stop offset="50%" stopColor="#B88A2D" />
          <stop offset="75%" stopColor="#FDF8CC" />
          <stop offset="100%" stopColor="#9C6E1A" />
        </linearGradient>

        {/* Champagne Highlight Gradient */}
        <linearGradient id={goldLightGradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E0C68E" />
          <stop offset="50%" stopColor="#FFFDF7" />
          <stop offset="100%" stopColor="#A88235" />
        </linearGradient>

        {/* Deep Antique Gold for Petal Shadows */}
        <linearGradient id={goldDeepGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#785312" />
          <stop offset="100%" stopColor="#D9B76A" />
        </linearGradient>

        {/* Luminous Warm Golden Aura Glow */}
        <radialGradient id={auraGlowId} cx="50%" cy="47%" r="48%">
          <stop offset="0%" stopColor="#E8C76D" stopOpacity="0.32" />
          <stop offset="45%" stopColor="#B88A2D" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0B0F17" stopOpacity="0" />
        </radialGradient>

        {/* Soft Shimmer Filter */}
        <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Luminous Aura Ambient Glow */}
      <circle cx="60" cy="54" r="44" fill={`url(#${auraGlowId})`} />

      {/* Radiant Glowing "AURA" Halo Ring */}
      <circle
        cx="60"
        cy="54"
        r="40"
        stroke={`url(#${goldGradId})`}
        strokeWidth="1.5"
        strokeOpacity="0.9"
      />
      <circle
        cx="60"
        cy="54"
        r="40"
        stroke="#FFF4D0"
        strokeWidth="3.5"
        strokeOpacity="0.12"
        filter={`url(#${glowFilterId})`}
      />

      {/* Outer Architectural 'A' Chevrons */}
      <path
        d="M60 16L34 76"
        stroke={`url(#${goldLightGradId})`}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M60 16L86 76"
        stroke={`url(#${goldGradId})`}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Concentric Inner Gable Chevrons */}
      <path
        d="M60 25L42 66"
        stroke={`url(#${goldLightGradId})`}
        strokeWidth="1.2"
        strokeOpacity="0.75"
      />
      <path
        d="M60 25L78 66"
        stroke={`url(#${goldGradId})`}
        strokeWidth="2.2"
        strokeOpacity="0.8"
      />

      {/* Haute Coiffure Shears Blades (Rising behind the lotus) */}
      <path
        d="M52 48L44 24Q47 27 55 42Z"
        fill={`url(#${goldLightGradId})`}
        stroke={`url(#${goldDeepGradId})`}
        strokeWidth="0.5"
      />
      <path
        d="M68 48L76 24Q73 27 65 42Z"
        fill={`url(#${goldGradId})`}
        stroke={`url(#${goldDeepGradId})`}
        strokeWidth="0.5"
      />
      {/* Blade Gleam Lines */}
      <line x1="46" y1="28" x2="52" y2="42" stroke="#FFFDF7" strokeWidth="0.7" strokeLinecap="round" />
      <line x1="74" y1="28" x2="68" y2="42" stroke="#FFFDF7" strokeWidth="0.7" strokeLinecap="round" />

      {/* Blooming Golden Lotus Flower (The Heart of the Monogram) */}
      {/* Center Upright Petal */}
      <path
        d="M60 37C56 43 55 52 60 59C65 52 64 43 60 37Z"
        fill={`url(#${goldLightGradId})`}
        stroke={`url(#${goldDeepGradId})`}
        strokeWidth="0.6"
      />
      {/* Center Left Inner Petal */}
      <path
        d="M58 42C51 46 48 54 54 61C58 57 60 50 58 42Z"
        fill={`url(#${goldGradId})`}
        stroke={`url(#${goldDeepGradId})`}
        strokeWidth="0.6"
      />
      {/* Center Right Inner Petal */}
      <path
        d="M62 42C69 46 72 54 66 61C62 57 60 50 62 42Z"
        fill={`url(#${goldGradId})`}
        stroke={`url(#${goldDeepGradId})`}
        strokeWidth="0.6"
      />
      {/* Outer Left Blooming Petal */}
      <path
        d="M53 48C43 51 39 58 46 65C53 62 56 56 53 48Z"
        fill={`url(#${goldGradId})`}
        stroke={`url(#${goldDeepGradId})`}
        strokeWidth="0.6"
      />
      {/* Outer Right Blooming Petal */}
      <path
        d="M67 48C77 51 81 58 74 65C67 62 64 56 67 48Z"
        fill={`url(#${goldGradId})`}
        stroke={`url(#${goldDeepGradId})`}
        strokeWidth="0.6"
      />
      {/* Lower Calyx Center Petal */}
      <path
        d="M60 61C57 65 56 70 60 75C64 70 63 65 60 61Z"
        fill={`url(#${goldLightGradId})`}
        stroke={`url(#${goldDeepGradId})`}
        strokeWidth="0.5"
      />
      {/* Lower Calyx Left Petal */}
      <path
        d="M58 62C52 65 50 69 54 73C57 71 59 66 58 62Z"
        fill={`url(#${goldGradId})`}
        stroke={`url(#${goldDeepGradId})`}
        strokeWidth="0.5"
      />
      {/* Lower Calyx Right Petal */}
      <path
        d="M62 62C68 65 70 69 66 73C63 71 61 66 62 62Z"
        fill={`url(#${goldGradId})`}
        stroke={`url(#${goldDeepGradId})`}
        strokeWidth="0.5"
      />

      {/* Scissor Finger Loops & Architectural Pedestals */}
      {/* Left Scissor Loop */}
      <circle
        cx="34"
        cy="75"
        r="8.5"
        stroke={`url(#${goldGradId})`}
        strokeWidth="2.4"
        fill="none"
      />
      <circle
        cx="34"
        cy="75"
        r="4.2"
        stroke={`url(#${goldLightGradId})`}
        strokeWidth="0.8"
        strokeOpacity="0.7"
        fill="none"
      />
      {/* Right Scissor Loop */}
      <circle
        cx="86"
        cy="75"
        r="8.5"
        stroke={`url(#${goldGradId})`}
        strokeWidth="2.4"
        fill="none"
      />
      <circle
        cx="86"
        cy="75"
        r="4.2"
        stroke={`url(#${goldLightGradId})`}
        strokeWidth="0.8"
        strokeOpacity="0.7"
        fill="none"
      />

      {/* Base Foundation Pedestals & Crossbar */}
      <path d="M25 85L43 85" stroke={`url(#${goldLightGradId})`} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M77 85L95 85" stroke={`url(#${goldGradId})`} strokeWidth="3" strokeLinecap="round" />
      <path d="M43 85L77 85" stroke={`url(#${goldGradId})`} strokeWidth="1" strokeOpacity="0.75" />
      {/* Scissor Loop Stems */}
      <path d="M34 83.5L34 85" stroke={`url(#${goldLightGradId})`} strokeWidth="2" />
      <path d="M86 83.5L86 85" stroke={`url(#${goldGradId})`} strokeWidth="2.4" />

      {/* Sparkling 4-Point High-Jewelry Diamond Pips */}
      {/* Top Apex Crown Star */}
      <polygon
        points="60,10 61.5,13.5 65,15 61.5,16.5 60,20 58.5,16.5 55,15 58.5,13.5"
        fill="#FFFDF7"
        filter={`url(#${glowFilterId})`}
      />
      {/* Center Pivot Jewel */}
      <polygon
        points="60,49 61.5,52 64.5,53.5 61.5,55 60,58 58.5,55 55.5,53.5 58.5,52"
        fill="#FFFDF7"
      />
    </svg>
  );
}

/**
 * 3D Embossed Metallic Gold Foil Render Badge
 */
export function AuraEmbossedBadge({ size = 44, className = "" }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-gold-600/60 via-amber-200/40 to-gold-700/80 shadow-lg shadow-gold-500/15 border border-gold-400/40 group-hover:border-gold-300 transition duration-300 ${className}`}
    >
      <img
        src="/aura-logo.jpg"
        alt="AURA Unique Emblem"
        className="w-full h-full object-cover rounded-[14px]"
      />
    </div>
  );
}

/**
 * Complete Brand Logo with Emblem & Modern Minimalist Typography
 */
export default function BrandLogo({
  variant = 'horizontal',
  size = 'md',
  useEmbossedImage = false,
  subtitle = 'Luxury Salon & Bridal Lounge',
  showSubtitle = true,
  className = '',
  onClick = null,
}) {
  // Size mappings
  const emblemSizes = {
    sm: 34,
    md: 46,
    lg: 56,
    xl: 72,
  };

  const titleSizes = {
    sm: 'text-lg tracking-[0.25em]',
    md: 'text-2xl tracking-[0.3em]',
    lg: 'text-3xl tracking-[0.35em]',
    xl: 'text-4xl tracking-[0.4em]',
  };

  const subtitleSizes = {
    sm: 'text-[8px] tracking-[0.2em]',
    md: 'text-[9.5px] tracking-[0.22em]',
    lg: 'text-[11px] tracking-[0.25em]',
    xl: 'text-xs tracking-[0.28em]',
  };

  const emblemSize = typeof size === 'number' ? size : (emblemSizes[size] || 46);
  const titleClass = titleSizes[size] || titleSizes.md;
  const subtitleClass = subtitleSizes[size] || subtitleSizes.md;

  const EmblemComponent = useEmbossedImage ? (
    <AuraEmbossedBadge size={emblemSize} />
  ) : (
    <AuraEmblem size={emblemSize} />
  );

  if (variant === 'icon-only') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        {EmblemComponent}
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div
        onClick={onClick}
        className={`flex flex-col items-center text-center gap-2 group ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        {EmblemComponent}
        <div>
          <div className={`font-serif font-black text-white group-hover:text-gold-300 transition duration-300 ${titleClass}`}>
            A U R A
          </div>
          {showSubtitle && subtitle && (
            <div className={`uppercase text-gold-400 font-medium mt-0.5 ${subtitleClass}`}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default: Horizontal layout
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3.5 group select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {EmblemComponent}
      <div>
        <div className={`font-serif font-black text-white group-hover:text-gold-300 transition duration-300 leading-tight ${titleClass}`}>
          A U R A
        </div>
        {showSubtitle && subtitle && (
          <div className={`uppercase text-gold-400 font-medium mt-0.5 ${subtitleClass}`}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
