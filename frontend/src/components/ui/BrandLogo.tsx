
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
      <div 
        className={`relative overflow-hidden transition-all duration-300 ease-in-out shrink-0 flex items-center ${
          isCollapsed ? 'w-10 h-10 md:w-11 md:h-11' : 'w-[84px] h-7 md:w-[96px] md:h-8'
        }`}
      >
        <img 
          src="/tt-p.png" 
          alt="BodhSight Logo" 
          className={`absolute left-0 top-0 h-full w-auto max-w-none object-cover object-left drop-shadow-sm dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] transition-all ${isCollapsed ? 'scale-[1.5] origin-left' : ''}`} 
        />
      </div>
    </div>
  );
}
