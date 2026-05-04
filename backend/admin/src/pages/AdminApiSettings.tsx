import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, type MigrationStatus } from '../lib/api';
import { Preloader } from '../components/Preloader';

export default function AdminApiSettings() {
  const { canEdit } = useOutletContext<{ canEdit: boolean }>();
  const [loading, setLoading] = useState(true);
  
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationLog, setMigrationLog] = useState<string[]>([]);

  const fetchSettings = () => {
    Promise.all([
      api.getSystemStatus().catch(() => null),
      api.getMigrationStatus().catch(() => null)
    ]).then(([statusData, migrationData]) => {
      if (statusData) setSystemStatus(statusData);
      if (migrationData) setMigrationStatus(migrationData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchSettings();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchSettings();
    }, 5000);

    const onFocus = () => { if (document.visibilityState === 'visible') fetchSettings(); };
    window.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const handleMigrate = async () => {
    if (!confirm('Are you sure you want to migrate data from KV to MongoDB? Existing MongoDB data will be skipped.')) return;
    setMigrating(true);
    setMigrationLog([]);
    try {
      const res = await api.runMigration();
      setMigrationLog(res.log);
      if (res.success) alert('Migration completed successfully!');
      fetchSettings();
    } catch (err: any) {
      console.error(err);
      alert('Migration failed: ' + (err.message || String(err)));
    } finally {
      setMigrating(false);
    }
  };

  if (loading) return <Preloader />;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-on-surface tracking-tight">System Integrations</h2>
        <p className="text-on-surface-variant text-sm mt-1">
          Live monitoring of database, cache, media CDN, and security configurations.
        </p>
      </div>

      {!canEdit && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined text-blue-500">info</span>
          <span className="text-sm">You are in read-only mode. Contact an administrator to modify settings.</span>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: DB Migration */}
        <div className="lg:col-span-2 space-y-6">

          {/* Database Migration Dashboard */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 shadow-sm overflow-hidden relative">
            {migrationStatus?.mongoConnected ? (
              <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-widest uppercase">
                MongoDB Connected
              </div>
            ) : (
              <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-widest uppercase animate-pulse">
                DB Connection Offline
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${migrationStatus?.mongoConnected ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                <span className="material-symbols-outlined">database</span>
              </div>
              <div>
                <h3 className="font-semibold text-on-surface">MongoDB Atlas</h3>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-on-surface-variant">Primary data storage (Mandatory)</p>
                  {migrationStatus?.mongoConnected && migrationStatus.dbName && (
                    <span className="text-[10px] bg-surface-container-low px-2 py-0.5 rounded-full font-mono text-on-surface-variant border border-outline-variant/30">
                      {migrationStatus.dbName}@{migrationStatus.dbHost}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { label: 'Destinations', count: migrationStatus?.counts?.destinations || 0 },
                  { label: 'Tours', count: migrationStatus?.counts?.tours || 0 },
                  { label: 'Visas', count: migrationStatus?.counts?.visas || 0 },
                  { label: 'Contacts', count: migrationStatus?.counts?.contacts || 0 },
                  { label: 'Media', count: migrationStatus?.counts?.media || 0 },
                  { label: 'Editors', count: migrationStatus?.counts?.coEditors || 0 },
                ].map(c => (
                  <div key={c.label} className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-on-surface">{c.count}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{c.label}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleMigrate}
                  disabled={!canEdit || migrating || !migrationStatus?.mongoConnected}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold tracking-widest uppercase hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {migrating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Migrating Data...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">move_up</span>
                      {migrationStatus?.mongoConnected ? 'Run KV to MongoDB Migration' : 'MongoDB Not Configured'}
                    </>
                  )}
                </button>
              </div>

              {migrationLog.length > 0 && (
                <div className="mt-4 p-4 bg-gray-900 rounded-xl font-mono text-xs text-green-400 h-40 overflow-y-auto space-y-1">
                  {migrationLog.map((log, i) => <div key={i}>{log}</div>)}
                </div>
              )}
            </div>
          </div>
          
          {/* Environment Variables Info */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 shadow-sm">
            <h3 className="font-semibold text-on-surface flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-gray-500">terminal</span>
              Environment Configuration
            </h3>
            <p className="text-sm text-on-surface-variant mb-4">
              To update your infrastructure connections, you must modify your deployment Environment Variables in Vercel. 
              The application connects to the following services automatically when valid keys are detected.
            </p>
            <div className="space-y-3 font-mono text-xs text-on-surface-variant bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20">
              <div className="flex flex-col gap-1"><strong className="text-blue-600">MongoDB:</strong> <span>MONGODB_URI, MONGODB_DB</span></div>
              <div className="flex flex-col gap-1"><strong className="text-red-500">Upstash Redis:</strong> <span>KV_REST_API_URL, KV_REST_API_TOKEN</span></div>
              <div className="flex flex-col gap-1"><strong className="text-orange-500">Cloudinary:</strong> <span>CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET</span></div>
              <div className="flex flex-col gap-1"><strong className="text-purple-600">Admin Auth:</strong> <span>ADMIN_USERNAME, ADMIN_PASSWORD</span></div>
            </div>
          </div>

        </div>

        {/* Right Column: API Health */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 shadow-sm">
            <h3 className="font-semibold text-on-surface flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-gray-500">monitor_heart</span>
              Live Service Status
            </h3>
            
            <div className="space-y-6">
              {[
                { 
                  name: 'MongoDB Primary', 
                  desc: 'Document storage engine',
                  status: systemStatus?.mongodb?.status || 'offline', 
                  meta: systemStatus?.mongodb?.dbName || 'Not configured',
                  icon: 'database', color: 'text-green-500'
                },
                { 
                  name: 'Upstash Redis', 
                  desc: 'Session cache & rate limiting',
                  status: systemStatus?.redis?.status || 'offline', 
                  meta: systemStatus?.redis?.connected ? 'Connected' : 'Missing credentials',
                  icon: 'memory', color: 'text-red-500'
                },
                { 
                  name: 'Cloudinary CDN', 
                  desc: 'Media delivery network',
                  status: systemStatus?.cloudinary?.status || 'offline', 
                  meta: systemStatus?.cloudinary?.cloudName || 'Missing credentials',
                  icon: 'cloud', color: 'text-orange-500'
                },
                { 
                  name: 'Admin Security', 
                  desc: 'Custom authentication',
                  status: systemStatus?.auth?.status || 'offline', 
                  meta: systemStatus?.auth?.secure ? 'Secured' : 'Insecure (Default PW)',
                  icon: 'security', color: 'text-purple-500'
                },
              ].map(service => (
                <div key={service.name} className="flex items-start justify-between border-b border-outline-variant/10 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <span className={`material-symbols-outlined mt-0.5 ${service.color}`}>
                      {service.icon}
                    </span>
                    <div>
                      <div className="font-semibold text-sm text-on-surface">{service.name}</div>
                      <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">{service.desc}</div>
                      <div className="text-xs font-mono text-on-surface-variant/70">{service.meta}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 mt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${service.status === 'operational' ? 'text-green-600' : service.status === 'warning' ? 'text-amber-600' : 'text-red-500'}`}>
                      {service.status}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${service.status === 'operational' ? 'bg-green-500' : service.status === 'warning' ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`} />
                  </div>
                </div>
              ))}
            </div>
            
            {systemStatus?.auth?.status === 'warning' && (
              <div className="mt-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-red-500 mt-0.5 text-lg">warning</span>
                <div className="text-xs">
                  <strong className="block mb-0.5">Critical Security Alert</strong>
                  You are using the default admin password. Set ADMIN_PASSWORD in Vercel to secure your panel.
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
