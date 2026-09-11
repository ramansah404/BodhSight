
interface BrandLogoProps {
  isCollapsed?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function BrandLogo({ isCollapsed = false, className = "", onClick }: BrandLogoProps) {
  return (
    <div 
      className={`flex items-center gap-2.5 shrink-0 ${isCollapsed ? 'justify-center mx-auto' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <img 
        src="/logo-a.png" 
        alt="BodhSight Icon" 
        className="h-7 md:h-8 w-auto object-contain shrink-0 drop-shadow-sm dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.15)] transition-all" 
      />
      
      {!isCollapsed && (
        <img 
          src="/logo-b.png" 
          alt="BodhSight Wordmark" 
          className="h-5 md:h-6 w-auto object-contain shrink-0 dark:brightness-150 dark:contrast-125 drop-shadow-sm transition-all" 
        />
      )}
    </div>
  );
}
