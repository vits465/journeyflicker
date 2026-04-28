import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../lib/api';
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

  const fetchSettings = () => {
    api.getApiSettings()
      .then(data => {
        if (data) setApiKeys(data);
        setLoading(false);
      })
      .catch(err => {
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
        
        {/* Left Column: API Keys */}
        <div className="lg:col-span-2 space-y-6">
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
              API Health
            </h3>
            
            <div className="space-y-3">
              {[
                { name: 'Payment API', status: 'operational', ping: '42ms' },
                { name: 'Email API', status: 'operational', ping: '128ms' },
                { name: 'Maps API', status: 'operational', ping: '15ms' },
                { name: 'Storage API', status: 'degraded', ping: '450ms' },
              ].map(service => (
                <div key={service.name} className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">{service.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">{service.ping}</span>
                    <span className={`w-2 h-2 rounded-full ${service.status === 'operational' ? 'bg-green-500' : 'bg-yellow-500'}`} />
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
