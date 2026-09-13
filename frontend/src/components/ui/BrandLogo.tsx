
interface BrandLogoProps {
  isCollapsed?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function BrandLogo({ isCollapsed = false, className = "", onClick }: BrandLogoProps) {
  return (
    <div 
      className={`flex items-center shrink-0 ${isCollapsed ? 'justify-center mx-auto' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <svg
        aria-label="BodhSight"
        role="img"
        viewBox={isCollapsed ? "0 0 48 48" : "0 0 184 48"}
        className={isCollapsed ? "h-10 w-10 md:h-11 md:w-11" : "h-8 w-[122px] md:h-9 md:w-[138px]"}
      >
        <defs>
          <linearGradient id="bodhsight-mark" x1="6" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0f766e" />
            <stop offset="1" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#bodhsight-mark)" />
        <path d="M15 12v24M15 12h8.5c5.2 0 8.5 2.8 8.5 7s-3.3 7-8.5 7H15m9 0 9 10" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        {!isCollapsed && <>
          <text x="55" y="30" fill="currentColor" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="22" fontWeight="750" letterSpacing="-0.7">BodhSight</text>
          <circle cx="174" cy="11" r="3" fill="#14b8a6" />
        </>}
      </svg>
    </div>
  );
}
