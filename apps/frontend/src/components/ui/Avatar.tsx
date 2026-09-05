import React from 'react';
import { cn } from '../../lib/utils';
import './Avatar.css';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, src, size = 'md', className, ...props }, ref) => {
    
    // Get initials (up to 2 letters)
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return (
      <div 
        ref={ref} 
        className={cn('avatar', `avatar-${size}`, className)}
        title={name}
        {...props}
      >
        {src ? (
          <img src={src} alt={name} className="avatar-img" />
        ) : (
          <span className="avatar-initials">{initials}</span>
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';
