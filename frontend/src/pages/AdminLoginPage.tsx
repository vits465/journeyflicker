import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../lib/adminAuth';

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500)); // brief UX delay
    const ok = login(username.trim(), password);
    setLoading(false);
    if (ok) {
      navigate('/admin');
    } else {
      setError('Invalid username or password. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/3 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/" className="inline-block">
            <span className="text-white text-2xl font-light tracking-tighter uppercase">
              Journey<span className="font-black">Flicker</span>
            </span>
          </a>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-white/30 text-sm">admin_panel_settings</span>
            <span className="text-[10px] text-white/30 font-black tracking-[0.4em] uppercase">Admin Portal</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-white text-xl font-light tracking-tight mb-1">Welcome back</h1>
          <p className="text-white/40 text-xs mb-7 font-light">Sign in to access the control panel</p>

          {/* Role hints */}
          <div className="mb-6 space-y-2">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="material-symbols-outlined text-blue-400 text-base">visibility</span>
              <div>
                <p className="text-white text-xs font-semibold">Viewer Access</p>
                <p className="text-white/40 text-[10px]">Dashboard & analytics only · <code className="text-white/60">viewer / view123</code></p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black tracking-[0.3em] uppercase text-white/50 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/10 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40 transition-colors"
                placeholder="Enter username"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black tracking-[0.3em] uppercase text-white/50 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-white/40 transition-colors"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  <span className="material-symbols-outlined text-lg">{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <span className="material-symbols-outlined text-red-400 text-sm">error</span>
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white text-black text-sm font-bold tracking-wide hover:bg-white/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  Authenticating…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">lock_open</span>
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-[10px] mt-6">
          JourneyFlicker Admin · Secure Portal
        </p>
      </div>
    </div>
  );
}
