import React from 'react';
import { cn } from '../../lib/utils';
import './StatusBadge.css';

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: 'Active' | 'Inactive' | 'Draft' | 'Validated' | 'Paid' | 'Pending' | string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
}

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, variant, className, ...props }, ref) => {
    
    // Auto-derive variant based on common statuses if not explicitly provided
    let finalVariant = variant;
    if (!finalVariant) {
      const lower = (status || '').toLowerCase();
      if (['active', 'paid', 'approved', 'present', 'running'].includes(lower)) finalVariant = 'success';
      else if (['warning', 'pending', 'draft', 'submitted', 'part_time'].includes(lower)) finalVariant = 'warning';
      else if (['error', 'inactive', 'refused', 'rejected', 'absent', 'terminated', 'cancelled'].includes(lower)) finalVariant = 'error';
      else finalVariant = 'default';
    }

    return (
      <span 
        ref={ref} 
        className={cn('status-badge', `status-${finalVariant}`, className)}
        {...props}
      >
        {status}
      </span>
    );
  }
);
StatusBadge.displayName = 'StatusBadge';
