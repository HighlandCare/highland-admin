"use client";

const SLOGAN = "Reliable. Fast. Covered. for every service";

type LogoVariant = "sidebar" | "header" | "default";

const variantStyles: Record<
  LogoVariant,
  { logoHeight: number; textClass: string; sloganClass: string }
> = {
  sidebar: {
    logoHeight: 32,
    textClass: "text-[1rem] font-bold leading-none",
    sloganClass: "text-[0.65rem] opacity-80 leading-tight mt-0.5",
  },
  header: {
    logoHeight: 28,
    textClass: "text-sm font-bold leading-none",
    sloganClass: "hidden",
  },
  default: {
    logoHeight: 40,
    textClass: "text-xl font-bold leading-none",
    sloganClass: "text-xs opacity-90 leading-tight mt-1",
  },
};

interface LogoProps {
  variant?: LogoVariant;
  showSlogan?: boolean;
  className?: string;
}

export function Logo({
  variant = "default",
  showSlogan = true,
  className = "",
}: LogoProps) {
  const { logoHeight, textClass, sloganClass } = variantStyles[variant];
  const sloganVisible = showSlogan && variantStyles[variant].sloganClass !== "hidden";

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-2">
        <img
          src="/assets/main-logo.png"
          alt=""
          className="h-auto w-auto flex-shrink-0 object-contain"
          style={{ height: logoHeight, width: "auto" }}
        />
        <span className={textClass} style={{ fontWeight: 700 }}>
          Highland Care
        </span>
      </div>
      {sloganVisible && <p className={sloganClass}>{SLOGAN}</p>}
    </div>
  );
}
