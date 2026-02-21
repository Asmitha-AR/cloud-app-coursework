import Image from 'next/image';

type BrandLogoProps = {
  size?: number;
  className?: string;
};

export default function BrandLogo({ size = 50, className = '' }: BrandLogoProps) {
  return (
    <Image
      src="/techsalary-logo.svg"
      alt="TechSalary.lk"
      width={size * 3}
      height={size}
      className={className}
      priority
    />
  );
}
