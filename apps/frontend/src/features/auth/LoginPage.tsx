import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { login } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Lock, ArrowRight } from 'lucide-react';
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
    <div className="login-layout">
      {/* Top right theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 shadow-md">
            P
          </div>
          <h1 className="font-heading text-2xl font-bold text-text-primary m-0">
            PeoplePay<span className="text-primary">360</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Enterprise Workforce & Payroll Management Platform
          </p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <Input 
            label="Work Email" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@peoplepay360.com"
            required
          />
          <Input 
            label="Password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
            <span>Sign In to Workspace</span>
            <ArrowRight size={15} />
          </Button>

          {/* Persona Quick-Launchers */}
          <div className="mt-5 pt-4 border-t border-border">
            <span className="text-[11px] text-text-muted block mb-2 font-semibold uppercase tracking-wider text-center">
              Quick Test Personas
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('admin@peoplepay360.com')}
                className="py-1.5 px-2 rounded-lg border border-border bg-surface hover:bg-elevated text-text-primary transition-colors text-center font-medium cursor-pointer"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('hrmanager@peoplepay360.com')}
                className="py-1.5 px-2 rounded-lg border border-border bg-surface hover:bg-elevated text-text-primary transition-colors text-center font-medium cursor-pointer"
              >
                🧑‍💼 HR Manager
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('payroll@peoplepay360.com')}
                className="py-1.5 px-2 rounded-lg border border-border bg-surface hover:bg-elevated text-text-primary transition-colors text-center font-medium cursor-pointer"
              >
                💳 Payroll User
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('timeoff@peoplepay360.com')}
                className="py-1.5 px-2 rounded-lg border border-border bg-surface hover:bg-elevated text-text-primary transition-colors text-center font-medium cursor-pointer"
              >
                🏖️ Time Off Admin
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('employee@peoplepay360.com')}
                className="py-1.5 px-2 rounded-lg border border-border bg-surface hover:bg-elevated text-text-primary transition-colors text-center font-medium cursor-pointer col-span-2 sm:col-span-1"
              >
                👤 Employee
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
