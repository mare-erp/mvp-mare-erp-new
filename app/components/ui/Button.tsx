'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'default' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:outline-blue-600 disabled:bg-blue-400 disabled:text-white disabled:cursor-not-allowed',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:outline-gray-400 disabled:bg-gray-200 disabled:text-gray-500',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:outline-gray-400 disabled:text-gray-400'
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'px-3 py-2 h-10',
  icon: 'h-10 w-10 p-0'
};

export function Button({
  children,
  isLoading = false,
  variant = 'primary',
  size = 'default',
  fullWidth = true,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const composedClassName = [
    'inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...props}
      disabled={isLoading || disabled}
      className={composedClassName}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
}
