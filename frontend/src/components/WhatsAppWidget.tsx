import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-dismiss the floating notification banner after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotification(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error("Please provide your name and phone number.");
      return;
    }

    setLoading(true);

    // Build the beautiful, structured pre-filled WhatsApp message
    const formattedText = `Hi JourneyFlicker Team! ✈️
My name is *${name}*
📞 Phone: ${phone}
🌍 Interested in: *${destination || "Custom Curation"}*

${message ? `💬 My special requests:\n"${message}"` : "I'd like to get an instant travel quote/itinerary!"}`;

    const encodedText = encodeURIComponent(formattedText);
    const whatsappUrl = `https://wa.me/919878268882?text=${encodedText}`;

    try {
      // Background CRM Capture: save lead details to the website's database!
      // Using a placeholder email so it passes standard Zod verification on the backend
      const leadEmail = `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}_wa@journeyflicker.com`;
      await api.createContact({
        name,
        email: leadEmail,
        type: "WhatsApp Lead",
        message: `[WhatsApp Floating Widget Capture]
📞 Phone: ${phone}
🌍 Destination: ${destination || "General/Custom Curation"}
💬 Custom Message: ${message || "No custom message provided."}`,
      });
      
      toast.success("Lead registered! Redirecting to WhatsApp...");
    } catch (err) {
      console.warn("Background CRM capture failed (ignoring to prevent user blockage):", err);
    } finally {
      setLoading(false);
      setIsOpen(false);
      // Open WhatsApp in a new tab
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[99999] font-sans flex flex-col items-end">
      {/* ── NOTIFICATION BUBBLE PROMPT ── */}
      {showNotification && !isOpen && (
        <div className="mb-3 mr-2 max-w-xs bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 text-zinc-800 dark:text-zinc-200 p-4 rounded-2xl shadow-2xl relative animate-reveal-up text-left flex items-start gap-3 backdrop-blur-md">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-sm font-semibold">chat</span>
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-tight">Need a custom quote?</h4>
            <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 mt-0.5">
              Chat with our curators instantly via WhatsApp!
            </p>
          </div>
          <button 
            onClick={() => setShowNotification(false)}
            className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
          <div className="absolute right-6 -bottom-1.5 w-3 h-3 bg-white dark:bg-zinc-900 border-r border-b border-neutral-200 dark:border-neutral-800 rotate-45" />
        </div>
      )}

      {/* ── CHAT PANEL CARD ── */}
      {isOpen && (
        <div className="mb-4 w-[350px] max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-neutral-900 rounded-3xl overflow-hidden shadow-2xl animate-reveal-up flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-zinc-900 p-5 text-white relative">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/20">
                  <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.197 1.45 4.817 1.451 5.536 0 10.04-4.5 10.044-10.038.002-2.684-1.04-5.207-2.93-7.099-1.89-1.89-4.411-2.932-7.098-2.933-5.54 0-10.046 4.502-10.05 10.039-.001 1.777.464 3.51 1.346 5.034L1.018 21.87l6.108-1.602c1.472.802 3.12 1.226 4.8 1.228z" />
                  </svg>
                </div>
                <div className="absolute right-0 bottom-0 w-3 h-3 rounded-full bg-green-400 border-2 border-emerald-600" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold tracking-tight">JourneyFlicker Bureau</h3>
                <p className="text-[10px] text-emerald-200/90 font-light flex items-center gap-1">
                  Online Travel Curators
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Chat Bubble Message */}
          <div className="flex-1 p-4 bg-zinc-50 dark:bg-zinc-900/50 overflow-y-auto max-h-[160px] text-left space-y-3">
            <div className="bg-white dark:bg-zinc-950 border border-neutral-200/50 dark:border-neutral-800 p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-light">
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1">JourneyFlicker Curation Bot</p>
              Hi there! 🌍 Welcome to JourneyFlicker. I'm your AI assistant. Tell me your travel plans so we can instantly design your dream itinerary!
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleStartChat} className="p-4 border-t border-neutral-200 dark:border-neutral-900 bg-white dark:bg-zinc-950 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Your Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Gaurang"
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs font-light bg-zinc-50 dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-zinc-800 dark:text-zinc-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Phone Number</label>
                <input 
                  type="tel" 
                  required
                  placeholder="e.g. +91 9988..."
                  value={phone} 
                  onChange={e => setPhone(e.target.value)}
                  className="w-full text-xs font-light bg-zinc-50 dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Target Destination</label>
              <input 
                type="text" 
                placeholder="e.g. Goa, Switzerland, Kashmir"
                value={destination} 
                onChange={e => setDestination(e.target.value)}
                className="w-full text-xs font-light bg-zinc-50 dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Custom Request (Optional)</label>
              <textarea 
                rows={2}
                placeholder="Hotel category, date of travel, budget constraint..."
                value={message} 
                onChange={e => setMessage(e.target.value)}
                className="w-full text-xs font-light bg-zinc-50 dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none text-zinc-800 dark:text-zinc-200"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-[9px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                  Syncing Lead...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.197 1.45 4.817 1.451 5.536 0 10.04-4.5 10.044-10.038.002-2.684-1.04-5.207-2.93-7.099-1.89-1.89-4.411-2.932-7.098-2.933-5.54 0-10.046 4.502-10.05 10.039-.001 1.777.464 3.51 1.346 5.034L1.018 21.87l6.108-1.602c1.472.802 3.12 1.226 4.8 1.228z" />
                  </svg>
                  Start WhatsApp Chat
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ── TOGGLE FLOAT BUTTON ── */}
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          setShowNotification(false);
        }}
        className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all hover:scale-105 duration-300 relative group cursor-pointer"
        aria-label="Chat via WhatsApp"
      >
        {/* Subtle glowing pulse */}
        <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-20 animate-ping group-hover:opacity-40" />

        {isOpen ? (
          <span className="material-symbols-outlined text-2xl font-light">close</span>
        ) : (
          <svg className="w-7 h-7 fill-white relative z-10" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.197 1.45 4.817 1.451 5.536 0 10.04-4.5 10.044-10.038.002-2.684-1.04-5.207-2.93-7.099-1.89-1.89-4.411-2.932-7.098-2.933-5.54 0-10.046 4.502-10.05 10.039-.001 1.777.464 3.51 1.346 5.034L1.018 21.87l6.108-1.602c1.472.802 3.12 1.226 4.8 1.228z" />
          </svg>
        )}

        {/* Small floating unread notification badge */}
        {!isOpen && showNotification && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 border border-white dark:border-zinc-950 text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-md select-none animate-bounce">
            1
          </span>
        )}
      </button>
    </div>
  );
}
