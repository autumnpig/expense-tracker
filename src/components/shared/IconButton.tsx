import { type LucideIcon } from 'lucide-react';

interface IconButtonProps {
  icon: LucideIcon;
  label?: string;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function IconButton({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  size = 'md',
  className = '',
}: IconButtonProps) {
  const sizeMap = { sm: 'p-1.5', md: 'p-2.5', lg: 'p-3.5' };
  const iconSize = { sm: 16, md: 20, lg: 24 };
  const variantMap = {
    default: 'bg-muted hover:bg-muted/80 text-foreground',
    primary: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm',
    ghost: 'hover:bg-muted text-muted-foreground hover:text-foreground',
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl transition-colors ${sizeMap[size]} ${variantMap[variant]} ${className}`}
    >
      <Icon size={iconSize[size]} />
      {label && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
