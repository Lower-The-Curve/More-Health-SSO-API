type BrandLogoProps = {
  variant?: "dark" | "light";
  className?: string;
};

export function BrandLogo({ variant = "dark", className = "" }: BrandLogoProps) {
  if (variant === "light") {
    return (
      <div className={`flex items-center ${className}`}>
        <img
          src="/images/more-health-logo-mark.png"
          alt="More Health"
          className="h-8 w-auto object-contain select-none"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className="overflow-hidden rounded-lg shadow-sm ring-1 ring-black/5">
        <img
          src="/images/more-health-logo.png"
          alt="More Health"
          className="h-9 w-auto object-cover block select-none"
          draggable={false}
        />
      </div>
    </div>
  );
}
