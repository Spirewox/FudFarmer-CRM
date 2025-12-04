
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../services/storageService';
import { Agent } from '../types';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAgents(StorageService.getAgents());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!selectedAgentId) {
        setError('Please select a user account.');
        setLoading(false);
        return;
      }

      const success = await login(selectedAgentId, password);
      if (!success) {
        setError('Invalid password. Try "password".');
      }
    } catch (err) {
      setError('Failed to log in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl border shadow-lg animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center space-y-2">
           <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-2">
              <ShieldCheck size={32} />
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome Back</h1>
           <p className="text-muted-foreground">Sign in to FudFarmer CRM</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Select Account</label>
                <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={selectedAgentId}
                        onChange={(e) => setSelectedAgentId(e.target.value)}
                    >
                        <option value="" disabled>Choose your profile</option>
                        {agents.map(agent => (
                            <option key={agent.id} value={agent.id}>
                                {agent.name} ({agent.role})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                        type="password"
                        placeholder="Enter password"
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <p className="text-[10px] text-muted-foreground text-right">Default password is 'password'</p>
            </div>

            {error && (
                <div className="text-sm text-red-500 font-medium bg-red-50 p-2 rounded-md border border-red-100 text-center">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2"
            >
                {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={16} className="ml-2" />
            </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
