import { SEO } from '../components/SEO';

export default function PrivacyPolicyPage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <>
      <SEO 
        title="Privacy Charter & Protocols | JourneyFlicker" 
        description="The JourneyFlicker Privacy Charter: detailing our high-level identity encryption, secure data transmission, and traveler protection protocols."
      />

      {/* ── HERO ── */}
      <section className="relative h-[55vh] min-h-[360px] max-h-[560px] flex flex-col justify-end px-4 sm:px-8 md:px-16 overflow-hidden bg-black pb-10 sm:pb-14">
        <div className="absolute inset-0 z-0">
          <img 
            className="absolute inset-0 w-full h-full object-cover opacity-55 grayscale animate-image-pan"
            alt="Minimalist architectural arches" 
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 max-w-3xl animate-reveal-up">
          <span className="text-white/60 text-[10px] tracking-[0.5em] uppercase mb-3 block font-bold">Identity Protection</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tighter text-white">
            Privacy<br/><span className="italic font-serif text-white/90">Charter</span>
          </h1>
        </div>
      </section>

      {/* ── CONTENT ── */}
      <section className="py-14 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-surface-container-lowest dark:bg-black">
        <div className="max-w-4xl mx-auto">
          
          {/* Header Metadata */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline-variant/20 dark:border-white/10 pb-8 mb-12 gap-4">
            <div>
              <span className="text-primary text-[10px] font-bold tracking-[0.4em] uppercase block">Dossier Protocol: JF-PR-90</span>
              <p className="text-sm font-light text-on-surface-variant opacity-75 mt-1">Classification: Public Voyager Safeguard Documentation</p>
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
                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-primary block mb-2">01 / Data Inception</span>
                <h3 className="text-xl font-light tracking-tight font-serif italic text-black dark:text-white">Information We Capture</h3>
              </div>
              <div className="md:col-span-2 space-y-4 text-sm font-light leading-relaxed">
                <p>
                  To curate absolute travel experiences, we capture essential telemetry of your voyager profile. This includes your name, contact coordinates, visa prerequisites, physical accessibility specs, and booking specifications.
                </p>
                <p>
                  For integration features—such as social logins—we collect authorized profile attributes (such as your email and name) as permitted by the protocol configurations of third-party platforms (e.g., Meta/Facebook platform).
                </p>
              </div>
            </div>

            <hr className="border-outline-variant/20 dark:border-white/10" />

            {/* Sec 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 items-start">
              <div className="md:col-span-1">
                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-primary block mb-2">02 / Processing Protocols</span>
                <h3 className="text-xl font-light tracking-tight font-serif italic text-black dark:text-white">Our Curation Use Case</h3>
              </div>
              <div className="md:col-span-2 space-y-4 text-sm font-light leading-relaxed">
                <p>
                  Your information is structured inside our secure curator systems to orchestrate private visa strategies, secure luxury stays, and coordinate customized excursions.
                </p>
                <p>
                  We do not sell, trade, or distribute your identity archives to advertising cartels. Information is shared exclusively with airside transport teams, hoteliers, and embassy authorities necessary to validate your transit dossiers.
                </p>
              </div>
            </div>

            <hr className="border-outline-variant/20 dark:border-white/10" />

            {/* Sec 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 items-start">
              <div className="md:col-span-1">
                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-primary block mb-2">03 / Archive Protection</span>
                <h3 className="text-xl font-light tracking-tight font-serif italic text-black dark:text-white">Security Architecture</h3>
              </div>
              <div className="md:col-span-2 space-y-4 text-sm font-light leading-relaxed">
                <p>
                  All interactions with the JourneyFlicker interface are encrypted using high-grade SSL/TLS protocols. Client files are archived in secure databases utilizing industry-standard key encryption.
                </p>
                <p>
                  Access to voyager telemetry is isolated strictly to credentialed curators, ensuring absolute privacy of travel history and secure personal files.
                </p>
              </div>
            </div>

            <hr className="border-outline-variant/20 dark:border-white/10" />

            {/* Sec 4 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 items-start">
              <div className="md:col-span-1">
                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-primary block mb-2">04 / Voyager Prerogatives</span>
                <h3 className="text-xl font-light tracking-tight font-serif italic text-black dark:text-white">Rights & Consent</h3>
              </div>
              <div className="md:col-span-2 space-y-4 text-sm font-light leading-relaxed">
                <p>
                  As a citizen under legal protections (such as GDPR or CCPA), you retain the right to query, download, or permanently purge your personal record from our servers.
                </p>
                <p>
                  Third-party integrations, such as Facebook Login, permit domain application data to be purged at any time. Instructions to invoke this delete command are detailed inside our dedicated <a href="/data-deletion" className="text-primary hover:underline font-normal">Data Deletion Protocol</a> page.
                </p>
              </div>
            </div>

          </div>

          {/* Interactive Footer note */}
          <div className="mt-16 bg-surface dark:bg-white/[0.03] p-8 rounded-2xl border border-outline-variant/20 dark:border-white/10 text-center space-y-4">
            <span className="material-symbols-outlined text-3xl text-primary font-light">verified_user</span>
            <h4 className="text-lg font-light tracking-tight">Identity Assurance Guarantee</h4>
            <p className="text-xs font-light text-on-surface-variant opacity-75 max-w-lg mx-auto leading-relaxed">
              We pledge to honor user trust with the highest standard of data privacy. For any specific queries regarding our security parameters or to request audit reports, please contact our Data Security Curator at <a href="mailto:privacy@journeyflicker.com" className="text-primary hover:underline font-normal">privacy@journeyflicker.com</a>.
            </p>
          </div>

        </div>
      </section>
    </>
  );
}
