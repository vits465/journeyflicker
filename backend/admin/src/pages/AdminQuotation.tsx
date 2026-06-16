import { useState, useEffect } from 'react';
import type { Tour } from '../lib/api';
import { api } from '../lib/api';

// Interfaces for Quotation Structure
interface HotelRow {
  destination: string;
  hotels: string;
  mealPlan: string;
  nights: string;
  rooms: string;
}

interface FlightCost {
  city: string;
  cost: string;
}

interface ItineraryDay {
  day: string;
  title: string;
  description: string;
  imageUrl?: string;
}

interface QuotationData {
  title: string;
  heroImageUrl?: string;
  quotationDate: string;
  travelingDate: string;
  destination: string;
  clientName: string;
  greetingText: string;
  messageText: string;
  optionTitle: string;
  hotels: HotelRow[];
  perPersonCost: string;
  flightCosts: FlightCost[];
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  documentsRequired: string[];
  cancellationPolicy: string[];
  importantInfo: string[];
  visualArchive: string[];
}

const emptyQuotation: QuotationData = {
  title: 'NORTH EAST TOUR',
  heroImageUrl: 'https://images.unsplash.com/photo-1544016768-982d1554f0b9?q=80&w=1200&auto=format&fit=crop',
  quotationDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/ /g, '-'),
  travelingDate: '',
  destination: '',
  clientName: 'Dear Sir,',
  greetingText: 'Greeting From JourneyFlicker..!!',
  messageText: 'kindly check below detail of your Tour !!!',
  optionTitle: 'Option : 01(3*) 08 Night 09 Days',
  hotels: [
    { destination: '', hotels: '', mealPlan: 'Breakfast & Dinner', nights: '02 Nights', rooms: '05' }
  ],
  perPersonCost: 'Package Cost Adults Rs.0/-',
  flightCosts: [],
  itinerary: [
    { day: 'Day 1', title: '', description: '' }
  ],
  inclusions: [],
  exclusions: [],
  documentsRequired: [],
  cancellationPolicy: [],
  importantInfo: [],
  visualArchive: []
};

// Preset sample from Hitesh's North East Tour
const hiteshPreset: QuotationData = {
  title: 'NORTH EAST TOUR',
  heroImageUrl: 'https://images.unsplash.com/photo-1544016768-982d1554f0b9?q=80&w=1200&auto=format&fit=crop',
  quotationDate: '09-JUN-2026',
  travelingDate: '11-NOV-2026',
  destination: 'NORTH INDIA',
  clientName: 'Dear Sir,',
  greetingText: 'Greeting From JourneyFlicker..!!',
  messageText: 'kindly check below detail of your NORTH INDIA Tour !!!',
  optionTitle: 'Option : 01(3*) 08 Night 09 Days',
  hotels: [
    { destination: 'Gangtok', hotels: 'Sinkham Grand/ Hungry Jack/ Similar', mealPlan: 'Breakfast & Dinner', nights: '02 Nights', rooms: '05' },
    { destination: 'Lachung', hotels: "The 'Elite Zone/ Lachug Deezong/ Lachung Heritage / Similar", mealPlan: 'Breakfast & Dinner', nights: '02 Nights', rooms: '05' },
    { destination: 'Gangtok', hotels: 'Sinkham Grand/ Hungry Jack/ Similar', mealPlan: 'Breakfast & Dinner', nights: '01 Nights', rooms: '05' },
    { destination: 'Pelling', hotels: 'Pelling Resort/ Crasula Ovata / Similar', mealPlan: 'Breakfast & Dinner', nights: '01 Nights', rooms: '05' },
    { destination: 'Darjeeling', hotels: 'Zambala/ Mount Conifer/ Similar', mealPlan: 'Breakfast & Dinner', nights: '02 Nights', rooms: '05' }
  ],
  perPersonCost: 'Package Cost Adults Rs.36,600/-X15',
  flightCosts: [
    { city: 'Ex.Mumbai', cost: '22,700/-Per Person' },
    { city: 'Ex. Ahmedabad', cost: '20,000/- Per Person' }
  ],
  itinerary: [
    {
      day: 'Day 1 (11/Nov/2026)',
      title: 'NJP RLY STATION/ IXB AIRPORT – GANGTOK (125KMS/ 6HRS)',
      description: 'Upon arrival at New Jalpaiguri Railway Station / Bagdogra Airport meet & greet, then transfer to Gangtok (5,480 ft.).(The capital of the state of Sikkim, Gangtok is an attractive tourist destination, reflecting a unique ambience which derives from its happy blend of tradition and modernity. Alongside the deeply felt presence of stupas and monasteries, Gangtok also bustles like any other thriving town). Check-in to hotel & enjoy rest of the day at leisure. Shop around at M.G. Marg & explore the city on your own. Enjoy overnight stay in Gangtok.'
    },
    {
      day: 'Day 2 (12/Nov/2026)',
      title: 'GANGTOK - TSOMGO LAKE & BABA MANDIR – GANGTOK (55 KMS ONE WAY)',
      description: 'After a delicious breakfast at hotel visit Tsomgo Lake (12,400 ft.) & Baba Mandir (13,200 ft.) which is 55 kms one way from Gangtok city. Enjoy the evening at leisure. Shop around at M.G. Marg & explore the city on your own. Enjoy overnight stay in Gangtok. VISIT TO NATHULA PASS (14450FT) NOT INCLUDED: The road to Nathula passes through the Tsomgo lake. It is one of the highest motorable roads in the world and is richly surrounded by alpine flora. On a clear day you can even see the road winding down the Chumbi valley. Tourists are allowed to go close to the international border from where you can see Chinese soldiers on the other side of the barbed wire. Nathula is open for Indian nationals on Tuesday ,Wednesday, Thursday, Friday, Saturday and Sundays. (Visit Nathula Pass @extracost, as per actual). (If due to landslide or bad road condition Tsomgo Lake is closed then alternate sightseeing will be provided).'
    },
    {
      day: 'Day 3 (13/Nov/2026)',
      title: 'GANGTOK - LACHUNG (116 KMS / 06 HRS)',
      description: 'After delicious breakfast check out from the hotel & transfer to Lachung (8,800 ft). Enroute visit Singhik View point, Seven Sister Water Fall, Naga Water Fall, arrive Lachung by evening. Enjoy dinner & overnight stay in Lachung.'
    },
    {
      day: 'Day 4 (14/Nov/2026)',
      title: 'LACHUNG – YUMTHANG VALLEY EXCURSION',
      description: 'After enjoying breakfast at hotel proceed to Yumthang Valley which is Known as Valley of Flowers (11800 Ft / 3598 Mts / 25 Kms / 1 ½ hours one way). On the way back, visit Hot Spring considered to have medicinal properties. Back to resort. Enjoy overnight stay in Lachung.'
    },
    {
      day: 'Day 5 (15/Nov/2026)',
      title: 'LACHUNG - GANGTOK (116 KMS / 06 HRS)',
      description: 'After a delicious breakfast check out from the hotel for departure to Gangtok. On the way back witness the wonderful Bheema & Twin waterfalls. Enjoy overnight stay in Gangtok.'
    },
    {
      day: 'Day 6 (16/Nov/2026)',
      title: 'GANGTOK - PELLING (120KMS / 05 HRS)',
      description: 'After a delicious breakfast check out from the hotel of Gangtok and receive transfer to Pelling (Pelling “6,100 ft” is a small town in the northeastern Indian state of Sikkim, at the foothills of Mount Khangchendzonga. The late-17th-century Buddhist Sanga Choling Monastery has mountain views. Pemayangtse Monastery features wall paintings, sculptures and a gold-plated statue of Guru Padsambhava. Overlooking a valley, the 17th-century Rabdentse Palace, now in ruins, still has evidence of the king’s bedroom and kitchen). On arrival at Pelling check in at hotel and rest the time in the lap of nature after long tiring journey. Enjoy overnight stay in Pelling.'
    },
    {
      day: 'Day 7 (17/Nov/2026)',
      title: 'PELLING SIGHTSEEING TO DARJEELING (109 KMS /04 HRS)',
      description: 'After a delicious breakfast enjoy sightseeing covering Birds park, Rabdantse Ruins , Pemyantse Monastery & Sky walk. After the local sightseeing of Pelling transfer to Darjeeling (6,710 ft). On arrival at Darjeeling check-in to hotel & enjoy rest of the day at leisure. Stroll in the Mall by your own. Enjoy overnight stay in Darjeeling.'
    },
    {
      day: 'Day 8 (18/Nov/2026)',
      title: 'DARJEELING LOCAL SIGHTSEEING (10 POINTS)',
      description: 'Be a witness of the spectacular sunrise over Mt. Kangchenjunga (28,208 ft. Worlds 3rd highest peak at around 4 am) at Tiger Hill early in the morning (Subject to availability of token, if not possible at the time of Sunrise, then it will be covered in day time.) After a sumptuous breakfast thrill yourself by visiting World famous Ghoom Monastery and Batasia Loop. Also visit Himalayan Mountaineering Institute, P.N. Zoological Park (Thursday closed), Tenzing Rock, Tibetan Refugee self-help Centre (Sunday closed), Tea Garden (outer view) , Japanese Temple, Peace Pagoda and Rope-way (Ticket cost not included and directly payable by guest). In evening explore the Mall on your own & shop around. Enjoy overnight stay in Darjeeling.'
    },
    {
      day: 'Day 9 (19/Nov/2026)',
      title: 'DARJEELING – NEW JALPAIGURI STATION / BAGDOGRA AIRPORT (98 KMS / 03 HRS)',
      description: 'After your breakfast check out from the hotel and take the departure transfer to New Jalpaiguri Station / Bagdogra Airport for your onward journey with unlimited memory of Darjeeling Tour.'
    }
  ],
  inclusions: [
    'Accommodation on 05 Dbl sharing basis.',
    '08 Night stay in mentioned hotel with Given Meal Plan',
    'Accommodation with Breakfast and Dinner',
    'All Possible Sightseeing and Transfers done By Private Car 03 XLO /INNOVA.',
    'All Transfers And Sightseeing By Ac Vehicle As Per The Itinerary From 08.00 Am To 07.00 Pm.',
    'All hotel taxes.',
    'Driver allowance, toll taxes, parking.',
    'Pick Up and Drop from Bagdogra.'
  ],
  exclusions: [
    'Any compulsory room supplement during the tour.',
    'X mas and New Year Supplements.',
    'Air Fare.',
    'Video and Camera permits at sights.',
    'Personal Expenses such as Laundry, telephone calls, tips & gratuity, mineral water, soft & hard drinks, porterage etc.',
    'Meals outside of the stated meal plan.',
    'Use of vehicle other than the specified itinerary.',
    'Expenses of personal nature.',
    'Guide charges.',
    'Any other services not specified above.',
    'Any increase in taxes or fuel price, leading to increase in cost on surface transportation & land arrangements, which may come into effect prior to departure.',
    'Early check in & Late check out at the hotels (Check in time 14:00 and Check out time 12.00 Noon)',
    'GST 5% Extra Applicable on Bill'
  ],
  documentsRequired: [
    '2 passport size photographs',
    '4 Photo identity',
    'Address proof along with photocopy & original.',
    'Passport Size Photos, Photocopies Of Photo Identity Proof Of All Members (Passport, Voter Card, Aadhar Card, Driving Licenses etc.)'
  ],
  cancellationPolicy: [
    'Once the flight ticket are issued actual airline penalty will be applied',
    '50-40 Days Before Departure : 50 % of package cost',
    '40-30 Days Before Departure : 60 % of Package cost',
    '30-21 Days before Departure : 75 % of Package cost',
    'Once the booking is reconfirmed 100% cancellation will be charged if cancelled less than 21 days prior to arrival.',
    'Cancellation policy may change according changes in hotel policy'
  ],
  importantInfo: [
    'Above costing is based on Minimum 12 Adults 00 Child Travelling together & may change in case the no of adults Change.',
    'Once the booking is reconfirmed 100% cancellation will be charged if cancelled less than 21 days prior to arrival.',
    'It is understood that, we act as agent only for all services covered hereby. Further we shall not be responsible for any loss, injury or damage resulting from acts of God, dangers, fire, breakdown of machinery, equipment or vehicles, acts of government authority, etc.',
    'If booking is done less than 21 days from arrival, immediate reconfirmation will be required.',
    'Flight cost is subject to change at the time of booking.'
  ],
  visualArchive: [
    'https://images.unsplash.com/photo-1493246232918-d78b97076ac9?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop'
  ]
};

const mapTourToQuotation = (tour: Tour): QuotationData => {
  // Extract hotels from itinerary accommodations or region
  const hotels: HotelRow[] = [];
  tour.itinerary?.forEach((day) => {
    if (day.accommodation) {
      const exists = hotels.some(h => h.hotels === day.accommodation);
      if (!exists) {
        // Find destination by looking at day title or region
        let dest = tour.region || '';
        if (day.title) {
          const split = day.title.split(':');
          if (split.length > 1 && split[0].toLowerCase().includes('day')) {
            const cleanTitle = split[1].trim();
            dest = cleanTitle.split(' ')[0].replace(/[^a-zA-Z]/g, '');
          }
        }
        hotels.push({
          destination: dest || tour.region || '',
          hotels: day.accommodation,
          mealPlan: day.meals || 'Breakfast & Dinner',
          nights: '01 Nights',
          rooms: '05'
        });
      }
    }
  });

  // If no hotels found, create one default row
  if (hotels.length === 0) {
    const nightsNum = tour.days > 1 ? tour.days - 1 : 1;
    hotels.push({
      destination: tour.region || '',
      hotels: 'Similar 3* Hotel',
      mealPlan: 'Breakfast & Dinner',
      nights: `${String(nightsNum).padStart(2, '0')} Nights`,
      rooms: '05'
    });
  }

  // Map itinerary days
  const itinerary = (tour.itinerary || []).map((day, i) => {
    let dayLabel = `Day ${i + 1}`;
    let title = day.title || '';
    const dayPrefixMatch = title.match(/^Day\s*\d+\s*[:\-]?\s*(.*)/i);
    if (dayPrefixMatch) {
      title = dayPrefixMatch[1].trim();
    }
    
    return {
      day: dayLabel,
      title: title.toUpperCase(),
      description: day.description || '',
      imageUrl: day.imageUrl || ''
    };
  });

  return {
    title: tour.name.toUpperCase(),
    heroImageUrl: tour.heroImageUrl || 'https://images.unsplash.com/photo-1544016768-982d1554f0b9?q=80&w=1200&auto=format&fit=crop',
    quotationDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/ /g, '-'),
    travelingDate: '',
    destination: tour.region.toUpperCase(),
    clientName: 'Dear Sir,',
    greetingText: 'Greeting From JourneyFlicker..!!',
    messageText: `kindly check below detail of your ${tour.region.toUpperCase()} Tour !!!`,
    optionTitle: `Option : 01(3*) ${String(tour.days - 1).padStart(2, '0')} Night ${String(tour.days).padStart(2, '0')} Days`,
    hotels,
    perPersonCost: `Package Cost Adults Rs.${tour.price || '0/-'}`,
    flightCosts: [],
    itinerary,
    inclusions: hiteshPreset.inclusions,
    exclusions: hiteshPreset.exclusions,
    documentsRequired: hiteshPreset.documentsRequired,
    cancellationPolicy: hiteshPreset.cancellationPolicy,
    importantInfo: hiteshPreset.importantInfo,
    visualArchive: tour.visualArchive && tour.visualArchive.length > 0 ? tour.visualArchive : hiteshPreset.visualArchive
  };
};

// Styling tokens
const inputCls = 'w-full px-3 py-2 border border-outline-variant/40 rounded-lg text-sm focus:outline-none focus:border-primary bg-surface-container-low text-on-surface transition-colors';
const labelCls = 'block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.15em] mb-1.5';

export default function AdminQuotation() {
  const [data, setData] = useState<QuotationData>(() => {
    const saved = localStorage.getItem('jf_active_quotation');
    return saved ? JSON.parse(saved) : emptyQuotation;
  });
  const [draftsList, setDraftsList] = useState<string[]>([]);
  const [draftName, setDraftName] = useState('');

  // Website tours list for loading existing tours
  const [websiteTours, setWebsiteTours] = useState<Tour[]>([]);
  const [selectedTourId, setSelectedTourId] = useState('');
  const [isLoadingTours, setIsLoadingTours] = useState(false);
  
  // Helpers to add detail inputs
  const [newIncl, setNewIncl] = useState('');
  const [newExcl, setNewExcl] = useState('');
  const [newDoc, setNewDoc] = useState('');
  const [newCancel, setNewCancel] = useState('');
  const [newInfo, setNewInfo] = useState('');
  const [newFlightCity, setNewFlightCity] = useState('');
  const [newFlightCost, setNewFlightCost] = useState('');
  const [newArchiveUrl, setNewArchiveUrl] = useState('');

  useEffect(() => {
    localStorage.setItem('jf_active_quotation', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    loadDraftsList();
  }, []);

  useEffect(() => {
    setIsLoadingTours(true);
    api.listTours({ limit: 150 })
      .then(res => {
        const items = Array.isArray(res) ? res : res.items;
        setWebsiteTours(items || []);
      })
      .catch(err => {
        console.error('Failed to fetch website tours:', err);
      })
      .finally(() => {
        setIsLoadingTours(false);
      });
  }, []);

  const handleImportWebsiteTour = async (tourId: string) => {
    if (!tourId) return;
    if (confirm('Load this tour from the website? This will overwrite your current quotation editor data.')) {
      try {
        const fullTour = await api.getTour(tourId);
        const mapped = mapTourToQuotation(fullTour);
        setData(mapped);
        setSelectedTourId('');
      } catch (err) {
        console.error(err);
        alert('Failed to load tour details.');
      }
    }
  };

  const loadDraftsList = () => {
    const list = Object.keys(localStorage).filter(k => k.startsWith('jf_quote_draft_'));
    setDraftsList(list.map(k => k.replace('jf_quote_draft_', '')));
  };

  const upd = (patch: Partial<QuotationData>) => setData(prev => ({ ...prev, ...patch }));

  // Hotels Row Manager
  const addHotelRow = () => {
    upd({
      hotels: [...data.hotels, { destination: '', hotels: '', mealPlan: 'Breakfast & Dinner', nights: '01 Nights', rooms: '05' }]
    });
  };
  const removeHotelRow = (idx: number) => {
    upd({ hotels: data.hotels.filter((_, i) => i !== idx) });
  };
  const updateHotelRow = (idx: number, patch: Partial<HotelRow>) => {
    upd({
      hotels: data.hotels.map((row, i) => i === idx ? { ...row, ...patch } : row)
    });
  };

  // Itinerary Days Manager
  const addItineraryDay = () => {
    const dayNum = data.itinerary.length + 1;
    upd({
      itinerary: [...data.itinerary, { day: `Day ${dayNum}`, title: '', description: '' }]
    });
  };
  const removeItineraryDay = (idx: number) => {
    upd({ itinerary: data.itinerary.filter((_, i) => i !== idx) });
  };
  const updateItineraryDay = (idx: number, patch: Partial<ItineraryDay>) => {
    upd({
      itinerary: data.itinerary.map((day, i) => i === idx ? { ...day, ...patch } : day)
    });
  };

  // Preset Loaders
  const loadPreset = (preset: QuotationData) => {
    if (confirm('Replace current editor data with the template?')) {
      setData(preset);
    }
  };

  // Draft Actions
  const handleSaveDraft = () => {
    if (!draftName.trim()) {
      alert('Please enter a name for the draft.');
      return;
    }
    localStorage.setItem(`jf_quote_draft_${draftName.trim()}`, JSON.stringify(data));
    alert(`Draft "${draftName.trim()}" saved.`);
    setDraftName('');
    loadDraftsList();
  };

  const handleLoadDraft = (name: string) => {
    const draft = localStorage.getItem(`jf_quote_draft_${name}`);
    if (draft && confirm(`Load draft "${name}"? This will overwrite the current editor content.`)) {
      setData(JSON.parse(draft));
    }
  };

  const handleDeleteDraft = (name: string) => {
    if (confirm(`Delete draft "${name}"?`)) {
      localStorage.removeItem(`jf_quote_draft_${name}`);
      loadDraftsList();
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear the current editor?')) {
      setData(emptyQuotation);
    }
  };

  // Print Logic
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const absUrl = (u?: string) => {
      if (!u) return '';
      if (u.startsWith('http') || u.startsWith('data:')) return u;
      return `${window.location.origin}${u.startsWith('/') ? '' : '/'}${u}`;
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${data.title} - JourneyFlicker Quotation</title>
               @media print {
              @page { margin: 15mm; }
              .page-container {
                page-break-after: always;
                min-height: 265mm;
                box-sizing: border-box;
                position: relative;
                padding: 15px;
                border: 3px double #000;
              }
              .page-container:last-child {
                page-break-after: avoid;
              }
            }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #000; margin: 0; padding: 0; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            .page-container {
              border: 3px double #000;
              padding: 20px;
              margin: 15px auto;
              max-width: 800px;
              box-sizing: border-box;
              position: relative;
              background: #fff;
            }
            .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 25px; margin-bottom: 30px; margin-top: 20px; }
            .logo { display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 36px; font-weight: 300; text-transform: uppercase; letter-spacing: -1px; margin-bottom: 25px; }
            .logo b { font-weight: 900; }
            .favicon { width: 36px; height: 36px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .hero-img { width: 100%; height: 300px; object-fit: cover; border-radius: 16px; margin-bottom: 25px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            h1 { font-size: 46px; font-weight: 300; text-transform: uppercase; margin: 0 0 5px 0; letter-spacing: -2px; line-height: 1.1; font-style: italic; }
            .subtitle { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; opacity: 0.6; margin: 0; }
            
            .section { margin-bottom: 35px; page-break-inside: avoid; }
            .sect-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin: 25px 0 15px 0; color: #000; font-style: italic; page-break-inside: avoid; }
            
            ul { padding-left: 20px; margin: 0; }
            li { margin-bottom: 8px; font-size: 14px; color: #333; }
            p { font-size: 14px; color: #333; margin-top: 0; line-height: 1.7; }
            
            .quote-meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 12px; margin-bottom: 25px; background: #f9f9f9; padding: 15px; border-radius: 12px; border: 1px solid #eee; page-break-inside: avoid; }
            .meta-item { display: flex; flex-direction: column; }
            .meta-label { font-weight: 800; text-transform: uppercase; font-size: 9px; color: #666; letter-spacing: 1px; }
            .meta-val { font-weight: bold; color: #000; font-size: 14px; }
            .greeting { margin-top: 20px; margin-bottom: 20px; }
            .greeting p { margin: 5px 0; font-size: 14px; color: #333; }
            
            .table-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #000; margin-bottom: 10px; font-style: italic; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; }
            th { background: #000; color: #fff; text-transform: uppercase; font-size: 10px; font-weight: 800; letter-spacing: 1px; padding: 10px 12px; border: 1px solid #000; text-align: center; }
            td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; }
            
            .pricing-section { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; background: #f9f9f9; border: 1px solid #eee; border-radius: 12px; padding: 20px; margin-bottom: 35px; page-break-inside: avoid; }
            .price-title { font-weight: 800; font-size: 10px; text-transform: uppercase; color: #666; margin-bottom: 6px; letter-spacing: 1px; }
            .price-val { font-size: 18px; font-weight: 950; color: #000; }
            .flights-list { list-style: none; padding: 0; margin: 0; }
            .flights-list li { display: flex; justify-content: space-between; font-size: 12px; border-bottom: 1px dashed #eee; padding: 6px 0; }
            
            .itinerary-day { margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #eee; page-break-inside: avoid; }
            .itinerary-day:last-child { border-bottom: none; }
            .day-header { display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px; }
            .day-img { width: 120px; height: 80px; object-fit: cover; border-radius: 8px; flex-shrink: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .day-title { font-size: 18px; font-weight: 700; margin: 0 0 5px 0; font-style: italic; }
            .day-desc { font-size: 13px; color: #333; margin: 0; line-height: 1.7; text-align: justify; }
            
            .lists-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; page-break-inside: avoid; }
            
            .gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px; page-break-inside: avoid; }
            .gallery-img { width: 100%; height: 140px; object-fit: cover; border-radius: 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

            .footer-info {
              position: absolute;
              bottom: 15px;
              left: 15px;
              right: 15px;
              border-top: 1px solid #eee;
              padding-top: 10px;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              font-size: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #555;
            }
            .footer-links { display: flex; gap: 15px; margin-top: 4px; }
          </style>       </style>
        </head>
        <body>
          
          <!-- PAGE 1: BASIC DETAILS & HOTELS & PRICING -->
          <div class="page-container">
            <div class="header">
              <div class="logo">
                <img src="${window.location.origin}/favicon-96x96.png" class="favicon" alt="JF Logo" />
                <span>Journey<b>Flicker</b></span>
              </div>
              ${data.heroImageUrl ? `<img src="${absUrl(data.heroImageUrl)}" class="hero-img" />` : ''}
              <h1>${data.title}</h1>
              <p class="subtitle">${data.destination || ''}</p>
            </div>
            
            <div class="quote-meta">
              <div class="meta-item">
                <span class="meta-label">Quotation Date</span>
                <span class="meta-val">${data.quotationDate}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Traveling Date</span>
                <span class="meta-val">${data.travelingDate}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Destination</span>
                <span class="meta-val">${data.destination}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Prepared By</span>
                <span class="meta-val">Curator Board</span>
              </div>
            </div>
            
            <div class="greeting">
              <p><strong>${data.clientName}</strong></p>
              <p>${data.greetingText}</p>
              <p>${data.messageText}</p>
            </div>
            
            <div class="table-title">${data.optionTitle}</div>
            <table>
              <thead>
                <tr>
                  <th>Destinations</th>
                  <th>Hotels</th>
                  <th>Meal Plan</th>
                  <th>No of Night</th>
                  <th>No of Room</th>
                </tr>
              </thead>
              <tbody>
                ${data.hotels.map(h => `
                  <tr>
                    <td>${h.destination}</td>
                    <td>${h.hotels}</td>
                    <td style="text-align:center;">${h.mealPlan}</td>
                    <td style="text-align:center;">${h.nights}</td>
                    <td style="text-align:center;">${h.rooms}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="pricing-section">
              <div class="info-item">
                <span class="price-title">Per Person Package Cost</span>
                <span class="price-val">${data.perPersonCost}</span>
              </div>
              ${data.flightCosts.length > 0 ? `
                <div class="info-item">
                  <span class="price-title">Additional Flight Cost</span>
                  <ul class="flights-list">
                    ${data.flightCosts.map(f => `
                      <li><span>${f.city}</span><strong>${f.cost}</strong></li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>

            <div class="footer-info">
              <div>103 | Raj Victoriya, Near Samarth Circle, Adajan, Surat, Gujarat 395009</div>
              <div class="footer-links">
                <span>tushar@journeyflicker.com | pashv@journeyflicker.com</span>
                <span>+91 98792 68811 | +91 97266 98987 | 0261 3564717</span>
              </div>
            </div>
          </div>
          
          <!-- PAGE 2: ITINERARY DETAILS -->
          <div class="page-container">
            <div class="header-bar">
              <div class="logo">
                <img src="${window.location.origin}/favicon-96x96.png" class="favicon" alt="Logo" />
                <span>Journey<b>Flicker</b></span>
              </div>
              <div class="header-info">Detailed Itinerary</div>
            </div>
            
            <div class="sect-title">Detailed Day Schedule</div>
            
            ${data.itinerary.map((day) => `
              <div class="itinerary-day">
                <div class="day-header">
                  ${day.imageUrl ? `<img src="${absUrl(day.imageUrl)}" class="day-img" />` : ''}
                  <div class="day-info">
                    <h4 class="day-title">${day.day}: ${day.title}</h4>
                    <p class="day-desc">${day.description}</p>
                  </div>
                </div>
              </div>
            `).join('')}
            
            <div class="footer-info">
              <div>103 | Raj Victoriya, Near Samarth Circle, Adajan, Surat, Gujarat 395009</div>
              <div class="footer-links">
                <span>tushar@journeyflicker.com | pashv@journeyflicker.com</span>
                <span>+91 98792 68811 | +91 97266 98987 | 0261 3564717</span>
              </div>
            </div>
          </div>

          <!-- PAGE 3: INCLUSIONS, EXCLUSIONS & GALLERY -->
          <div class="page-container">
            <div class="header-bar">
              <div class="logo">
                <img src="${window.location.origin}/favicon-96x96.png" class="favicon" alt="Logo" />
                <span>Journey<b>Flicker</b></span>
              </div>
              <div class="header-info">Terms & Portfolio</div>
            </div>
            
            <div class="lists-grid">
              ${data.inclusions.length > 0 ? `
                <div>
                  <div class="sect-title" style="margin-top:0;">What's Included</div>
                  <ul>
                    ${data.inclusions.map(i => `<li>${i}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              ${data.exclusions.length > 0 ? `
                <div>
                  <div class="sect-title" style="margin-top:0;">What's Excluded</div>
                  <ul>
                    ${data.exclusions.map(e => `<li>${e}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>

            ${data.visualArchive.length > 0 ? `
              <div>
                <div class="sect-title">Visual Archive</div>
                <div class="gallery-grid">
                  ${data.visualArchive.slice(0, 9).map(img => `
                    <img src="${absUrl(img)}" class="gallery-img" />
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <div class="footer-info">
              <div>103 | Raj Victoriya, Near Samarth Circle, Adajan, Surat, Gujarat 395009</div>
              <div class="footer-links">
                <span>tushar@journeyflicker.com | pashv@journeyflicker.com</span>
                <span>+91 98792 68811 | +91 97266 98987 | 0261 3564717</span>
              </div>
            </div>
          </div>

          <!-- PAGE 4: DOCUMENTS, CANCELLATIONS & POLICIES -->
          <div class="page-container">
            <div class="header-bar">
              <div class="logo">
                <img src="${window.location.origin}/favicon-96x96.png" class="favicon" alt="Logo" />
                <span>Journey<b>Flicker</b></span>
              </div>
              <div class="header-info">Policy & Guidelines</div>
            </div>
            
            <div class="lists-grid">
              ${data.documentsRequired.length > 0 ? `
                <div>
                  <div class="sect-title" style="margin-top:0;">Documents Required</div>
                  <ul>
                    ${data.documentsRequired.map(d => `<li>${d}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              ${data.cancellationPolicy.length > 0 ? `
                <div>
                  <div class="sect-title" style="margin-top:0;">Cancellation Policy</div>
                  <ul>
                    ${data.cancellationPolicy.map(c => `<li>${c}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>

            ${data.importantInfo.length > 0 ? `
              <div>
                <div class="sect-title">Important Guidelines</div>
                <ul>
                  ${data.importantInfo.map(i => `<li>${i}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <div class="footer-info">
              <div>103 | Raj Victoriya, Near Samarth Circle, Adajan, Surat, Gujarat 395009</div>
              <div class="footer-links">
                <span>tushar@journeyflicker.com | pashv@journeyflicker.com</span>
                <span>+91 98792 68811 | +91 97266 98987 | 0261 3564717</span>
              </div>
            </div>
          </div>
          
          <script>
            window.onload = () => {
              setTimeout(() => { window.print(); window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto pb-12">
      
      {/* ── LEFT PANEL: FORMS & CONTROLS ── */}
      <div className="w-full lg:w-1/2 space-y-6">
        
        {/* Presets & Save */}
        <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Quotation Templates</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => loadPreset(hiteshPreset)}
                className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-[10px] uppercase font-black tracking-widest shadow-md hover:scale-105 transition-all"
              >
                ⚡ Hitesh North East Preset
              </button>
              <button 
                onClick={handleClearAll}
                className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-colors"
              >
                Clear Editor
              </button>
            </div>
          </div>

          {/* Website Tour Selector */}
          <div className="border-t border-outline-variant/20 pt-4 space-y-2">
            <label className={labelCls}>Load Tour from Website</label>
            <div className="flex gap-2">
              <select
                value={selectedTourId}
                onChange={e => setSelectedTourId(e.target.value)}
                className={inputCls}
                disabled={isLoadingTours}
              >
                <option value="">-- Select a Website Tour --</option>
                {websiteTours.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.days} Days - {t.region})
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleImportWebsiteTour(selectedTourId)}
                disabled={!selectedTourId}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-xs font-bold whitespace-nowrap hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                Load Tour
              </button>
            </div>
          </div>

          <div className="border-t border-outline-variant/20 pt-4 flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              value={draftName} 
              onChange={e => setDraftName(e.target.value)}
              className={inputCls} 
              placeholder="Draft Name (e.g. Kerala July 2026)" 
            />
            <button 
              onClick={handleSaveDraft}
              className="px-4 py-2 bg-on-surface text-surface dark:bg-white dark:text-black rounded-lg text-xs font-bold whitespace-nowrap hover:opacity-95 transition-opacity"
            >
              Save Draft
            </button>
          </div>

          {draftsList.length > 0 && (
            <div className="border-t border-outline-variant/20 pt-4">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Saved Local Drafts</p>
              <div className="flex flex-wrap gap-2">
                {draftsList.map(name => (
                  <div key={name} className="flex items-center gap-1 bg-surface-container-low border border-outline-variant/20 rounded-xl pl-3 pr-1 py-1">
                    <span className="text-xs truncate font-medium max-w-[120px]">{name}</span>
                    <button onClick={() => handleLoadDraft(name)} className="text-primary hover:text-primary-variant p-1">
                      <span className="material-symbols-outlined text-sm font-bold">input</span>
                    </button>
                    <button onClick={() => handleDeleteDraft(name)} className="text-red-400 hover:text-red-600 p-1">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Basic Header Info */}
        <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/10 pb-2">1. Header & Greetings</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Quotation Title</label>
              <input type="text" value={data.title} onChange={e => upd({ title: e.target.value.toUpperCase() })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Destination Label</label>
              <input type="text" value={data.destination} onChange={e => upd({ destination: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Quotation Date</label>
              <input type="text" value={data.quotationDate} onChange={e => upd({ quotationDate: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Traveling Date</label>
              <input type="text" value={data.travelingDate} onChange={e => upd({ travelingDate: e.target.value })} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Hero Banner Image URL</label>
              <input type="text" value={data.heroImageUrl || ''} onChange={e => upd({ heroImageUrl: e.target.value })} className={inputCls} placeholder="https://..." />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelCls}>Client Name / Address Header</label>
              <input type="text" value={data.clientName} onChange={e => upd({ clientName: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Greeting Line</label>
              <input type="text" value={data.greetingText} onChange={e => upd({ greetingText: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Intro Message</label>
              <input type="text" value={data.messageText} onChange={e => upd({ messageText: e.target.value })} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Option Grid (Hotels) */}
        <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">2. Hotel & Accommodation Grid</h3>
            <button onClick={addHotelRow} className="px-3 py-1 bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high text-xs font-bold rounded-lg transition-colors">+ Add Row</button>
          </div>

          <div>
            <label className={labelCls}>Option Grid Title</label>
            <input type="text" value={data.optionTitle} onChange={e => upd({ optionTitle: e.target.value })} className={inputCls} />
          </div>

          <div className="space-y-4 mt-4">
            {data.hotels.map((row, idx) => (
              <div key={idx} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 space-y-3 relative">
                <button 
                  onClick={() => removeHotelRow(idx)}
                  className="absolute right-2 top-2 text-red-400 hover:text-red-600"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className={labelCls}>Destination</label>
                    <input type="text" value={row.destination} onChange={e => updateHotelRow(idx, { destination: e.target.value })} className={inputCls} placeholder="e.g. Gangtok" />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Hotels / Options</label>
                    <input type="text" value={row.hotels} onChange={e => updateHotelRow(idx, { hotels: e.target.value })} className={inputCls} placeholder="e.g. Sinkham Grand / Similar" />
                  </div>
                  <div>
                    <label className={labelCls}>Meal Plan</label>
                    <input type="text" value={row.mealPlan} onChange={e => updateHotelRow(idx, { mealPlan: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Nights</label>
                    <input type="text" value={row.nights} onChange={e => updateHotelRow(idx, { nights: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Rooms</label>
                    <input type="text" value={row.rooms} onChange={e => updateHotelRow(idx, { rooms: e.target.value })} className={inputCls} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Package Costs & Flight Costs */}
        <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/10 pb-2">3. Package & Flight Costs</h3>
          
          <div>
            <label className={labelCls}>Package Cost (Per Person)</label>
            <input type="text" value={data.perPersonCost} onChange={e => upd({ perPersonCost: e.target.value })} className={inputCls} placeholder="e.g. Package Cost Adults Rs.36,600/-X15" />
          </div>

          <div className="pt-2">
            <label className={labelCls}>Flight Costs (Additional)</label>
            <div className="space-y-2 mb-3">
              {data.flightCosts.map((f, idx) => (
                <div key={idx} className="flex justify-between items-center bg-surface-container-low p-2 rounded-lg text-sm border border-outline-variant/10">
                  <span>{f.city}: <strong>{f.cost}</strong></span>
                  <button onClick={() => upd({ flightCosts: data.flightCosts.filter((_, i) => i !== idx) })} className="text-red-400 hover:text-red-600">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input type="text" value={newFlightCity} onChange={e => setNewFlightCity(e.target.value)} className={inputCls} placeholder="Ex. Mumbai" />
              <input type="text" value={newFlightCost} onChange={e => setNewFlightCost(e.target.value)} className={inputCls} placeholder="22,700/-Per Person" />
              <button 
                onClick={() => {
                  if (!newFlightCity || !newFlightCost) return;
                  upd({ flightCosts: [...data.flightCosts, { city: newFlightCity.trim(), cost: newFlightCost.trim() }] });
                  setNewFlightCity('');
                  setNewFlightCost('');
                }}
                className="px-4 py-2 bg-surface-container border border-outline-variant/30 rounded-lg text-xs font-bold hover:bg-surface-container-high transition-all"
              >
                + Add
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Itinerary */}
        <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">4. Day Schedule (Itinerary)</h3>
            <button onClick={addItineraryDay} className="px-3 py-1 bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high text-xs font-bold rounded-lg transition-colors">+ Add Day</button>
          </div>

          <div className="space-y-4">
            {data.itinerary.map((day, idx) => (
              <div key={idx} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 space-y-3 relative">
                <button onClick={() => removeItineraryDay(idx)} className="absolute right-2 top-2 text-red-400 hover:text-red-600">
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Day Index</label>
                    <input type="text" value={day.day} onChange={e => updateItineraryDay(idx, { day: e.target.value })} className={inputCls} placeholder="Day 1 (11/Nov/2026)" />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Day Heading / Title</label>
                    <input type="text" value={day.title} onChange={e => updateItineraryDay(idx, { title: e.target.value })} className={inputCls} placeholder="Title details" />
                  </div>
                  <div className="col-span-3">
                    <label className={labelCls}>Description</label>
                    <textarea value={day.description} onChange={e => updateItineraryDay(idx, { description: e.target.value })} className={inputCls} rows={4} placeholder="Detailed activities..." />
                  </div>
                  <div className="col-span-3">
                    <label className={labelCls}>Day Image URL (Optional)</label>
                    <input type="text" value={day.imageUrl || ''} onChange={e => updateItineraryDay(idx, { imageUrl: e.target.value })} className={inputCls} placeholder="https://..." />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Archive */}
        <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/10 pb-2">5. Visual Archive Gallery</h3>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {data.visualArchive.map((url, idx) => (
              <div key={idx} className="relative w-20 h-20 border border-outline-variant/20 rounded-xl overflow-hidden group">
                <img src={url} className="w-full h-full object-cover" />
                <button 
                  onClick={() => upd({ visualArchive: data.visualArchive.filter((_, i) => i !== idx) })}
                  className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input type="text" value={newArchiveUrl} onChange={e => setNewArchiveUrl(e.target.value)} className={inputCls} placeholder="Paste image URL..." />
            <button 
              onClick={() => {
                if (!newArchiveUrl.trim()) return;
                upd({ visualArchive: [...data.visualArchive, newArchiveUrl.trim()] });
                setNewArchiveUrl('');
              }}
              className="px-4 py-2 bg-surface-container border border-outline-variant/30 rounded-lg text-xs font-bold hover:bg-surface-container-high transition-all"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Inclusions & Exclusions */}
        <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 shadow-sm space-y-6">
          
          {/* Inclusions */}
          <div>
            <h3 className={labelCls}>Package Inclusions</h3>
            <div className="space-y-1 mb-2">
              {data.inclusions.map((inc, i) => (
                <div key={i} className="flex justify-between items-center text-xs p-1.5 bg-surface-container-low rounded border border-outline-variant/10">
                  <span className="truncate max-w-[90%]">{inc}</span>
                  <button onClick={() => upd({ inclusions: data.inclusions.filter((_, idx) => idx !== i) })} className="text-red-400">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newIncl} onChange={e => setNewIncl(e.target.value)} className={inputCls} placeholder="Add inclusion..." />
              <button onClick={() => { if (newIncl) { upd({ inclusions: [...data.inclusions, newIncl] }); setNewIncl(''); } }} className="px-3 py-1 bg-surface-container rounded-lg text-xs border border-outline-variant/20">+</button>
            </div>
          </div>

          {/* Exclusions */}
          <div className="pt-4 border-t border-outline-variant/10">
            <h3 className={labelCls}>Package Exclusions</h3>
            <div className="space-y-1 mb-2">
              {data.exclusions.map((ex, i) => (
                <div key={i} className="flex justify-between items-center text-xs p-1.5 bg-surface-container-low rounded border border-outline-variant/10">
                  <span className="truncate max-w-[90%]">{ex}</span>
                  <button onClick={() => upd({ exclusions: data.exclusions.filter((_, idx) => idx !== i) })} className="text-red-400">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newExcl} onChange={e => setNewExcl(e.target.value)} className={inputCls} placeholder="Add exclusion..." />
              <button onClick={() => { if (newExcl) { upd({ exclusions: [...data.exclusions, newExcl] }); setNewExcl(''); } }} className="px-3 py-1 bg-surface-container rounded-lg text-xs border border-outline-variant/20">+</button>
            </div>
          </div>

          {/* Documents */}
          <div className="pt-4 border-t border-outline-variant/10">
            <h3 className={labelCls}>Documents Required</h3>
            <div className="space-y-1 mb-2">
              {data.documentsRequired.map((doc, i) => (
                <div key={i} className="flex justify-between items-center text-xs p-1.5 bg-surface-container-low rounded border border-outline-variant/10">
                  <span className="truncate max-w-[90%]">{doc}</span>
                  <button onClick={() => upd({ documentsRequired: data.documentsRequired.filter((_, idx) => idx !== i) })} className="text-red-400">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newDoc} onChange={e => setNewDoc(e.target.value)} className={inputCls} placeholder="Add document rule..." />
              <button onClick={() => { if (newDoc) { upd({ documentsRequired: [...data.documentsRequired, newDoc] }); setNewDoc(''); } }} className="px-3 py-1 bg-surface-container rounded-lg text-xs border border-outline-variant/20">+</button>
            </div>
          </div>

          {/* Cancellation */}
          <div className="pt-4 border-t border-outline-variant/10">
            <h3 className={labelCls}>Cancellation Policy</h3>
            <div className="space-y-1 mb-2">
              {data.cancellationPolicy.map((c, i) => (
                <div key={i} className="flex justify-between items-center text-xs p-1.5 bg-surface-container-low rounded border border-outline-variant/10">
                  <span className="truncate max-w-[90%]">{c}</span>
                  <button onClick={() => upd({ cancellationPolicy: data.cancellationPolicy.filter((_, idx) => idx !== i) })} className="text-red-400">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newCancel} onChange={e => setNewCancel(e.target.value)} className={inputCls} placeholder="Add policy..." />
              <button onClick={() => { if (newCancel) { upd({ cancellationPolicy: [...data.cancellationPolicy, newCancel] }); setNewCancel(''); } }} className="px-3 py-1 bg-surface-container rounded-lg text-xs border border-outline-variant/20">+</button>
            </div>
          </div>

          {/* Important Info */}
          <div className="pt-4 border-t border-outline-variant/10">
            <h3 className={labelCls}>Important Information</h3>
            <div className="space-y-1 mb-2">
              {data.importantInfo.map((inf, i) => (
                <div key={i} className="flex justify-between items-center text-xs p-1.5 bg-surface-container-low rounded border border-outline-variant/10">
                  <span className="truncate max-w-[90%]">{inf}</span>
                  <button onClick={() => upd({ importantInfo: data.importantInfo.filter((_, idx) => idx !== i) })} className="text-red-400">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newInfo} onChange={e => setNewInfo(e.target.value)} className={inputCls} placeholder="Add guideline..." />
              <button onClick={() => { if (newInfo) { upd({ importantInfo: [...data.importantInfo, newInfo] }); setNewInfo(''); } }} className="px-3 py-1 bg-surface-container rounded-lg text-xs border border-outline-variant/20">+</button>
            </div>
          </div>

        </div>

      </div>

      {/* ── RIGHT PANEL: LIVE PREVIEW & PRINT ── */}
      <div className="w-full lg:w-1/2 space-y-6">
        
        {/* Floating Print Action */}
        <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 shadow-sm flex items-center justify-between sticky top-6 z-20">
          <div>
            <h3 className="text-sm font-black text-on-surface">Live Document Preview</h3>
            <p className="text-xs text-on-surface-variant opacity-60">Renders changes dynamically in A4 paper layout format.</p>
          </div>
          <button 
            onClick={handlePrint}
            className="px-6 py-3 bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-xl text-xs font-black tracking-widest uppercase flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm font-bold">print</span>
            Print / Download PDF
          </button>
        </div>

        {/* Rendered Live Preview Frame */}
        <div className="bg-gray-100 dark:bg-neutral-900 border border-outline-variant/20 rounded-2xl p-4 max-h-[85vh] overflow-y-auto space-y-6 custom-scrollbar shadow-inner">
          
          {/* SHEET 1 */}
          <div className="bg-white text-black p-8 rounded shadow-md border-[3px] border-double border-black max-w-[640px] mx-auto min-h-[850px] relative flex flex-col justify-between" style={{ fontSize: '11px' }}>
            <div>
              <div className="text-center border-b-2 border-black pb-4 mb-4">
                <div className="flex items-center justify-center gap-2 text-2xl font-light uppercase tracking-tighter mb-4">
                  <span className="text-xs uppercase bg-black text-white p-1 rounded font-black">JF</span>
                  <span>Journey<b>Flicker</b></span>
                </div>
                {data.heroImageUrl && (
                  <img src={data.heroImageUrl} className="w-full h-48 object-cover rounded-2xl mb-4 shadow-sm" alt="Hero Banner" />
                )}
                <h1 className="text-3xl font-light uppercase italic tracking-tighter leading-tight mb-1">{data.title}</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{data.destination}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 border border-gray-100 p-2.5 rounded-lg mb-4 text-[10px]">
                <div>
                  <div className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Quotation Date</div>
                  <div className="font-bold">{data.quotationDate}</div>
                </div>
                <div>
                  <div className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Traveling Date</div>
                  <div className="font-bold">{data.travelingDate || '—'}</div>
                </div>
                <div>
                  <div className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Destination</div>
                  <div className="font-bold">{data.destination || '—'}</div>
                </div>
                <div>
                  <div className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Prepared By</div>
                  <div className="font-bold">Curator Board</div>
                </div>
              </div>

              <div className="mb-4">
                <p className="font-black margin-0 text-[11px]">{data.clientName}</p>
                <p className="margin-0 leading-relaxed text-gray-600">{data.greetingText}</p>
                <p className="margin-0 leading-relaxed text-gray-600">{data.messageText}</p>
              </div>

              <div className="font-black text-[9px] uppercase tracking-widest text-gray-400 mb-2 italic">{data.optionTitle}</div>
              <table className="w-full border-collapse text-[10px] mb-4">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="border border-black p-2 text-left uppercase text-[8px] font-black text-white">Destinations</th>
                    <th className="border border-black p-2 text-left uppercase text-[8px] font-black text-white">Hotels</th>
                    <th className="border border-black p-2 text-center uppercase text-[8px] font-black text-white">Meal Plan</th>
                    <th className="border border-black p-2 text-center uppercase text-[8px] font-black text-white">Nights</th>
                    <th className="border border-black p-2 text-center uppercase text-[8px] font-black text-white">Rooms</th>
                  </tr>
                </thead>
                <tbody>
                  {data.hotels.map((h, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="border border-gray-200 p-2 font-bold">{h.destination || '—'}</td>
                      <td className="border border-gray-200 p-2 text-gray-600">{h.hotels || '—'}</td>
                      <td className="border border-gray-200 p-2 text-center text-gray-600">{h.mealPlan}</td>
                      <td className="border border-gray-200 p-2 text-center text-gray-600">{h.nights}</td>
                      <td className="border border-gray-200 p-2 text-center text-gray-600">{h.rooms}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 border border-gray-200 p-3 rounded-xl mb-4">
                <div>
                  <div className="text-[7px] font-black uppercase text-gray-400">Package Cost</div>
                  <div className="text-xs font-black text-black">{data.perPersonCost}</div>
                </div>
                {data.flightCosts.length > 0 && (
                  <div>
                    <div className="text-[7px] font-black uppercase text-gray-400">Additional Flight Costs</div>
                    <ul className="list-none p-0 m-0">
                      {data.flightCosts.map((f, i) => (
                        <li key={i} className="flex justify-between border-b border-gray-100 py-1 text-[10px]">
                          <span>{f.city}</span>
                          <strong>{f.cost}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-2 flex flex-col items-center text-[7px] text-gray-500 font-bold uppercase tracking-widest text-center">
              <div>103 | Raj Victoriya, Near Samarth Circle, Adajan, Surat, Gujarat 395009</div>
              <div className="flex gap-4 mt-1">
                <span>tushar@journeyflicker.com | pashv@journeyflicker.com</span>
                <span>+91 98792 68811 | +91 97266 98987 | 0261 3564717</span>
              </div>
            </div>
          </div>

          {/* SHEET 2 */}
          <div className="bg-white text-black p-8 rounded shadow-md border-[3px] border-double border-black max-w-[640px] mx-auto min-h-[850px] relative flex flex-col justify-between" style={{ fontSize: '11px' }}>
            <div>
              <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
                <div className="flex items-center gap-2 text-xl font-light uppercase tracking-tighter">
                  <span className="text-xs uppercase bg-black text-white p-1 rounded font-black">JF</span>
                  <span>Journey<b>Flicker</b></span>
                </div>
                <div className="text-[7px] text-right leading-tight text-gray-500 uppercase tracking-widest font-black">
                  Detailed Itinerary
                </div>
              </div>

              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b pb-1 font-serif italic">Detailed Day Schedule</div>

              <div className="space-y-4">
                {data.itinerary.map((day, i) => (
                  <div key={i} className="border-b border-gray-100 pb-3 last:border-b-0">
                    <div className="flex gap-4 items-start">
                      {day.imageUrl && <img src={day.imageUrl} className="w-28 h-20 object-cover rounded-lg border border-gray-200 shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-black italic">{day.day}: {day.title || 'Day Schedule details'}</div>
                        <p className="text-xs text-gray-600 leading-relaxed mt-1 text-justify">{day.description || 'Provide day activities...'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-2 flex flex-col items-center text-[7px] text-gray-500 font-bold uppercase tracking-widest text-center">
              <div>103 | Raj Victoriya, Near Samarth Circle, Adajan, Surat, Gujarat 395009</div>
              <div className="flex gap-4 mt-1">
                <span>tushar@journeyflicker.com | pashv@journeyflicker.com</span>
                <span>+91 98792 68811 | +91 97266 98987 | 0261 3564717</span>
              </div>
            </div>
          </div>

          {/* SHEET 3 */}
          <div className="bg-white text-black p-8 rounded shadow-md border-[3px] border-double border-black max-w-[640px] mx-auto min-h-[850px] relative flex flex-col justify-between" style={{ fontSize: '11px' }}>
            <div>
              <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
                <div className="flex items-center gap-2 text-xl font-light uppercase tracking-tighter">
                  <span className="text-xs uppercase bg-black text-white p-1 rounded font-black">JF</span>
                  <span>Journey<b>Flicker</b></span>
                </div>
                <div className="text-[7px] text-right leading-tight text-gray-500 uppercase tracking-widest font-black">
                  Terms & Portfolio
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-black text-black border-b pb-1 mb-2 italic">What's Included</div>
                  <ul className="pl-4 m-0 space-y-1 list-disc text-[10px] text-gray-600">
                    {data.inclusions.map((inc, i) => <li key={i}>{inc}</li>)}
                    {data.inclusions.length === 0 && <span className="italic opacity-50">None specified</span>}
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] font-black text-black border-b pb-1 mb-2 italic">What's Excluded</div>
                  <ul className="pl-4 m-0 space-y-1 list-disc text-[10px] text-gray-600">
                    {data.exclusions.map((exc, i) => <li key={i}>{exc}</li>)}
                    {data.exclusions.length === 0 && <span className="italic opacity-50">None specified</span>}
                  </ul>
                </div>
              </div>

              {data.visualArchive.length > 0 && (
                <div className="mt-6">
                  <div className="text-[10px] font-black text-black border-b pb-1 mb-3 italic">Visual Archive</div>
                  <div className="grid grid-cols-3 gap-2">
                    {data.visualArchive.slice(0, 6).map((url, i) => (
                      <img key={i} src={url} className="w-full h-28 object-cover rounded-lg border border-gray-200" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-2 flex flex-col items-center text-[7px] text-gray-500 font-bold uppercase tracking-widest text-center">
              <div>103 | Raj Victoriya, Near Samarth Circle, Adajan, Surat, Gujarat 395009</div>
              <div className="flex gap-4 mt-1">
                <span>tushar@journeyflicker.com | pashv@journeyflicker.com</span>
                <span>+91 98792 68811 | +91 97266 98987 | 0261 3564717</span>
              </div>
            </div>
          </div>

          {/* SHEET 4 */}
          <div className="bg-white text-black p-8 rounded shadow-md border-[3px] border-double border-black max-w-[640px] mx-auto min-h-[850px] relative flex flex-col justify-between" style={{ fontSize: '11px' }}>
            <div>
              <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
                <div className="flex items-center gap-2 text-xl font-light uppercase tracking-tighter">
                  <span className="text-xs uppercase bg-black text-white p-1 rounded font-black">JF</span>
                  <span>Journey<b>Flicker</b></span>
                </div>
                <div className="text-[7px] text-right leading-tight text-gray-500 uppercase tracking-widest font-black">
                  Policy & Guidelines
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-black text-black border-b pb-1 mb-2 italic">Documents Required</div>
                  <ul className="pl-4 m-0 space-y-1 list-disc text-[10px] text-gray-600">
                    {data.documentsRequired.map((doc, i) => <li key={i}>{doc}</li>)}
                    {data.documentsRequired.length === 0 && <span className="italic opacity-50">None specified</span>}
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] font-black text-black border-b pb-1 mb-2 italic">Cancellation Policy</div>
                  <ul className="pl-4 m-0 space-y-1 list-disc text-[10px] text-gray-600">
                    {data.cancellationPolicy.map((c, i) => <li key={i}>{c}</li>)}
                    {data.cancellationPolicy.length === 0 && <span className="italic opacity-50">None specified</span>}
                  </ul>
                </div>
              </div>

              {data.importantInfo.length > 0 && (
                <div className="mt-6">
                  <div className="text-[10px] font-black text-black border-b pb-1 mb-2 italic">Important Guidelines</div>
                  <ul className="pl-4 m-0 space-y-1 list-disc text-[10px] text-gray-600">
                    {data.importantInfo.map((inf, i) => <li key={i}>{inf}</li>)}
                  </ul>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-2 flex flex-col items-center text-[7px] text-gray-500 font-bold uppercase tracking-widest text-center">
              <div>103 | Raj Victoriya, Near Samarth Circle, Adajan, Surat, Gujarat 395009</div>
              <div className="flex gap-4 mt-1">
                <span>tushar@journeyflicker.com | pashv@journeyflicker.com</span>
                <span>+91 98792 68811 | +91 97266 98987 | 0261 3564717</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
