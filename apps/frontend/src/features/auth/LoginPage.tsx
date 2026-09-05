import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { login } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import './LoginPage.css';

export const LoginPage = () => {
  const [email, setEmail] = useState('admin@peoplepay360.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const setAuth = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await login(email, password);
      setAuth(data.token, data.user);
      
      const roles = (data.user.roles || []).map((r: string) => r.toUpperCase());
      if (roles.includes('ADMIN')) {
        navigate('/employees', { replace: true });
      } else if (roles.includes('PAYROLL_USER')) {
        navigate('/payroll/dashboard', { replace: true });
      } else if (roles.includes('HR_MANAGER')) {
        navigate('/employees', { replace: true });
      } else {
        // Employee self-service default
        navigate('/attendance', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password123');
  };

  return (
    <div className="login-layout font-primary">
      <Card className="login-card max-w-md w-full">
        <div className="login-header">
          <h2 className="font-[Caveat] text-4xl font-bold text-text-primary">PeoplePay360</h2>
          <p className="font-sans text-sm text-muted">Role-Based HR & Payroll Management</p>
        </div>

        {error && <div className="login-error text-xs p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 mb-4">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <Input 
            label="Work Email" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input 
            label="Password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" isLoading={isLoading} className="login-btn mt-4 w-full py-2.5 font-[Caveat] text-2xl font-bold">
            Sign In
          </Button>

          {/* 5 One-Click Persona Test Buttons */}
          <div className="mt-6 pt-4 border-t border-border">
            <span className="text-xs font-sans text-muted block mb-2 font-semibold uppercase tracking-wider text-center">
              Quick Test Personas (Click to autofill)
            </span>
            <div className="flex flex-wrap gap-1.5 font-sans text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('admin@peoplepay360.com')}
                className="flex-1 min-w-[120px] py-1.5 px-2 rounded-lg border border-border bg-surface hover:bg-elevated text-text-primary transition-colors text-center font-medium cursor-pointer"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('hrmanager@peoplepay360.com')}
                className="flex-1 min-w-[120px] py-1.5 px-2 rounded-lg border border-border bg-surface hover:bg-elevated text-text-primary transition-colors text-center font-medium cursor-pointer"
              >
                🧑‍💼 HR Manager
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('payroll@peoplepay360.com')}
                className="flex-1 min-w-[120px] py-1.5 px-2 rounded-lg border border-border bg-surface hover:bg-elevated text-text-primary transition-colors text-center font-medium cursor-pointer"
              >
                💳 Payroll User
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('timeoff@peoplepay360.com')}
                className="flex-1 min-w-[120px] py-1.5 px-2 rounded-lg border border-border bg-surface hover:bg-elevated text-text-primary transition-colors text-center font-medium cursor-pointer"
              >
                🏖️ Time Off Admin
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('employee@peoplepay360.com')}
                className="flex-1 min-w-[120px] py-1.5 px-2 rounded-lg border border-border bg-surface hover:bg-elevated text-text-primary transition-colors text-center font-medium cursor-pointer"
              >
                👤 Employee
              </button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};
