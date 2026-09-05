import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { login } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import './LoginPage.css';

export const LoginPage = () => {
  const [email, setEmail] = useState('superadmin@company.com');
  const [password, setPassword] = useState('admin');
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
      
      const isAdmin = data.user.roles?.includes('Admin');
      if (isAdmin) {
        navigate('/users', { replace: true });
      } else {
        navigate('/employees', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-layout">
      <Card className="login-card">
        <div className="login-header">
          <h2>HR Portal</h2>
          <p>Welcome back</p>
        </div>

        {error && <div className="login-error">{error}</div>}

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
          
          <div className="flex gap-2 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 text-xs py-1 h-8"
              onClick={() => { setEmail('superadmin@company.com'); setPassword('admin'); }}
            >
              Fill SuperAdmin
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 text-xs py-1 h-8"
              onClick={() => { setEmail('employee@company.com'); setPassword('password'); }}
            >
              Fill Employee
            </Button>
          </div>

          <Button type="submit" isLoading={isLoading} className="login-btn mt-4">
            Sign In
          </Button>
        </form>
      </Card>
    </div>
  );
};
