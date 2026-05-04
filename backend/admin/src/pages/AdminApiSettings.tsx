import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, type MigrationStatus } from '../lib/api';
import { Preloader } from '../components/Preloader';

export default function AdminApiSettings() {
  const { canEdit } = useOutletContext<{ canEdit: boolean }>();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [apiKeys, setApiKeys] = useState({
    stripeSecret: '',
    stripePublic: '',
    sendgridKey: '',
    googleMapsKey: '',
    awsAccessKey: '',
  });

  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationLog, setMigrationLog] = useState<string[]>([]);

  type ApiKeys = { stripeSecret: string; stripePublic: string; sendgridKey: string; googleMapsKey: string; awsAccessKey: string };
  const fetchSettings = () => {
    Promise.all([
      api.getApiSettings().catch(() => null),
      api.getMigrationStatus().catch(() => null)
    ]).then(([apiData, migrationData]) => {
      if (apiData) setApiKeys(apiData as ApiKeys);
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

  const [webhooks, _setWebhooks] = useState([
    { id: 1, name: 'Stripe Payments', url: 'https://api.journeyflicker.com/webhooks/stripe', status: 'active', lastTriggered: '10 mins ago' },
    { id: 2, name: 'SendGrid Bounces', url: 'https://api.journeyflicker.com/webhooks/email', status: 'active', lastTriggered: '2 hours ago' },
  ]);

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      await api.updateApiSettings(apiKeys);
      alert('API settings saved successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyChange = (key: string, value: string) => {
    if (!canEdit) return;
    setApiKeys(prev => ({ ...prev, [key]: value }));
  };

  const handleMigrate = async () => {
    if (!confirm('Are you sure you want to migrate data from KV to MongoDB? Existing MongoDB data will be skipped.')) return;
    setMigrating(true);
    setMigrationLog([]);
    try {
      const res = await api.runMigration();
      setMigrationLog(res.log);
      if (res.success) alert('Migration completed successfully!');
      fetchSettings(); // Refresh counts
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
        <h2 className="text-2xl font-semibold text-on-surface tracking-tight">API Management</h2>
        <p className="text-on-surface-variant text-sm mt-1">
          Manage system integrations, third-party API keys, and webhook endpoints.
        </p>
      </div>

      {!canEdit && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined text-blue-500">info</span>
          <span className="text-sm">You are in read-only mode. Contact an administrator to modify API settings.</span>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: API Keys & DB Migration */}
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
                <h3 className="font-semibold text-on-surface">Database Engine</h3>
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

          {/* Payment Gateway */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <div>
                <h3 className="font-semibold text-on-surface">Payment Gateway</h3>
                <p className="text-xs text-on-surface-variant">Stripe integration for booking processing</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Publishable Key</label>
                <input
                  type="text"
                  value={apiKeys.stripePublic}
                  onChange={(e) => handleKeyChange('stripePublic', e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-sm focus:ring-2 focus:ring-black focus:outline-none disabled:opacity-50 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Secret Key</label>
                <input
                  type="password"
                  value={apiKeys.stripeSecret}
                  onChange={(e) => handleKeyChange('stripeSecret', e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-sm focus:ring-2 focus:ring-black focus:outline-none disabled:opacity-50 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Email Services */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined">mail</span>
              </div>
              <div>
                <h3 className="font-semibold text-on-surface">Email Delivery</h3>
                <p className="text-xs text-on-surface-variant">SendGrid API for transactional emails</p>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">API Key</label>
              <input
                type="password"
                value={apiKeys.sendgridKey}
                onChange={(e) => handleKeyChange('sendgridKey', e.target.value)}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-sm focus:ring-2 focus:ring-black focus:outline-none disabled:opacity-50 font-mono"
              />
            </div>
          </div>

          {/* Maps & Infrastructure */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <span className="material-symbols-outlined">map</span>
              </div>
              <div>
                <h3 className="font-semibold text-on-surface">Maps & Infrastructure</h3>
                <p className="text-xs text-on-surface-variant">Google Maps and AWS S3 Storage</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Google Maps API Key</label>
                <input
                  type="password"
                  value={apiKeys.googleMapsKey}
                  onChange={(e) => handleKeyChange('googleMapsKey', e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-sm focus:ring-2 focus:ring-black focus:outline-none disabled:opacity-50 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">AWS Access Key</label>
                <input
                  type="password"
                  value={apiKeys.awsAccessKey}
                  onChange={(e) => handleKeyChange('awsAccessKey', e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-sm focus:ring-2 focus:ring-black focus:outline-none disabled:opacity-50 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Webhooks & System Status */}
        <div className="space-y-6">
          
          {/* Actions */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 shadow-sm flex flex-col gap-3">
            <button
              onClick={handleSave}
              disabled={!canEdit || saving}
              className="w-full bg-black text-white px-6 py-3 rounded-xl text-sm font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">save</span>
                  Save Configuration
                </>
              )}
            </button>
            <button
              disabled={!canEdit}
              className="w-full bg-white text-black border border-outline-variant/30 px-6 py-3 rounded-xl text-sm font-bold tracking-widest uppercase hover:bg-surface-container-low transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">sync</span>
              Test Connections
            </button>
          </div>

          {/* Webhooks */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-500">webhook</span>
                Webhooks
              </h3>
              {canEdit && (
                <button className="text-black hover:bg-surface-container-low p-1.5 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {webhooks.map(hook => (
                <div key={hook.id} className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-on-surface">{hook.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${hook.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {hook.status}
                    </span>
                  </div>
                  <div className="text-xs text-on-surface-variant font-mono truncate mb-2">{hook.url}</div>
                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant/70 uppercase font-bold">
                    <span>Last triggered:</span>
                    <span>{hook.lastTriggered}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Health */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 shadow-sm">
            <h3 className="font-semibold text-on-surface flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-gray-500">monitor_heart</span>
              System Status
            </h3>
            
            <div className="space-y-3">
              {[
                { 
                  name: 'Database Engine', 
                  status: migrationStatus?.mongoConnected ? 'operational' : 'error', 
                  ping: migrationStatus?.mongoConnected ? 'MongoDB' : 'Offline',
                  icon: 'database'
                },
                { 
                  name: 'Payment Gateway', 
                  status: apiKeys.stripeSecret ? 'operational' : 'offline', 
                  ping: 'Stripe',
                  icon: 'payments'
                },
                { 
                  name: 'Email Delivery', 
                  status: apiKeys.sendgridKey ? 'operational' : 'offline', 
                  ping: 'SendGrid',
                  icon: 'mail'
                },
                { 
                  name: 'Maps & Location', 
                  status: apiKeys.googleMapsKey ? 'operational' : 'offline', 
                  ping: 'Google',
                  icon: 'map'
                },
                { 
                  name: 'Storage Service', 
                  status: apiKeys.awsAccessKey ? 'operational' : 'offline', 
                  ping: 'AWS S3',
                  icon: 'cloud'
                },
              ].map(service => (
                <div key={service.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[16px] ${service.status === 'operational' ? 'text-green-500' : service.status === 'warning' ? 'text-amber-500' : 'text-gray-400'}`}>
                      {service.icon}
                    </span>
                    <span className="text-on-surface-variant">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${service.status === 'operational' ? 'text-green-600' : service.status === 'warning' ? 'text-amber-600' : 'text-gray-400'}`}>
                      {service.ping}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${service.status === 'operational' ? 'bg-green-500' : service.status === 'warning' ? 'bg-amber-500' : 'bg-gray-300'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
