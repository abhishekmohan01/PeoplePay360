import React from 'react';
import { Search } from 'lucide-react';
import { Input, type InputProps } from './Input';
import { cn } from '../../lib/utils';
import './SearchInput.css';

export const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className={cn('search-input-wrapper', className)}>
        <Search className="search-icon" size={18} />
        <Input 
          ref={ref}
          className="search-input" 
          placeholder="Search..."
          {...props} 
        />
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';
