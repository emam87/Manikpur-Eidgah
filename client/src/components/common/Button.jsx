import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'emerald' | 'outline' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-bold tracking-wide rounded-xl transition-all duration-200 select-none tap-feedback focus-heritage disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none overflow-hidden';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-2 min-h-[38px] gap-1.5',
    md: 'text-sm px-5 py-2.5 min-h-[44px] gap-2',
    lg: 'text-base px-6 py-3.5 min-h-[50px] gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-primary text-white hover:bg-primary-hover shadow-sakinah-sm hover:shadow-sakinah-card active:scale-[0.98] border border-primary/80',
    emerald:
      'bg-primary-dark text-canvas hover:bg-primary shadow-sakinah-sm active:scale-[0.98] border border-gold/30',
    outline:
      'bg-surface/80 text-primary-dark border-2 border-primary hover:bg-primary-soft/65 active:scale-[0.98]',
    ghost:
      'bg-transparent text-ink hover:bg-canvas-alt active:scale-[0.98]',
    danger:
      'bg-danger-soft text-danger border border-danger/35 hover:bg-danger hover:text-white active:scale-[0.98]',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
}
