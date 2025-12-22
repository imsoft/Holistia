import Image from "next/image";

interface VerifiedBadgeProps {
  size?: number;
  className?: string;
}

export function VerifiedBadge({ size = 20, className = "" }: VerifiedBadgeProps) {
  return (
    <Image
      src="/logos/insignia.svg"
      alt="Verificado"
      width={size}
      height={size}
      className={`inline-block ${className}`}
      title="Profesional Verificado"
    />
  );
}
