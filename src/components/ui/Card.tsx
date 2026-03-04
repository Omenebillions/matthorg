// src/components/ui/Card.tsx
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = true, interactive = false, onClick }: CardProps) {
  const baseClasses = 'card';
  const hoverClasses = hover ? 'card-hover' : '';
  const interactiveClasses = interactive ? 'card-interactive' : '';
  
  const Component = interactive ? motion.div : 'div';
  const props = interactive ? {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
  } : {};

  return (
    <Component
      className={`${baseClasses} ${hoverClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  );
}