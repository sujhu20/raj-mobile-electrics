interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
  const dimensions = {
    sm: { icon: 'w-7 h-7', text: 'text-base', subtext: 'text-[9px]' },
    md: { icon: 'w-9 h-9', text: 'text-lg', subtext: 'text-[10px]' },
    lg: { icon: 'w-14 h-14', text: 'text-2xl', subtext: 'text-xs' },
    xl: { icon: 'w-24 h-24', text: 'text-4xl', subtext: 'text-sm' },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 group ${className}`}>
      {/* Icon: Stylized Golden R and Lightning Electrics Emblem */}
      <div className={`${dimensions.icon} rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 p-[1.5px] flex items-center justify-center shadow-sm shrink-0 transition-transform group-hover:scale-105 duration-300`}>
        <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="w-3/5 h-3/5 text-primary-500 transition-colors"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 20V4h8a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H4" />
            <path d="M12 12l4 8" />
            <path d="M16 3l-3 4h4l-3 4" className="text-amber-500 fill-amber-500" />
          </svg>
        </div>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={`font-extrabold tracking-tight leading-none text-surface-900 group-hover:text-primary-500 transition duration-300 ${dimensions.text}`}>
            Raj Mobile
          </span>
          <span className={`font-bold tracking-widest text-surface-500 uppercase mt-0.5 ${dimensions.subtext}`}>
            & Electrics
          </span>
        </div>
      )}
    </div>
  );
}
