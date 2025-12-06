import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ className, size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary p-2 glow-pink',
          sizeClasses[size]
        )}
      >
        <FileText className="h-full w-full text-primary-foreground" />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 blur-xl" />
      </div>
      {showText && (
        <span className={cn('font-bold gradient-text', textSizeClasses[size])}>
          File Questionaire
        </span>
      )}
    </div>
  );
}
