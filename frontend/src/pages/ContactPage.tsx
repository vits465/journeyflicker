import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../lib/api';

export default function ContactPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', type: 'Private Curation Strategy', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.createContact(form);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      // Still show success to user even if API fails
      setSubmitted(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative h-[55vh] min-h-[380px] max-h-[580px] flex flex-col justify-end px-4 sm:px-8 md:px-16 overflow-hidden bg-black pb-12 sm:pb-16">
        <div className="absolute inset-0 z-0">
          <img className="absolute inset-0 w-full h-full object-cover opacity-55 grayscale animate-image-pan"
            alt="Minimalist office" src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>
        <div className="relative z-10 max-w-3xl animate-reveal-up">
          <span className="text-white/60 text-[10px] tracking-[0.5em] uppercase mb-3 block font-bold">The Studio Bureau</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tighter text-white">
            Inquire<br/><span className="italic font-serif text-white/90">Strategy</span>
          </h1>
        </div>
      </section>

      {/* ── CONTACT LAYOUT ── */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-8 md:px-16 bg-surface-container-lowest">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-start">

          {/* Left: Info */}
          <div className="lg:col-span-2 space-y-8 animate-reveal-up">
            <div>
              <span className="text-primary text-[10px] font-bold tracking-[0.4em] uppercase mb-4 block">Direct Registry</span>
              <div className="space-y-5">
                <div className="group border-l-2 border-primary/10 pl-5 hover:border-primary transition-all duration-500">
                  <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-on-surface-variant mb-1.5 block">General Correspondence</span>
                  <a href="mailto:curator@journeyflicker.com"
                    className="text-lg font-light tracking-tight text-on-surface hover:text-primary transition-colors break-all">
                    curator@journeyflicker.com
                  </a>
                </div>
                <div className="group border-l-2 border-primary/10 pl-5 hover:border-primary transition-all duration-500">
                  <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-on-surface-variant mb-1.5 block">Priority Management</span>
                  <a href="tel:+15557829901" className="text-lg font-light tracking-tight text-on-surface hover:text-primary transition-colors">
                    +1 (555) 782-9901
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-primary text-[10px] font-bold tracking-[0.5em] uppercase mb-3 block">The Repository</span>
              <p className="text-sm font-light text-on-surface opacity-70 leading-relaxed">402 Silicon Drive, Suite 1200<br/>California, USA 94025</p>
              <div className="h-px bg-outline-variant/30 w-20 mt-5" />
            </div>

            <div className="pt-2 space-y-3">
              <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-on-surface-variant block">Quick Access</span>
              {[
                { label: 'Browse Destinations', path: '/destinations' },
                { label: 'Explore Tours', path: '/tours' },
                { label: 'Visa Intelligence', path: '/visas' },
              ].map(l => (
                <button key={l.path} onClick={() => navigate(l.path)}
                  className="flex items-center gap-2 text-sm font-light text-on-surface-variant hover:text-primary transition-colors group">
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-3 animate-reveal-up" style={{ animationDelay: '0.15s' }}>
            <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-sm border border-outline-variant/20">
              <span className="text-primary text-[10px] font-black tracking-[0.5em] uppercase mb-6 block">Inception Protocol</span>

              {submitted ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-5 bg-green-50 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  <h3 className="text-xl font-light mb-2 tracking-tighter">Transmission Authorized</h3>
                  <p className="text-sm text-on-surface-variant opacity-70 mb-6">Our curators will respond within 24 hours.</p>
                  <button onClick={() => setSubmitted(false)}
                    className="text-[9px] font-black tracking-[0.4em] uppercase border-b border-black pb-1 hover:text-primary transition-colors">
                    Send Another
                  </button>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold tracking-[0.4em] uppercase text-on-surface-variant block">Full Name</label>
                      <input type="text" placeholder="Full Name" required value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm font-light focus:ring-2 focus:ring-primary/20 outline-none placeholder:opacity-30" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold tracking-[0.4em] uppercase text-on-surface-variant block">Email</label>
                      <input type="email" placeholder="email@example.com" required value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm font-light focus:ring-2 focus:ring-primary/20 outline-none placeholder:opacity-30" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-bold tracking-[0.4em] uppercase text-on-surface-variant block">Objective Type</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm font-light focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer">
                      <option>Private Curation Strategy</option>
                      <option>Expedition Modification</option>
                      <option>Administrative Inquiry</option>
                      <option>Corporate Partnership</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-bold tracking-[0.4em] uppercase text-on-surface-variant block">Narrative Details</label>
                    <textarea rows={5} placeholder="Detailed expedition requirements..." value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm font-light focus:ring-2 focus:ring-primary/20 outline-none resize-none placeholder:opacity-30" />
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                    <p className="text-[9px] text-on-surface-variant tracking-[0.3em] font-bold uppercase max-w-[200px] leading-relaxed opacity-40">
                      Identity secured by curator protocols.
                    </p>
                    <button type="submit" disabled={sending}
                      className="bg-black text-white px-8 py-3 rounded-full text-[10px] font-black tracking-[0.4em] uppercase hover:bg-primary transition-all shadow-lg active:scale-95 w-full sm:w-auto disabled:opacity-60 flex items-center justify-center gap-2">
                      {sending ? (
                        <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span> Sending...</>
                      ) : 'Authorize Transmission'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-8 md:px-16 bg-black text-white text-center relative overflow-hidden border-t border-white/5">
        <div className="max-w-xl mx-auto animate-reveal-up relative z-10">
          <span className="text-white/40 text-[10px] tracking-[0.5em] uppercase mb-3 block font-bold">Priority Registry</span>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tighter mb-4 leading-tight">
            Ready for<br/><span className="italic font-serif text-white/90">Entry?</span>
          </h2>
          <p className="text-sm font-light text-white/40 mb-7 leading-relaxed italic">
            Our curators are standing by. Typical response within 24 hours.
          </p>
          <button className="bg-white text-black px-8 py-3 text-[10px] font-extrabold tracking-[0.5em] uppercase rounded-full hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Registry Incept
          </button>
        </div>
      </section>
    </>
  );
}
