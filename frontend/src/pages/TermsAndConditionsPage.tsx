import { SEO } from '../components/SEO';

export default function TermsAndConditionsPage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <>
      <SEO 
        title="Curator Agreement & Terms | JourneyFlicker" 
        description="The JourneyFlicker Curator Agreement: defining legal terms, reservation rules, territorial guidelines, and cancellation policies."
      />

      {/* ── HERO ── */}
      <section className="relative h-[55vh] min-h-[360px] max-h-[560px] flex flex-col justify-end px-4 sm:px-8 md:px-16 overflow-hidden bg-black pb-10 sm:pb-14">
        <div className="absolute inset-0 z-0">
          <img 
            className="absolute inset-0 w-full h-full object-cover opacity-55 grayscale animate-image-pan"
            alt="Classy modern building with pillars" 
            src="https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 max-w-3xl animate-reveal-up">
          <span className="text-white/60 text-[10px] tracking-[0.5em] uppercase mb-3 block font-bold">Voyager Protocols</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tighter text-white">
            Curator<br/><span className="italic font-serif text-white/90">Agreement</span>
          </h1>
        </div>
      </section>

      {/* ── CONTENT ── */}
      <section className="py-14 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-surface-container-lowest dark:bg-black">
        <div className="max-w-4xl mx-auto">
          
          {/* Header Metadata */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline-variant/20 dark:border-white/10 pb-8 mb-12 gap-4">
            <div>
              <span className="text-primary text-[10px] font-bold tracking-[0.4em] uppercase block">Agreement Code: JF-TS-88</span>
              <p className="text-sm font-light text-on-surface-variant opacity-75 mt-1">Classification: Mandatory Induction Terms & Conditions</p>
            </div>
            <div className="bg-surface dark:bg-white/[0.03] px-4 py-2 rounded-full border border-outline-variant/30 text-[10px] font-bold tracking-[0.2em] uppercase text-on-surface-variant">
              Last Verified: {lastUpdated}
            </div>
          </div>

          {/* Narrative Body */}
          <div className="space-y-12 font-sans text-on-surface dark:text-white/80">
            
            {/* Sec 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 items-start">
              <div className="md:col-span-1">
                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-primary block mb-2">01 / Agreement Scope</span>
                <h3 className="text-xl font-light tracking-tight font-serif italic text-black dark:text-white">Induction Framework</h3>
              </div>
              <div className="md:col-span-2 space-y-4 text-sm font-light leading-relaxed">
                <p>
                  By accessing this website, registering inside the JourneyFlicker database, or booking travel itineraries, you enter into a legally binding contract with the JourneyFlicker Curator Syndicate.
                </p>
                <p>
                  If you disagree with any segment of these parameters, you must cease all exploration of our systems and terminate any ongoing travel design processes.
                </p>
              </div>
            </div>

            <hr className="border-outline-variant/20 dark:border-white/10" />

            {/* Sec 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 items-start">
              <div className="md:col-span-1">
                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-primary block mb-2">02 / Booking Systems</span>
                <h3 className="text-xl font-light tracking-tight font-serif italic text-black dark:text-white">Reservation & Escrow</h3>
              </div>
              <div className="md:col-span-2 space-y-4 text-sm font-light leading-relaxed">
                <p>
                  Expedition booking operations are confirmed only upon receipt of cleared booking deposits and the compilation of authorized identity dossiers (such as passport copies and visa preferences).
                </p>
                <p>
                  Rates stated for curated journeys represent private, sequestered travel logistics and remain subject to fluctuations per global transportation adjustments or foreign currency alterations up to the date of departure validation.
                </p>
              </div>
            </div>

            <hr className="border-outline-variant/20 dark:border-white/10" />

            {/* Sec 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 items-start">
              <div className="md:col-span-1">
                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-primary block mb-2">03 / Cancellation Protocols</span>
                <h3 className="text-xl font-light tracking-tight font-serif italic text-black dark:text-white">Refunding & Purging</h3>
              </div>
              <div className="md:col-span-2 space-y-4 text-sm font-light leading-relaxed">
                <p>
                  Since many of our luxury travel assets represent non-refundable, sequestered slots (such as luxury rail charters, regional flights, and boutique access approvals), cancellations are strictly subject to standard refund tiers.
                </p>
                <p>
                  No-shows or cancellations initiated within 14 days of departure warrant 100% forfeiture of booking reserves. Safe cancellation and partial recoveries are detailed in your specific expedition handbook supplied at curation induction.
                </p>
              </div>
            </div>

            <hr className="border-outline-variant/20 dark:border-white/10" />

            {/* Sec 4 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 items-start">
              <div className="md:col-span-1">
                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-primary block mb-2">04 / Liability & Limits</span>
                <h3 className="text-xl font-light tracking-tight font-serif italic text-black dark:text-white">Logistical Force Majeure</h3>
              </div>
              <div className="md:col-span-2 space-y-4 text-sm font-light leading-relaxed">
                <p>
                  JourneyFlicker acts exclusively as an orchestration manager for independent service providers (including private aircraft, luxury boutique villas, local guides, and regional transport bureaus).
                </p>
                <p>
                  We decline liability for disruptions arising from weather anomalies, strike action, civil unrest, global health alerts, or regional governmental shifts. Full medical, cancellation, and extraction insurance is mandatory for all registered voyagers.
                </p>
              </div>
            </div>

            <hr className="border-outline-variant/20 dark:border-white/10" />

            {/* Sec 5 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 items-start">
              <div className="md:col-span-1">
                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-primary block mb-2">05 / Accreditations</span>
                <h3 className="text-xl font-light tracking-tight font-serif italic text-black dark:text-white">Trust Frameworks</h3>
              </div>
              <div className="md:col-span-2 space-y-4 text-sm font-light leading-relaxed">
                <p>
                  JourneyFlicker operates in collaboration with certified global networks. Stated accreditations (including IATA, ASTA memberships, and ATOL protections) are governed by respective authority protocols and are maintained to guarantee international travel quality standards.
                </p>
                <p>
                  Flight tickets and package travels are protected and booked strictly in compliance with civil aviation policies and the rules of the operating transport carriers.
                </p>
              </div>
            </div>

            <hr className="border-outline-variant/20 dark:border-white/10" />

            {/* Sec 6 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 items-start">
              <div className="md:col-span-1">
                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-primary block mb-2">06 / Governing Law</span>
                <h3 className="text-xl font-light tracking-tight font-serif italic text-black dark:text-white">Jurisdiction limits</h3>
              </div>
              <div className="md:col-span-2 space-y-4 text-sm font-light leading-relaxed">
                <p>
                  This Curator Agreement, along with all booking negotiations, and curated services provided by JourneyFlicker, are governed by and interpreted under the laws of the Republic of India.
                </p>
                <p>
                  Any legal claims, disputes, or actions arising from our digital platform or travel contracts will be subject to the exclusive jurisdiction of the competent courts in Surat, Gujarat, India.
                </p>
              </div>
            </div>

          </div>

          {/* Interactive Info Banner */}
          <div className="mt-16 bg-surface dark:bg-white/[0.03] p-8 rounded-2xl border border-outline-variant/20 dark:border-white/10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left justify-between">
            <div className="space-y-2 max-w-lg">
              <h4 className="text-lg font-light tracking-tight">Need a Copy of the Ledger?</h4>
              <p className="text-xs font-light text-on-surface-variant opacity-75 leading-relaxed">
                You can download your curation specifications or request a signed physical copy of the Master Travel Agreement by contacting our legal desk directly.
              </p>
            </div>
            <a 
              href="mailto:legal@journeyflicker.com" 
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-primary dark:hover:bg-primary dark:hover:text-white text-[10px] font-black tracking-[0.3em] uppercase px-6 py-3 rounded-full transition-all shrink-0 active:scale-95 shadow-sm"
            >
              Contact Legal Bureau
            </a>
          </div>

        </div>
      </section>
    </>
  );
}
