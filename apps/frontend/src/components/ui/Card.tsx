import React from 'react';
import { cn } from '../../lib/utils';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('card', className)} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
