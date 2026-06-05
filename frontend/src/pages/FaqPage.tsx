import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';

type Category = 'Booking & Payment' | 'Brochure Accuracy' | 'Hotel' | 'Flight';

const categories: { name: Category; icon: string }[] = [
  { name: 'Booking & Payment', icon: 'payments' },
  { name: 'Brochure Accuracy', icon: 'menu_book' },
  { name: 'Hotel', icon: 'hotel' },
  { name: 'Flight', icon: 'flight' },
];

const questions: Record<Category, { q: string; a: string }[]> = {
  'Booking & Payment': [
    { q: "How can I book a tour?", a: "You can book your tour online by sharing passport, PAN, and Aadhaar copies and making a digital payment. You may also visit our office for assistance." },
    { q: "When should I book my tour?", a: "We recommend booking at least 6–9 months before departure to secure availability and enjoy early booking benefits." },
    { q: "Why is the tour price shown in INR and foreign currency?", a: "Some expenses (flights, visas, documentation) are paid in INR, while hotels, sightseeing, and local services are paid in foreign currency." },
    { q: "When do I need to make payments?", a: "• Booking Amount: At the time of reservation\n• Second Payment: 75–90 days before departure or before visa processing\n• Final Payment: 45 days before departure" },
    { q: "What payment methods are accepted?", a: "• Bank Transfer\n• UPI\n• Cheque\n• Credit Card (Bank Charge Maybe Apply)\n• Debit Card (Bank Charge Maybe Apply)" },
    { q: "Is the booking amount refundable?", a: "Refunds are subject to JourneyFlicker’s cancellation policy. Cancellation charges may apply." },
    { q: "What documents are required?", a: "Valid Passport, PAN Card, and Aadhaar Card. Your passport must be valid for at least 6 months from the travel date." },
  ],
  'Brochure Accuracy': [
    { q: "How accurate is the brochure and itinerary information?", a: "All information provided in this brochure, itinerary, or on the JourneyFlicker website is based on details available at the time of publication. JourneyFlicker reserves the right to modify any information, services, or arrangements before or after a booking due to circumstances beyond our control.\n\nWhere possible, any known changes will be communicated to guests at the time of booking. If changes arise after departure, our Tour Manager or local representative will keep guests informed." },
    { q: "What happens in exceptional situations like hotel overbooking?", a: "In exceptional situations, such as hotel overbooking, operational requirements, or other unforeseen circumstances, JourneyFlicker may arrange accommodation in similar-category hotels or, where necessary, in a nearby city. Such changes will be made with the comfort and convenience of our guests in mind." },
  ],
  'Hotel': [
    { q: "What is the valid ID proof required?", a: "As per government regulations, all guests aged 18 years and above must carry a valid photo ID at the time of check-in. Accepted IDs include Passport, Driving License, Voter ID, or any government-approved identification document. Failure to provide a valid ID may result in denied check-in, for which JourneyFlicker will not be held responsible." },
    { q: "Is there an age requirement?", a: "The primary guest checking into the hotel must be at least 18 years of age. Children travelling with adults are welcome as per the hotel's child policy." },
    { q: "How long does booking confirmation take?", a: "For same-day check-ins, hotel confirmations may take approximately 4–8 working hours, subject to availability and hotel approval." },
    { q: "What category of accommodation is provided?", a: "JourneyFlicker carefully selects comfortable hotels for all tours. Hotels will be as mentioned in the itinerary or of a similar category and standard." },
    { q: "How is room allocation managed?", a: "• Rooms are generally provided on a double or twin-sharing basis.\n• Triple occupancy rooms may include an extra mattress, folding cot, or rollaway bed.\n• Bed configurations are subject to hotel availability.\n• Adjacent or connecting rooms cannot be guaranteed." },
    { q: "Who is responsible for personal belongings?", a: "Guests are solely responsible for their luggage and personal belongings. JourneyFlicker will not be liable for any loss, theft, or damage. Any damage caused to hotel property during the stay must be settled directly by the guest." },
    { q: "Are extra services included?", a: "Charges for extra beds, meals, room service, mini-bar, laundry, telephone calls, or any other services not specifically included in the booking will be payable directly to the hotel." },
    { q: "What are the check-in & check-out times?", a: "Standard hotel check-in time is usually 2:00 PM, and check-out time is 12:00 PM. Early check-in or late check-out requests are subject to hotel approval and may incur additional charges." },
    { q: "What does the room tariff include?", a: "The room tariff includes applicable taxes unless otherwise specified. Additional hotel services and personal expenses are not included and must be paid at check-out." },
    { q: "What is the accommodation policy?", a: "Hotels reserve the right to refuse accommodation if valid identification or required documents are not provided. Some hotels may also decline bookings from local residents. In such cases, JourneyFlicker shall not be responsible for denied check-ins or refunds." },
    { q: "What happens if I modify or cancel a booking?", a: "Any changes to a confirmed booking may attract modification or cancellation charges. All amendments are subject to hotel policies and room availability. In case of cancellation or modification, applicable cancellation charges will apply. Any promotional discount or special offer availed at the time of booking may be forfeited." },
  ],
  'Flight': [
    { q: "Are there any service fees or cancellation charges?", a: "• A JourneyFlicker service fee may be charged per passenger in addition to the applicable airline cancellation or rescheduling charges.\n• Airline cancellation and rescheduling charges displayed are indicative and subject to change based on airline policies, fare rules, and currency fluctuations. JourneyFlicker does not guarantee the accuracy of such information." },
    { q: "Will I be notified of schedule changes?", a: "JourneyFlicker is not responsible for notifying passengers of flight schedule changes, cancellations, airline updates, hotel changes, or any other modifications made by service providers." },
    { q: "When should I cancel or reschedule flights?", a: "We recommend cancelling or rescheduling your tickets at least 72 hours before the scheduled flight departure." },
  ],
};

export default function FaqPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<Category>('Booking & Payment');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqSchema = useMemo(() => {
    // Generate standard FAQPage schema dynamically from all categories
    const allQuestions: { q: string; a: string }[] = [];
    Object.keys(questions).forEach(cat => {
      const list = questions[cat as Category];
      if (Array.isArray(list)) {
        allQuestions.push(...list);
      }
    });

    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "@id": "https://journeyflicker.com/faq/#breadcrumb",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://journeyflicker.com"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "FAQ",
              "item": "https://journeyflicker.com/faq"
            }
          ]
        },
        {
          "@type": "FAQPage",
          "@id": "https://journeyflicker.com/faq/#faqpage",
          "mainEntity": allQuestions.map(faq => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.a
            }
          }))
        }
      ]
    };
  }, []);

  return (
    <>
      <SEO 
        pageId="faq"
        title="Assistance & Support Department & FAQs | JourneyFlicker"
        description="Find answers to frequently asked questions about luxury heritage expeditions, custom travel curation logistics, and digital identity protection protocol."
        schema={faqSchema}
      />
      {/* ── HERO ── */}
      <section className="relative h-[55vh] min-h-[360px] max-h-[560px] flex flex-col justify-end px-4 sm:px-8 md:px-16 overflow-hidden bg-black pb-10 sm:pb-14">
        <div className="absolute inset-0 z-0">
          <img className="absolute inset-0 w-full h-full object-cover opacity-55 grayscale animate-image-pan"
            alt="Travel planning archive" src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2070&auto=format&fit=crop" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 w-full max-w-5xl mx-auto animate-reveal-up">
          <span className="text-white/60 text-[10px] tracking-[0.5em] uppercase mb-3 block font-bold">Support</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tighter text-white">
            Assistance &amp;<br/><span className="italic font-serif text-white/90">Support Department</span>
          </h1>
        </div>
      </section>

      {/* ── CATEGORY TABS ── */}
      <section className="py-4 bg-white border-b border-outline-variant/10 px-4 sm:px-8 sticky top-16 z-20 backdrop-blur">
        <div className="max-w-5xl mx-auto flex justify-center gap-4 sm:gap-8 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button key={cat.name}
              onClick={() => { setActiveCategory(cat.name); setOpenIndex(null); }}
              className={`flex flex-col items-center gap-2 py-2 group transition-all duration-300 min-w-[64px] ${activeCategory === cat.name ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${activeCategory === cat.name ? 'bg-black text-white border-black shadow-lg' : 'bg-surface-container border-outline-variant/30'}`}>
                <span className="material-symbols-outlined text-lg font-light">{cat.icon}</span>
              </div>
              <span className={`text-[9px] font-black tracking-[0.3em] uppercase whitespace-nowrap ${activeCategory === cat.name ? 'text-black' : 'text-on-surface-variant'}`}>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── FAQ LIST ── */}
      <section className="py-10 sm:py-14 md:py-20 px-4 sm:px-8 md:px-16 bg-surface-container-lowest">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-7 animate-reveal-up">
            <span className="text-primary text-[10px] font-bold tracking-[0.4em] uppercase block italic">{activeCategory} Dossier</span>
            <div className="h-px bg-primary/20 w-20 mx-auto mt-3" />
          </div>

          <div className="space-y-3 animate-reveal-up">
            {questions[activeCategory].map((faq, i) => (
              <div key={`${activeCategory}-${i}`}
                className={`rounded-2xl border overflow-hidden transition-all duration-300 ${openIndex === i ? 'bg-white shadow-lg border-primary/20' : 'bg-surface-container-low/50 border-outline-variant/5 hover:bg-surface-container-low hover:shadow-sm'}`}>
                <button className="w-full px-5 py-4 sm:py-5 flex justify-between items-center text-left gap-4 outline-none"
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                  <h3 className={`text-base sm:text-lg font-light tracking-tight leading-snug max-w-xl transition-colors duration-300 ${openIndex === i ? 'text-black' : 'text-on-surface/70'}`}>
                    {faq.q}
                  </h3>
                  <div className={`w-8 h-8 rounded-full border border-black/10 flex items-center justify-center shrink-0 transition-all duration-300 ${openIndex === i ? 'rotate-45 bg-black text-white border-black' : 'hover:scale-110'}`}>
                    <span className="material-symbols-outlined text-lg font-light">add</span>
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-out ${openIndex === i ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-5 pb-5">
                    <div className="h-px bg-primary/10 w-24 mb-3" />
                    <p className="text-sm font-light text-on-surface-variant leading-relaxed opacity-80 max-w-2xl whitespace-pre-wrap">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-8 md:px-16 bg-black text-white text-center relative overflow-hidden border-t border-white/5">
        <div className="max-w-xl mx-auto animate-reveal-up relative z-10">
          <span className="text-white/40 text-[10px] tracking-[0.4em] uppercase mb-3 block font-bold">Still Undocumented?</span>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tighter mb-4 leading-tight">
            Get In Touch With<br/><span className="italic font-serif text-white/90">JourneyFlicker</span>
          </h2>
          <p className="text-sm font-light text-white/40 mb-7 leading-relaxed italic">
            For specific intelligence queries or complex itinerary requirements, our senior curators offer private digital audits.
          </p>
          <button className="bg-white text-black px-8 py-3 text-[10px] font-extrabold tracking-[0.5em] uppercase rounded-full hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95"
            onClick={() => navigate('/contact')}>
            Registry Incept
          </button>
        </div>
      </section>
    </>
  );
}
