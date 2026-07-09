import { useState, useEffect } from 'react';
import type { Tour, QuotationRecord } from '../lib/api';
import { api } from '../lib/api';
import { Logo } from '../components/Logo';
import { MediaSelectorModal } from '../components/MediaSelectorModal';

// Interfaces for Quotation Structure
interface HotelRow {
  destination: string;
  hotels: string;
  mealPlan: string;
  nights: string;
  rooms: string;
}

interface PackageCostItem {
  category: string;
  cost: number;
  pax: number;
}

interface FlightCost {
  city: string;
  cost: number;
  pax: number;
}

interface QuotationOption {
  optionTitle: string;
  hotels: HotelRow[];
  packageCosts: PackageCostItem[];
  flightCosts: FlightCost[];
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
  options: QuotationOption[];
  optionTitle?: string;
  hotels?: HotelRow[];
  perPersonCost?: string;
  packageCosts?: PackageCostItem[];
  flightCosts?: FlightCost[];
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  documentsRequired: string[];
  cancellationPolicy: string[];
  importantInfo: string[];
  visualArchive: string[];
  preparedBy?: string;
  termsAndConditions?: string[];
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
  options: [{
    optionTitle: 'Option : 01(3*) 08 Night 09 Days',
    hotels: [
      { destination: '', hotels: '', mealPlan: 'Breakfast & Dinner', nights: '02 Nights', rooms: '05' }
    ],
    packageCosts: [
      { category: 'Adults', cost: 0, pax: 1 }
    ],
    flightCosts: []
  }],
  itinerary: [
    { day: 'Day 1', title: '', description: '' }
  ],
  inclusions: [],
  exclusions: [],
  documentsRequired: [],
  cancellationPolicy: [],
  importantInfo: [],
  visualArchive: [],
  preparedBy: 'Curator Board',
  termsAndConditions: []
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
  options: [{
    optionTitle: 'Option : 01(3*) 08 Night 09 Days',
    hotels: [
      { destination: 'Gangtok', hotels: 'Sinkham Grand/ Hungry Jack/ Similar', mealPlan: 'Breakfast & Dinner', nights: '02 Nights', rooms: '05' },
      { destination: 'Lachung', hotels: "The 'Elite Zone/ Lachug Deezong/ Lachung Heritage / Similar", mealPlan: 'Breakfast & Dinner', nights: '02 Nights', rooms: '05' },
      { destination: 'Gangtok', hotels: 'Sinkham Grand/ Hungry Jack/ Similar', mealPlan: 'Breakfast & Dinner', nights: '01 Nights', rooms: '05' },
      { destination: 'Pelling', hotels: 'Pelling Resort/ Crasula Ovata / Similar', mealPlan: 'Breakfast & Dinner', nights: '01 Nights', rooms: '05' },
      { destination: 'Darjeeling', hotels: 'Zambala/ Mount Conifer/ Similar', mealPlan: 'Breakfast & Dinner', nights: '02 Nights', rooms: '05' }
    ],
    packageCosts: [
      { category: 'Adults', cost: 36600, pax: 15 }
    ],
    flightCosts: [
      { city: 'Ex. Mumbai', cost: 22700, pax: 15 },
      { city: 'Ex. Ahmedabad', cost: 20000, pax: 15 }
    ]
  }],
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
        'Once flight tickets are issued, the applicable airline cancellation penalty will be charged.',
    '50–40 days before departure: 50% of the package cost will be charged.',
    '40–30 days before departure: 60% of the package cost will be charged.',
    '30–21 days before departure: 75% of the package cost will be charged.',
    ' Less than 20 days before departure: 100% of the total package cost will be charged',
    'The cancellation policy is subject to change as per the hotel’s policy.',
    'Any non-refundable services, including hotel bookings, transfers, or other third-party arrangements, will be charged in full as per supplier policy.',
  ],
  importantInfo: [
        'Rates are based on minimum guest count and subject to change if group size changes.',
    'Early check-in or late check-out is subject to room availability and extra charges.',
    'We act as booking agents only and cannot be held liable for mechanical failures or acts of God.',
    'Hotels/Airline will be subject to availability till Reconfirmation.',
    'Given cost is estimated, based on lowest airfare and hotel rates existing as of now. We don’t hold any confirmation for Hotels/Airline. It’s Subject to availability at the time of booking. Any difference in cost shall be borne by passenger.',
    'Room allocation Twin rooms /Double room will be as per the availability at the time of check in',
    'Hotel Check in time 1400hrs, Check out Time 1200hrs (Depend On Hotel Policy)',
    'Charges for extras (Wi‑Fi, minibar, laundry, room service, etc.) and local taxes are charged directly by the hotel.',
    'Certain hotels abroad may ask for a security deposit during check-in, which is refundable at check-out subject to the hotels policy.',
    'The package price does not include special dinner or mandatory charges at time levied by the hotels especially during New Year and Christmas or any special occasions.'

  ],
  visualArchive: [
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop'
  ],
  preparedBy: 'Curator Board',
  termsAndConditions: [
    'The itinerary is tentative and subject to change based on local traffic conditions or weather.',
    'Any booking is subject to confirmation only after receiving the advance payment.',
    'All prices are subject to change without prior notice unless booking is fully paid.'
  ]
};

// Demo Preset: Kerala Backwaters & Munnar (7 Nights / 8 Days)
const keralaPreset: QuotationData = {
  title: 'KERALA BACKWATERS & MUNNAR TOUR',
  heroImageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1200&auto=format&fit=crop',
  quotationDate: '19-JUN-2026',
  travelingDate: '15-OCT-2026',
  destination: 'KERALA',
  clientName: 'Dear Sir / Madam,',
  greetingText: 'Warm Greetings From JourneyFlicker..!!',
  messageText: 'Kindly find below the detailed itinerary & quotation for your KERALA Tour !!!',
  options: [{
    optionTitle: 'Option : 01 (3★/4★) 07 Nights 08 Days',
    hotels: [
      { destination: 'Cochin', hotels: 'Hotel Abad Atrium / Gokulam Park / Similar (4★)', mealPlan: 'Breakfast & Dinner', nights: '01 Night', rooms: '05' },
      { destination: 'Munnar', hotels: 'Hotel Tall Trees / Elysium Garden Hill Resort / Similar (3★)', mealPlan: 'Breakfast & Dinner', nights: '02 Nights', rooms: '05' },
      { destination: 'Thekkady', hotels: 'Spice Village / Cardamom County / Similar (3★)', mealPlan: 'Breakfast & Dinner', nights: '01 Night', rooms: '05' },
      { destination: 'Alleppey', hotels: 'Premium Houseboat (Deluxe AC Cabin) / Similar', mealPlan: 'All Meals Included', nights: '01 Night', rooms: '05' },
      { destination: 'Kovalam', hotels: 'Hotel Uday Samudra / Turtle On The Beach / Similar (3★)', mealPlan: 'Breakfast & Dinner', nights: '02 Nights', rooms: '05' }
    ],
    packageCosts: [
      { category: 'Adults', cost: 28500, pax: 10 }
    ],
    flightCosts: [
      { city: 'Ex. Ahmedabad (AMD → COK)', cost: 8200, pax: 10 },
      { city: 'Ex. Mumbai (BOM → COK)', cost: 5500, pax: 10 },
      { city: 'Ex. Surat (BOM via Mumbai → COK)', cost: 6800, pax: 10 }
    ]
  }],
  itinerary: [
    {
      day: 'Day 1 (15/Oct/2026)',
      title: 'ARRIVAL AT COCHIN – FORT KOCHI CITY TOUR',
      description: 'Arrive at Cochin International Airport. You will be received by our representative and transferred to your hotel. After check-in and freshening up, proceed for a half day city tour of Fort Kochi covering the iconic Chinese Fishing Nets (Cheena Vala) — a unique ancient fishing technique, St. Francis Church (oldest European church in India), Mattancherry Palace (Dutch Palace), and the vibrant Jewish Synagogue at Jew Town. Evening at leisure to explore Marine Drive. Overnight stay in Cochin.'
    },
    {
      day: 'Day 2 (16/Oct/2026)',
      title: 'COCHIN TO MUNNAR (130 KMS / 04 HRS)',
      description: 'After breakfast, check out and drive towards Munnar — the "Kashmir of South India." Enjoy a scenic drive through lush green tea estates, spice plantations, waterfalls, and panoramic hills. Enroute, visit the magnificent Cheeyappara Waterfalls and Valara Waterfalls. Also visit Kaladi, the birthplace of Adi Shankaracharya. On arrival at Munnar, check-in to hotel. Evening free to explore the local market. Overnight stay in Munnar.'
    },
    {
      day: 'Day 3 (17/Oct/2026)',
      title: 'MUNNAR – TEA GARDENS, ERAVIKULAM NATIONAL PARK & ECHO POINT',
      description: 'After a delicious breakfast, enjoy a full day sightseeing in Munnar. Visit Eravikulam National Park (home of the endangered Nilgiri Tahr), the Tea Museum tracing the entire history of tea production, Mattupetty Dam with scenic boating, Echo Point where your voice echoes across the hills, and Top Station — the highest point in Munnar with breathtaking Western Ghats views. In the evening, stroll through the golden tea gardens at sunset. Overnight stay in Munnar.'
    },
    {
      day: 'Day 4 (18/Oct/2026)',
      title: 'MUNNAR TO THEKKADY – PERIYAR WILDLIFE SANCTUARY (95 KMS / 03 HRS)',
      description: 'After breakfast, check out and drive to Thekkady, home of the famous Periyar Tiger Reserve. On arrival, check-in to resort and proceed for a boat ride on Periyar Lake — a chance to spot elephants, bison, sambar deer, and rare birds along the lakeshore. Later visit a spice plantation to learn about cardamom, pepper, nutmeg, and clove cultivation. In the evening, enjoy a thrilling Kalaripayattu (Kerala martial arts) performance. Overnight stay in Thekkady.'
    },
    {
      day: 'Day 5 (19/Oct/2026)',
      title: 'THEKKADY TO ALLEPPEY – BACKWATERS HOUSEBOAT (145 KMS / 03.5 HRS)',
      description: 'After breakfast, check out and drive to Alleppey — the "Venice of the East." Board your exclusive premium houseboat at 12:00 Noon. Cruise leisurely through the tranquil backwaters of Kerala on the famous Vembanad and Punnamada Lake. Watch village life pass by — paddy fields, coconut groves, coir-making, and local fishermen. Enjoy authentic Kerala lunch, high tea, and dinner served on board. Watch a golden sunset over the backwaters. Overnight stay on the houseboat.'
    },
    {
      day: 'Day 6 (20/Oct/2026)',
      title: 'ALLEPPEY TO KOVALAM BEACH (155 KMS / 04 HRS)',
      description: 'Wake up early to enjoy the misty sunrise over the backwaters. After breakfast on the houseboat, disembark and drive towards Kovalam — one of the most famous beach destinations in India. Enroute, visit the magnificent Padmanabhapuram Palace (the largest wooden palace in Asia, built in Dravidian architecture), and Suchindram Temple. On arrival at Kovalam, check-in to the beachfront resort. Spend the evening relaxing at the crescent-shaped Kovalam Beach or indulge in a traditional Ayurvedic massage. Overnight stay at Kovalam.'
    },
    {
      day: 'Day 7 (21/Oct/2026)',
      title: 'KOVALAM – TRIVANDRUM CITY SIGHTSEEING & BEACH LEISURE',
      description: 'After breakfast, visit Trivandrum (Thiruvananthapuram) city covering Padmanabhaswamy Temple (one of the wealthiest temples in the world), Napier Museum, Natural History Museum, and the Zoo & Botanical Garden. Return to Kovalam by afternoon. Spend the evening at leisure — enjoy optional water sports like parasailing, jet ski, or kayaking at extra cost, or simply relax with fresh tender coconut water watching the lighthouse beam across the Arabian Sea. Overnight stay in Kovalam.'
    },
    {
      day: 'Day 8 (22/Oct/2026)',
      title: 'KOVALAM – TRIVANDRUM AIRPORT – DEPARTURE',
      description: 'After a leisurely breakfast, check out from the hotel and transfer to Trivandrum International Airport for your onward journey. Carry home the beautiful memories of Kerala — the land of coconut trees, backwaters, spices, and warm smiles. We hope you had a wonderful experience with JourneyFlicker and look forward to crafting your next adventure with us!'
    }
  ],
  inclusions: [
    'Accommodation on Double/Twin sharing basis for 07 Nights (05 Rooms).',
    '01 Night Premium AC Deluxe Houseboat in Alleppey (All Meals Included on Houseboat).',
    'Daily Breakfast & Dinner at all hotels (except houseboat where all 3 meals are included).',
    'All transfers and sightseeing by private air-conditioned vehicle (Innova / XUV 500 or similar).',
    'Boat ride at Periyar Lake, Thekkady.',
    'Backwater Houseboat cruise in Alleppey (Check-in 12 Noon / Check-out 09 AM next day).',
    'All toll taxes, parking charges, driver bata, and road permits.',
    'Pick Up & Drop from Cochin Airport / Trivandrum Airport.',
    'All hotel & GST taxes as applicable on accommodation.'
  ],
  exclusions: [
    'Airfare / Train fare (not included). Flight costs quoted separately above.',
    'GST 5% extra applicable on the total tour package bill.',
    'Entrance fees at all sightseeing points and National Parks.',
    'Eravikulam National Park entry fees (subject to availability & seasonal closure).',
    'Kalaripayattu show charges at Thekkady (Rs. 200/- per person approx.).',
    'Water sports activities at Kovalam beach (Parasailing, Jet Ski, Kayaking etc.).',
    'Ayurvedic massage or spa treatments.',
    'Personal expenses — laundry, telephone calls, tips, mineral water, soft & hard drinks.',
    'Any early check-in or late check-out charges at hotels.',
    'Any increase in fuel or accommodation rates prior to travel date.'
  ],
  documentsRequired: [
    'Original Aadhaar Card / Voter ID Card / Passport (mandatory for all travelers).',
    'Photocopies of Photo Identity Proof for all traveling members.',
    '2 Passport size photographs per person.',
    'For children below 5 years: Birth certificate is required.'
  ],
  cancellationPolicy: [
    'Once flight tickets are issued, the applicable airline cancellation penalty will be charged.',
    '50–40 days before departure: 50% of the package cost will be charged.',
    '40–30 days before departure: 60% of the package cost will be charged.',
    '30–21 days before departure: 75% of the package cost will be charged.',
    ' Less than 20 days before departure: 100% of the total package cost will be charged',
    'The cancellation policy is subject to change as per the hotel’s policy.',
    'Any non-refundable services, including hotel bookings, transfers, or other third-party arrangements, will be charged in full as per supplier policy.',

  ],
  importantInfo: [
    'Rates are based on minimum guest count and subject to change if group size changes.',
    'Early check-in or late check-out is subject to room availability and extra charges.',
    'We act as booking agents only and cannot be held liable for mechanical failures or acts of God.',
    'Hotels/Airline will be subject to availability till Reconfirmation.',
    'Given cost is estimated, based on lowest airfare and hotel rates existing as of now. We don’t hold any confirmation for Hotels/Airline. It’s Subject to availability at the time of booking. Any difference in cost shall be borne by passenger.',
    'Room allocation Twin rooms /Double room will be as per the availability at the time of check in',
    'Hotel Check in time 1400hrs, Check out Time 1200hrs (Depend On Hotel Policy)',
    'Charges for extras (Wi‑Fi, minibar, laundry, room service, etc.) and local taxes are charged directly by the hotel.',
    'Certain hotels abroad may ask for a security deposit during check-in, which is refundable at check-out subject to the hotels policy.',
    'The package price does not include special dinner or mandatory charges at time levied by the hotels especially during New Year and Christmas or any special occasions.'
  ],
  visualArchive: [
    'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop'
  ],
  preparedBy: 'Curator Board',
  termsAndConditions: [
    'The itinerary is tentative and subject to change based on local traffic conditions or weather.',
    'Any booking is subject to confirmation only after receiving the advance payment.',
    'All prices are subject to change without prior notice unless booking is fully paid.',
    'Any further increase in airfare due to increase in the fuel price, change in government regulations, taxes, etc., charged by the airline will have to be borne by the passengers. JOURNEYFLICKER will not be held responsible for them.',
    'In case your package needs to be cancelled due to any natural calamity, weather conditions etc. JOURNEYFLICKER shall strive to give you the maximum possible refund subject to the agreement made with our trade partners/vendors',
    'Any increase in the number of passengers may lead to an increase in the total cost of the tour'  
  ]
};

const domesticPolicyTemplates = {
  inclusions: [
    'Accommodation on Double/Twin sharing basis.',
    'Daily Breakfast & Dinner at all hotels / resorts.',
    'All transfers and sightseeing by private air-conditioned vehicle as per itinerary.',
    'AC will be switched off in hill stations / climb routes.',
    'All toll taxes, parking fees, driver allowance, and road permits.',
    'Assistance on arrival and departure transfers.'
  ],
  exclusions: [
    'Airfare / Train fares.',
    'Any personal expenses (laundry, telephone calls, tips, beverages, mineral water).',
    'Entrance tickets, camera permits, and guide charges at sightseeing points.',
    'Meals outside of the pre-booked meal plan.',
    'Extra cost due to landslides, road blocks, natural disasters, or flight delays.',
    'GST 5% extra applicable on total bill.'
  ],
  documentsRequired: [
    'Original Aadhaar Card / Voter ID Card / Passport.',
    'Photocopies of photo identity proof for all traveling members.',
    '2 Passport size photographs per person.'
  ],
  cancellationPolicy: [
    '30 days or more before departure: 25% of total tour cost.',
    '29 to 15 days before departure: 50% of total tour cost.',
    '14 to 7 days before departure: 75% of total tour cost.',
    'Less than 7 days before departure or No Show: 100% of tour cost.'
  ],
  importantInfo: [
    'Rates are based on minimum guest count and subject to change if group size changes.',
    'Early check-in or late check-out is subject to room availability and extra charges.',
    'We act as booking agents only and cannot be held liable for mechanical failures or acts of God.',
    'Hotels/Airline will be subject to availability till Reconfirmation.',
    'Given cost is estimated, based on lowest airfare and hotel rates existing as of now. We don’t hold any confirmation for Hotels/Airline. It’s Subject to availability at the time of booking. Any difference in cost shall be borne by passenger.',
    'Room allocation Twin rooms /Double room will be as per the availability at the time of check in',
    'Hotel Check in time 1400hrs, Check out Time 1200hrs (Depend On Hotel Policy)',
    'Charges for extras (Wi‑Fi, minibar, laundry, room service, etc.) and local taxes are charged directly by the hotel.',
    'Certain hotels abroad may ask for a security deposit during check-in, which is refundable at check-out subject to the hotels policy.',
    'The package price does not include special dinner or mandatory charges at time levied by the hotels especially during New Year and Christmas or any special occasions.'
  ],
  termsAndConditions: [
    'The itinerary is tentative and subject to change based on local traffic conditions or weather.',
    'Any booking is subject to confirmation only after receiving the advance payment.',
    'All prices are subject to change without prior notice unless booking is fully paid.'
  ]
};

const internationalPolicyTemplates = {
  inclusions: [
    'Accommodation in premium category hotels (Double sharing).',
    'Daily buffet breakfast at all hotels (additional meals as per plan).',
    'Private airport arrival & departure transfers.',
    'Coordinated sightseeing activities with local English-speaking guides.',
    'All local transportation, highway tolls, and driver allowances.',
    'Basic travel insurance coverage during the tour.'
  ],
  exclusions: [
    'International & Domestic Airfares & Airport Taxes.',
    'Visa fee / Visa on Arrival charges (if applicable).',
    'Mandatory tips for local guides and drivers (typically $3-$5 USD per person per day).',
    'Personal expenses, laundry, room service, mineral water, and alcoholic drinks.',
    'City Tax / Tourism Tax payable directly at hotels (if applicable).',
    'Any other services not explicitly mentioned under Inclusions.'
  ],
  documentsRequired: [
    'Original Passport with minimum 6 months validity from the travel date.',
    'Approved Visa document (eVisa printout or confirmation).',
    'Confirmed return flight tickets and hotel vouchers.',
    'Travel insurance policy copy.',
    'Declaration forms or health travel passes (as required by host country).'
  ],
  cancellationPolicy: [
    'Flight tickets are subject to actual airline penalties (usually non-refundable).',
    '45 days or more before departure: 30% of total package cost.',
    '44 to 30 days before departure: 60% of total package cost.',
    'Less than 30 days before departure or No Show: 100% of package cost.'
  ],
  importantInfo: [
    'International flight rates are highly volatile and cost will be locked only upon ticketing.',
    'Ensure passport has at least 2 blank pages for entry stamp.',
    'Local currency or USD should be carried for personal transactions and tips.',
    'Check-in and check-out rules apply as per individual country norms.'
  ],
  termsAndConditions: [
    'Visa approval is at the sole discretion of the respective embassy/consulate.',
    'Passport must have at least 6 months validity from the date of travel.',
    'All international flight costs are subject to change until tickets are issued.'
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

  // Heuristic to detect if it's domestic or international
  const isInternational = tour.price?.includes('$') || tour.price?.toLowerCase().includes('usd') ||
    !['gangtok', 'lachung', 'darjeeling', 'sikkim', 'kerala', 'kashmir', 'ladakh', 'goa', 'rajasthan', 'himachal', 'manali', 'shimla', 'uttarakhand', 'agra', 'delhi', 'mumbai', 'india', 'northeast', 'north east'].some(k =>
      tour.region?.toLowerCase().includes(k) || tour.name?.toLowerCase().includes(k)
    );

  const template = isInternational ? internationalPolicyTemplates : domesticPolicyTemplates;

  return {
    title: tour.name.toUpperCase(),
    heroImageUrl: tour.heroImageUrl || 'https://images.unsplash.com/photo-1544016768-982d1554f0b9?q=80&w=1200&auto=format&fit=crop',
    quotationDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/ /g, '-'),
    travelingDate: '',
    destination: tour.region.toUpperCase(),
    clientName: 'Dear Sir,',
    greetingText: 'Greeting From JourneyFlicker..!!',
    messageText: `kindly check below detail of your ${tour.region.toUpperCase()} Tour !!!`,
    options: [{
      optionTitle: `Option : 01(3*) ${String(tour.days - 1).padStart(2, '0')} Night ${String(tour.days).padStart(2, '0')} Days`,
      hotels,
      packageCosts: tour.price ? [{ category: 'Adults', cost: parseInt(tour.price.replace(/\D/g, '')) || 0, pax: 1 }] : [],
      flightCosts: []
    }],
    itinerary,
    inclusions: template.inclusions,
    exclusions: template.exclusions,
    documentsRequired: template.documentsRequired,
    cancellationPolicy: template.cancellationPolicy,
    importantInfo: template.importantInfo,
    visualArchive: tour.visualArchive && tour.visualArchive.length > 0 ? tour.visualArchive : hiteshPreset.visualArchive,
    termsAndConditions: template.termsAndConditions
  };
};

const parseMonthName = (monthStr: string): number => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return months.indexOf(monthStr.toUpperCase());
};

const formatDateToInput = (dateStr?: string): string => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parts[0];
    const monthName = parts[1];
    const year = parts[2];
    const monthIndex = parseMonthName(monthName);
    if (monthIndex !== -1 && year.length === 4) {
      const formattedMonth = String(monthIndex + 1).padStart(2, '0');
      const formattedDay = day.padStart(2, '0');
      return `${year}-${formattedMonth}-${formattedDay}`;
    }
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) { }
  return '';
};

const formatDateToDB = (dateStr?: string): string => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const day = String(d.getDate()).padStart(2, '0');
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  }
  return dateStr;
};
const inputCls = 'w-full px-3 py-2 border border-outline-variant/40 rounded-lg text-sm focus:outline-none focus:border-primary bg-surface-container-low text-on-surface transition-colors';
const labelCls = 'block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.15em] mb-1.5';

export default function AdminQuotation() {
  const [data, setData] = useState<QuotationData>(() => {
    const saved = localStorage.getItem('jf_active_quotation');
    let parsed: QuotationData = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(emptyQuotation));

    if (!parsed.options) {
      parsed.options = [{
        optionTitle: parsed.optionTitle || '',
        hotels: parsed.hotels || [],
        packageCosts: parsed.packageCosts || [],
        flightCosts: parsed.flightCosts || [],
      }];
    }

    if (!parsed.inclusions || parsed.inclusions.length === 0) parsed.inclusions = [...domesticPolicyTemplates.inclusions];
    if (!parsed.exclusions || parsed.exclusions.length === 0) parsed.exclusions = [...domesticPolicyTemplates.exclusions];
    if (!parsed.documentsRequired || parsed.documentsRequired.length === 0) parsed.documentsRequired = [...domesticPolicyTemplates.documentsRequired];
    if (!parsed.cancellationPolicy || parsed.cancellationPolicy.length === 0) parsed.cancellationPolicy = [...domesticPolicyTemplates.cancellationPolicy];
    if (!parsed.importantInfo || parsed.importantInfo.length === 0) parsed.importantInfo = [...domesticPolicyTemplates.importantInfo];
    if (!parsed.termsAndConditions || parsed.termsAndConditions.length === 0) parsed.termsAndConditions = [...domesticPolicyTemplates.termsAndConditions];

    return parsed;
  });

  // Quotation DB States
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [dbQuotations, setDbQuotations] = useState<QuotationRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoadingQuotations, setIsLoadingQuotations] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [isFinal, setIsFinal] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'list'>('editor');

  // Website tours list for loading existing tours
  const [websiteTours, setWebsiteTours] = useState<Tour[]>([]);
  const [selectedTourId, setSelectedTourId] = useState('');
  const [isLoadingTours, setIsLoadingTours] = useState(false);

  // Helpers to add detail inputs
  const [newIncl, setNewIncl] = useState('');
  const [newExcl, setNewExcl] = useState('');
  const [newTerms, setNewTerms] = useState('');
  const [newDoc, setNewDoc] = useState('');
  const [newCancel, setNewCancel] = useState('');
  const [newInfo, setNewInfo] = useState('');
  const [newArchiveUrl, setNewArchiveUrl] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Media selector modal state
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<{
    type: 'heroImageUrl' | 'itineraryDay' | 'visualArchive';
    index?: number;
  } | null>(null);

  const openSelectorFor = (type: 'heroImageUrl' | 'itineraryDay' | 'visualArchive', index?: number) => {
    setMediaTarget({ type, index });
    setIsMediaModalOpen(true);
  };

  const handleMediaSelect = (url: string) => {
    if (!mediaTarget) return;

    if (mediaTarget.type === 'heroImageUrl') {
      upd({ heroImageUrl: url });
    } else if (mediaTarget.type === 'itineraryDay' && mediaTarget.index !== undefined) {
      updateItineraryDay(mediaTarget.index, { imageUrl: url });
    } else if (mediaTarget.type === 'visualArchive') {
      upd({ visualArchive: [...data.visualArchive, url] });
    }

    setIsMediaModalOpen(false);
    setMediaTarget(null);
  };

  useEffect(() => {
    localStorage.setItem('jf_active_quotation', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Please save as draft or download before leaving.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    loadQuotations();
  }, [searchQuery, statusFilter, startDate, endDate]);

  const loadQuotations = async () => {
    setIsLoadingQuotations(true);
    try {
      const res = await api.listQuotations({ search: searchQuery, status: statusFilter, startDate, endDate });
      setDbQuotations(res);
    } catch (err) {
      console.error('Failed to load quotations', err);
    } finally {
      setIsLoadingQuotations(false);
    }
  };

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
        setHasUnsavedChanges(true);
        setSelectedTourId('');
      } catch (err) {
        console.error(err);
        alert('Failed to load tour details.');
      }
    }
  };



  const upd = (patch: Partial<QuotationData>) => {
    setData(prev => ({ ...prev, ...patch }));
    setHasUnsavedChanges(true);
  };

  // Options Manager
  const addOption = () => {
    const num = data.options.length + 1;
    upd({
      options: [...data.options, {
        optionTitle: `Option : 0${num}(3*) 08 Night 09 Days`,
        hotels: [{ destination: '', hotels: '', mealPlan: 'Breakfast & Dinner', nights: '01 Nights', rooms: '05' }],
        packageCosts: [],
        flightCosts: []
      }]
    });
  };
  const removeOption = (optIdx: number) => {
    upd({ options: data.options.filter((_, i) => i !== optIdx) });
  };
  const updateOptionTitle = (optIdx: number, title: string) => {
    upd({ options: data.options.map((opt, i) => i === optIdx ? { ...opt, optionTitle: title } : opt) });
  };

  const addHotelRow = (optIdx: number) => {
    upd({ options: data.options.map((opt, i) => i === optIdx ? { ...opt, hotels: [...opt.hotels, { destination: '', hotels: '', mealPlan: 'Breakfast & Dinner', nights: '01 Nights', rooms: '05' }] } : opt) });
  };
  const removeHotelRow = (optIdx: number, rowIdx: number) => {
    upd({ options: data.options.map((opt, i) => i === optIdx ? { ...opt, hotels: opt.hotels.filter((_, j) => j !== rowIdx) } : opt) });
  };
  const updateHotelRow = (optIdx: number, rowIdx: number, patch: Partial<HotelRow>) => {
    upd({ options: data.options.map((opt, i) => i === optIdx ? { ...opt, hotels: opt.hotels.map((r, j) => j === rowIdx ? { ...r, ...patch } : r) } : opt) });
  };

  const addPackageCost = (optIdx: number, cost: PackageCostItem) => {
    upd({ options: data.options.map((opt, i) => i === optIdx ? { ...opt, packageCosts: [...opt.packageCosts, cost] } : opt) });
  };
  const removePackageCost = (optIdx: number, costIdx: number) => {
    upd({ options: data.options.map((opt, i) => i === optIdx ? { ...opt, packageCosts: opt.packageCosts.filter((_, j) => j !== costIdx) } : opt) });
  };

  const addFlightCost = (optIdx: number, cost: FlightCost) => {
    upd({ options: data.options.map((opt, i) => i === optIdx ? { ...opt, flightCosts: [...opt.flightCosts, cost] } : opt) });
  };
  const removeFlightCost = (optIdx: number, costIdx: number) => {
    upd({ options: data.options.map((opt, i) => i === optIdx ? { ...opt, flightCosts: opt.flightCosts.filter((_, j) => j !== costIdx) } : opt) });
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
      setHasUnsavedChanges(true);
    }
  };

  // Draft/DB Actions
  const handleSaveAsNew = async () => {
    if (!draftName.trim()) {
      alert('Please enter a name for this quotation.');
      return;
    }
    try {
      const payload = {
        name: draftName.trim(),
        status: isFinal ? 'Final' : 'Draft' as any,
        clientName: data.clientName,
        destination: data.destination,
        data
      };
      const res = await api.createQuotation(payload);
      setActiveQuoteId(res.id);
      setHasUnsavedChanges(false);
      alert(`New Quotation "${payload.name}" created successfully.`);
      loadQuotations();
    } catch (err) {
      console.error(err);
      alert('Failed to save quotation as new.');
    }
  };

  const handleUpdateCurrent = async () => {
    if (!activeQuoteId) return;
    if (!draftName.trim()) {
      alert('Please enter a name for this quotation.');
      return;
    }
    try {
      const payload = {
        name: draftName.trim(),
        status: isFinal ? 'Final' : 'Draft' as any,
        clientName: data.clientName,
        destination: data.destination,
        data
      };
      await api.updateQuotation(activeQuoteId, payload);
      setHasUnsavedChanges(false);
      alert(`Quotation "${payload.name}" updated successfully.`);
      loadQuotations();
    } catch (err) {
      console.error(err);
      alert('Failed to update quotation.');
    }
  };

  const handleLoadFromDB = (quote: QuotationRecord) => {
    if (confirm(`Load quotation "${quote.name}"? This will overwrite the current editor content.`)) {
      let parsed = quote.data;
      if (!parsed.options) {
        parsed.options = [{
          optionTitle: parsed.optionTitle || '',
          hotels: parsed.hotels || [],
          packageCosts: parsed.packageCosts || [],
          flightCosts: parsed.flightCosts || [],
        }];
      }
      if (!parsed.termsAndConditions) {
        parsed.termsAndConditions = [];
      }
      setData(parsed);
      setActiveQuoteId(quote.id);
      setDraftName(quote.name);
      setIsFinal(quote.status === 'Final');
      setHasUnsavedChanges(false);
    }
  };

  const handleDeleteFromDB = async (id: string, name: string) => {
    if (confirm(`Delete quotation "${name}" permanently?`)) {
      try {
        await api.deleteQuotation(id);
        if (activeQuoteId === id) {
          setActiveQuoteId(null);
        }
        loadQuotations();
      } catch (err) {
        console.error(err);
        alert('Failed to delete quotation.');
      }
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear the current editor?')) {
      setData(emptyQuotation);
      setActiveQuoteId(null);
      setDraftName('');
      setIsFinal(false);
      setHasUnsavedChanges(false);
    }
  };

  const loadPolicyTemplate = (type: 'domestic' | 'international') => {
    if (confirm(`Replace inclusions, exclusions, documents required, cancellation policy, important guidelines, and terms & conditions with the standard ${type} templates?`)) {
      const template = type === 'domestic' ? domesticPolicyTemplates : internationalPolicyTemplates;
      upd({
        inclusions: template.inclusions,
        exclusions: template.exclusions,
        documentsRequired: template.documentsRequired,
        cancellationPolicy: template.cancellationPolicy,
        importantInfo: template.importantInfo,
        termsAndConditions: template.termsAndConditions
      });
    }
  };

  // Balanced chunking for itinerary days to distribute days evenly and minimize whitespace
  const getBalancedChunks = (array: ItineraryDay[], maxPerChunk: number = 3): ItineraryDay[][] => {
    const total = array.length;
    if (total === 0) return [];
    const numChunks = Math.ceil(total / maxPerChunk);
    const baseSize = Math.floor(total / numChunks);
    const remainder = total % numChunks;

    const chunks: ItineraryDay[][] = [];
    let currentIndex = 0;
    for (let i = 0; i < numChunks; i++) {
      const size = baseSize + (i < remainder ? 1 : 0);
      chunks.push(array.slice(currentIndex, currentIndex + size));
      currentIndex += size;
    }
    return chunks;
  };

  const itineraryChunks = getBalancedChunks(data.itinerary, 3);

  const getQuotationHtmlForData = (data: QuotationData, isWord = false) => {
    const absUrl = (u?: string) => {
      if (!u) return '';
      if (u.startsWith('http') || u.startsWith('data:')) return u;
      return `${window.location.origin}${u.startsWith('/') ? '' : '/'}${u}`;
    };

    return `<!DOCTYPE html>
<html ${isWord ? `xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"` : ''}>
  <head>
    <meta charset="utf-8">
    <title>${data.title} - JourneyFlicker Quotation</title>
    ${isWord ? `<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->` : ''}
    <style>
      head, style { display: none !important; }
      
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
        color: #000; 
        margin: 0; 
        padding: 0; 
        line-height: 1.4; 
      }
      
      .page-container {
        padding: 16px;
        margin: 12px auto;
        max-width: 800px;
        box-sizing: border-box;
        position: relative;
        background: #fff;
      }
      
      .page-container.no-border {
        border: none !important;
        padding: 12px 0px;
      }
      
      .journey-logo {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: inherit;
      }
      .journey-logo-img {
        width: 1.5em;
        height: 1.5em;
        object-fit: contain;
        flex-shrink: 0;
        border-radius: 0.25rem;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .journey-logo-divider {
        width: 1px;
        height: 1.5em;
        background-color: currentColor;
        opacity: 0.6;
      }
      .journey-logo-text {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 300;
        letter-spacing: 0.45em;
        font-size: 0.9em;
        white-space: nowrap;
        line-height: 1;
      }

      .logo { display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 28px; font-weight: 300; text-transform: uppercase; letter-spacing: -1px; margin-bottom: 10px; }
      .logo b { font-weight: 900; }
      .favicon { width: 28px; height: 28px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      h1 { font-size: 36px; font-weight: 300; text-transform: none; margin: 0 0 6px 0; letter-spacing: -2px; line-height: 1.1; font-style: italic; }
      .subtitle { font-size: 11px; font-weight: 800; text-transform: none; letter-spacing: 4px; opacity: 0.6; margin: 0; }
      
      .header-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 2px solid #000;
        padding-bottom: 8px;
        margin-bottom: 12px;
      }
      .header-bar .logo {
        font-size: 18px;
        margin-bottom: 0;
        display: flex;
        align-items: center;
        gap: 6px;
        text-transform: uppercase;
        letter-spacing: -0.5px;
      }
      .header-bar .logo img {
        width: 18px;
        height: 18px;
      }
      .header-info {
        font-size: 9px;
        font-weight: 800;
        text-transform: none;
        letter-spacing: 2px;
        color: #666;
      }
      .sect-title { font-size: 11px; font-weight: 800; text-transform: none; letter-spacing: 2px; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin: 12px 0 8px 0; color: #000; font-style: italic; }
      
      ul { padding-left: 14px; margin: 0; }
      li { margin-bottom: 4px; font-size: 10.5px; color: #333; line-height: 1.35; }
      p { font-size: 11px; color: #333; margin-top: 0; line-height: 1.4; }
      
      .quote-meta { margin-bottom: 10px; font-size: 11px; }
      .meta-item { display: flex; flex-direction: column; }
      .meta-label { font-weight: 800; text-transform: none; font-size: 7.5px; color: #666; letter-spacing: 1px; }
      .meta-val { font-weight: bold; color: #000; font-size: 11px; }
      .greeting { margin-top: 8px; margin-bottom: 10px; }
      .greeting p { margin: 2px 0; font-size: 11px; color: #333; }
      
      .table-title { font-size: 10px; font-weight: bold; text-transform: none; letter-spacing: 1px; color: #000; margin-bottom: 4px; font-style: italic; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10.5px; }
      th { background: #000; color: #fff; text-transform: none; font-size: 8.5px; font-weight: 800; letter-spacing: 1px; padding: 6px 8px; border: 1px solid #000; text-align: center; }
      td { border: 1px solid #ddd; padding: 5px 8px; text-align: left; }
      
      .pricing-section { margin-bottom: 10px; }
      .price-title { font-weight: 800; font-size: 8px; text-transform: none; color: #666; margin-bottom: 3px; letter-spacing: 1px; }
      .price-val { font-size: 14px; font-weight: 900; color: #000; }
      .flights-list { list-style: none; padding: 0; margin: 0; }
      .flights-list li { display: flex; justify-content: space-between; font-size: 10px; border-bottom: 1px dashed #eee; padding: 3px 0; }
      
      .lists-grid { margin-bottom: 10px; }
      
      .gallery-grid { margin-top: 10px; }
      .gallery-img { width: 100%; height: 180px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

      .footer-info {
        border-top: 1px solid #eee;
        padding-top: 7px;
        margin-top: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        font-size: 7.5px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #555;
      }
      .footer-links { display: flex; gap: 15px; margin-top: 3px; flex-wrap: wrap; justify-content: center; }

      @media print {
        @page { 
          size: A4; 
          margin: 8mm; 
        }
        body { 
          margin: 0; 
          padding: 0; 
          background: #fff; 
        }
        .page-container {
          box-sizing: border-box;
          padding: 12px 14px 14px 14px;
          margin: 0 auto;
          background: #fff !important;
        }
        .page-container.no-border {
          padding: 10px 0px;
        }
        .page-break {
          page-break-before: always;
          break-before: page;
        }
      }
      /* screen preview separator */
      @media screen {
        .page-break {
          border-top: 2px dashed #ccc;
          margin-top: 16px;
          padding-top: 16px;
        }
      }
    </style>
  </head>
  <body>
    
    <!-- PAGE 1: COVER PAGE (NO BORDER) -->
    <div class="page-container no-border">
      <div style="text-align: center; margin-top: 20px;">
        <div class="journey-logo" style="justify-content: center; font-size: 24px; margin-bottom: 18px;">
          <img src="${window.location.origin}/favicon.svg" class="journey-logo-img" alt="Logo" />
          <div class="journey-logo-divider"></div>
          <span class="journey-logo-text">JourneyFlicker</span>
        </div>
        ${data.heroImageUrl ? `<img src="${absUrl(data.heroImageUrl)}" class="hero-img" width="800" height="280" style="width: 100%; height: 280px; object-fit: cover; border-radius: 14px; margin-bottom: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact;" />` : ''}
        <h1 style="font-size: 40px; font-weight: 300; text-transform: uppercase; margin: 0 0 6px 0; letter-spacing: -2px; line-height: 1.1; font-style: italic; font-family: Georgia, serif;">${data.title}</h1>
        <p class="subtitle" style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 4px; opacity: 0.6; margin: 0;">${data.destination || ''} &bull; SIGNATURE EXPEDITION</p>
      </div>
    </div>
    
    <!-- PAGE 2: BASIC DETAILS & HOTELS & PRICING -->
    <div class="page-container page-break">
      <div class="header-bar">
        <div class="journey-logo" style="font-size: 16px;">
          <img src="${window.location.origin}/favicon.svg" class="journey-logo-img" alt="Logo" />
          <div class="journey-logo-divider"></div>
          <span class="journey-logo-text">JourneyFlicker</span>
        </div>
        <div class="header-info">Quotation Details</div>
      </div>
      
      <table class="quote-meta" style="width:100%; border-collapse:collapse; background:#f9f9f9; border:1px solid #eee; margin-bottom:10px;" cellpadding="10">
        <tr>
          <td style="border:none; padding:10px; width:25%;">
            <div class="meta-label">Quotation Date</div>
            <div class="meta-val">${data.quotationDate}</div>
          </td>
          <td style="border:none; padding:10px; width:25%;">
            <div class="meta-label">Traveling Date</div>
            <div class="meta-val">${data.travelingDate || '—'}</div>
          </td>
          <td style="border:none; padding:10px; width:25%;">
            <div class="meta-label">Destination</div>
            <div class="meta-val">${data.destination}</div>
          </td>
          <td style="border:none; padding:10px; width:25%;">
            <div class="meta-label">Prepared By</div>
            <div class="meta-val">${data.preparedBy || 'Curator Board'}</div>
          </td>
        </tr>
      </table>
      
      <div class="greeting">
        <p><strong>${data.clientName}</strong></p>
        <p>${data.greetingText}</p>
        <p>${data.messageText}</p>
      </div>
      
      ${data.options.map((opt, optIdx) => `
      <div class="table-title" style="margin-top: ${optIdx > 0 ? '16px' : '0'};">${opt.optionTitle}</div>
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
          ${opt.hotels.map(h => `
            <tr>
              <td>${h.destination || '—'}</td>
              <td>${h.hotels || '—'}</td>
              <td style="text-align:center;">${h.mealPlan || '—'}</td>
              <td style="text-align:center;">${h.nights || '—'}</td>
              <td style="text-align:center;">${h.rooms || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <table class="pricing-section" style="width:100%; border-collapse:collapse; background:#f9f9f9; border:1px solid #eee; margin-bottom:10px;" cellpadding="12">
        ${((opt.packageCosts && opt.packageCosts.length > 0) || (opt.flightCosts && opt.flightCosts.length > 0)) ? `
        <tr>
          <td colspan="2" style="border:none; padding:12px;">
            <div class="price-title" style="margin-bottom:6px;">Total Estimate Breakdown (Option ${optIdx + 1})</div>
            <table style="width:100%; border-collapse:collapse; text-align:center; font-size:10px; border:1px solid #ccc;" cellpadding="6">
              <thead>
                <tr style="background:#eee;">
                  <th style="border:1px solid #ccc; padding:6px; background:#f4f4f4; color:#000; text-align:left;">Category</th>
                  <th style="border:1px solid #ccc; padding:6px; background:#f4f4f4; color:#000;">Package Cost</th>
                  <th style="border:1px solid #ccc; padding:6px; background:#f4f4f4; color:#000;">Flight Cost</th>
                  <th style="border:1px solid #ccc; padding:6px; background:#f4f4f4; color:#000;">Total Estimate</th>
                </tr>
              </thead>
              <tbody>
                ${(opt.packageCosts || []).map(c => {
      const flightCost = opt.flightCosts && opt.flightCosts.length > 0 ? opt.flightCosts[0].cost : 0;
      const totalPerPerson = c.cost + flightCost;
      return `
                  <tr>
                    <td style="border:1px solid #ccc; padding:6px; text-align:left;">${c.category}</td>
                    <td style="border:1px solid #ccc; padding:6px;">Rs. ${c.cost.toLocaleString('en-IN')}/-</td>
                    <td style="border:1px solid #ccc; padding:6px;">Rs. ${flightCost.toLocaleString('en-IN')}/-</td>
                    <td style="border:1px solid #ccc; padding:6px; font-weight:bold; color:#d93025;">Rs. ${totalPerPerson.toLocaleString('en-IN')}/- ${c.pax > 0 ? `x ${String(c.pax).padStart(2, '0')}` : '(Per Person)'}</td>
                  </tr>
                  `;
    }).join('')}
              </tbody>
            </table>
          </td>
        </tr>
        ` : ''}
      </table>
      `).join('')}
    </div>
    
    <!-- ITINERARY: all days in one continuous block, browser breaks naturally -->
    <div class="page-container page-break">
      <div class="header-bar">
        <div class="journey-logo" style="font-size: 16px;">
          <img src="${window.location.origin}/favicon.svg" class="journey-logo-img" alt="Logo" />
          <div class="journey-logo-divider"></div>
          <span class="journey-logo-text">JourneyFlicker</span>
        </div>
        <div class="header-info">Detailed Itinerary</div>
      </div>

      <div class="sect-title" style="margin-top:0;">Day Schedule</div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${data.itinerary.map((day, di) => `
          <div style="display: flex; gap: 14px; page-break-inside: avoid; break-inside: avoid; ${di < data.itinerary.length - 1 ? 'border-bottom: 1px solid #eee; padding-bottom: 12px;' : ''}">
            ${day.imageUrl ? `<img src="${absUrl(day.imageUrl)}" width="120" height="82" style="width: 120px; height: 82px; object-fit: cover; border-radius: 6px; flex-shrink: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact;" />` : ''}
            <div style="flex: 1;">
              <h4 style="font-size: 11.5px; font-weight: 700; margin: 0 0 4px 0; font-style: italic; letter-spacing: 0.3px;">${day.day}: ${day.title}</h4>
              <p style="font-size: 10px; color: #333; margin: 0; line-height: 1.5; text-align: justify;">${day.description}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- PAGE: INCLUSIONS & EXCLUSIONS -->
    <div class="page-container page-break">
      <div class="header-bar">
        <div class="journey-logo" style="font-size: 16px;">
          <img src="${window.location.origin}/favicon.svg" class="journey-logo-img" alt="Logo" />
          <div class="journey-logo-divider"></div>
          <span class="journey-logo-text">JourneyFlicker</span>
        </div>
        <div class="header-info">Terms &amp; Conditions</div>
      </div>
      
      <table class="lists-grid" style="width:100%; border-collapse:collapse; margin-bottom:10px;">
        <tr>
          <td style="border:none; width:50%; vertical-align:top; padding-right:8px;">
            <div class="sect-title" style="margin-top:0;">What's Included</div>
            <ul style="padding-left: 14px; margin: 0;">
              ${data.inclusions.map(i => `<li style="font-size: 10.5px; margin-bottom: 4px; line-height: 1.35;">${i}</li>`).join('')}
            </ul>
            ${data.inclusions.length === 0 ? '<p style="font-size: 11px; font-style: italic; color: #888;">None specified</p>' : ''}
          </td>
          <td style="border:none; width:50%; vertical-align:top; padding-left:8px;">
            <div class="sect-title" style="margin-top:0;">What's Excluded</div>
            <ul style="padding-left: 14px; margin: 0;">
              ${data.exclusions.map(e => `<li style="font-size: 10.5px; margin-bottom: 4px; line-height: 1.35;">${e}</li>`).join('')}
            </ul>
            ${data.exclusions.length === 0 ? '<p style="font-size: 11px; font-style: italic; color: #888;">None specified</p>' : ''}
          </td>
        </tr>
      </table>
      ${data.termsAndConditions && data.termsAndConditions.length > 0 ? `
        <div style="margin-top: 15px;">
          <div class="sect-title" style="margin-top:0;">Terms &amp; Conditions</div>
          <ul style="padding-left: 14px; margin: 0;">
            ${data.termsAndConditions.map(t => `<li style="font-size: 10.5px; margin-bottom: 4px; line-height: 1.35;">${t}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>

    <!-- PAGE: VISUAL ARCHIVE -->
    ${data.visualArchive.length > 0 ? `
      <div class="page-container page-break">
        <div class="header-bar">
          <div class="journey-logo" style="font-size: 16px;">
            <img src="${window.location.origin}/favicon.svg" class="journey-logo-img" alt="Logo" />
            <div class="journey-logo-divider"></div>
            <span class="journey-logo-text">JourneyFlicker</span>
          </div>
          <div class="header-info">Visual Archive</div>
        </div>
        
        <div class="sect-title" style="margin-top:0;">Tour Gallery</div>
        
        <table class="gallery-grid" style="width:100%; border-collapse:collapse; margin-top:10px;">
          ${Array.from({ length: Math.ceil(Math.min(data.visualArchive.length, 6) / 3) }).map((_, rowIndex) => `
            <tr>
              ${data.visualArchive.slice(rowIndex * 3, rowIndex * 3 + 3).map(img => `
                <td style="border:none; padding:5px; width:33.33%; text-align:center;">
                  <img src="${absUrl(img)}" class="gallery-img" width="250" height="180" style="width:100%; height:180px; object-fit:cover; border-radius:6px; border:1px solid #ddd; -webkit-print-color-adjust:exact; print-color-adjust:exact;" />
                </td>
              `).join('')}
            </tr>
          `).join('')}
        </table>
      </div>
    ` : ''}

    <!-- PAGE: POLICIES & GUIDELINES (NO BORDER) -->
    <div class="page-container no-border page-break">
      <div class="header-bar">
        <div class="journey-logo" style="font-size: 16px;">
          <img src="${window.location.origin}/favicon.svg" class="journey-logo-img" alt="Logo" />
          <div class="journey-logo-divider"></div>
          <span class="journey-logo-text">JourneyFlicker</span>
        </div>
        <div class="header-info">Policy &amp; Guidelines</div>
      </div>
      
      <table class="lists-grid" style="width:100%; border-collapse:collapse; margin-bottom:10px;">
        <tr>
          <td style="border:none; width:50%; vertical-align:top; padding-right:8px;">
            <div class="sect-title" style="margin-top:0;">Documents Required</div>
            <ul style="padding-left: 14px; margin: 0;">
              ${data.documentsRequired.map(d => `<li style="font-size: 10.5px; margin-bottom: 4px; line-height: 1.35;">${d}</li>`).join('')}
            </ul>
            ${data.documentsRequired.length === 0 ? '<p style="font-size: 11px; font-style: italic; color: #888;">None specified</p>' : ''}
          </td>
          <td style="border:none; width:50%; vertical-align:top; padding-left:8px;">
            <div class="sect-title" style="margin-top:0;">Cancellation Policy</div>
            <ul style="padding-left: 14px; margin: 0;">
              ${data.cancellationPolicy.map(c => `<li style="font-size: 10.5px; margin-bottom: 4px; line-height: 1.35;">${c}</li>`).join('')}
            </ul>
            ${data.cancellationPolicy.length === 0 ? '<p style="font-size: 11px; font-style: italic; color: #888;">None specified</p>' : ''}
          </td>
        </tr>
      </table>

      ${data.importantInfo.length > 0 ? `
        <div style="margin-top: 10px;">
          <div class="sect-title">Important Guidelines</div>
          <ul style="padding-left: 14px; margin: 0;">
            ${data.importantInfo.map(i => `<li style="font-size: 10.5px; margin-bottom: 4px; line-height: 1.35;">${i}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- COMPLETE FOOTER (NO BORDER) -->
      <div class="complete-footer" style="margin-top: 24px; border-top: 2px solid #000; padding-top: 16px; display: flex; flex-direction: column; align-items: flex-start; text-align: left; width: 100%;">
        <div class="journey-logo" style="font-size: 14px; margin-bottom: 8px;">
          <img src="${window.location.origin}/favicon.svg" class="journey-logo-img" alt="Logo" />
          <div class="journey-logo-divider"></div>
          <span class="journey-logo-text">JourneyFlicker</span>
        </div>
        <h4 style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 7px 0; color: #111;">THE CURATOR BOARD</h4>
        <div style="font-size: 9.5px; line-height: 1.7; color: #333; font-weight: 500;">
          <div><strong>Email:</strong> tushar@journeyflicker.com | pashv@journeyflicker.com</div>
          <div><strong>Phone:</strong> +91 98792 68811 | +91 97266 98987 | 0261 3564717</div>
          <div><strong>Address:</strong> Raj Victoriya, 103, near Samarth Circle, Adajan Gam, Adajan, Surat, Gujarat 395009</div>
        </div>
      </div>
    </div>
    
  </body>
</html>`;
  };

  const getQuotationHtml = (isWord = false) => getQuotationHtmlForData(data, isWord);

  const handlePreviewFromDB = (quote: QuotationRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this website to preview the quotation.');
      return;
    }
    let parsed = quote.data;
    if (!parsed.options) {
      parsed.options = [{
        optionTitle: parsed.optionTitle || '',
        hotels: parsed.hotels || [],
        packageCosts: parsed.packageCosts || [],
        flightCosts: parsed.flightCosts || [],
      }];
    }
    if (!parsed.termsAndConditions) {
      parsed.termsAndConditions = [];
    }
    const htmlContent = getQuotationHtmlForData(parsed, false).replace('</body>', `
    <script>
      window.onload = () => {
        setTimeout(() => { window.print(); window.close(); }, 500);
      };
    </script>
  </body>`);
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handlePrint = () => {
    setHasUnsavedChanges(false);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this website to generate and print the quotation PDF.');
      return;
    }
    const htmlContent = getQuotationHtml(false).replace('</body>', `
    <script>
      window.onload = () => {
        setTimeout(() => { window.print(); window.close(); }, 500);
      };
    </script>
  </body>`);
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };


  return (
    <div className="w-full max-w-7xl mx-auto pb-12 space-y-6">
      <div className="flex items-center gap-4 border-b border-outline-variant/30 pb-4">
        <button
          onClick={() => setViewMode('editor')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'editor' ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-surface-container'}`}
        >
          Quotation Editor
        </button>
        <button
          onClick={() => { setViewMode('list'); loadQuotations(); }}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface hover:bg-surface-container'}`}
        >
          All Quotations Database
        </button>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-surface rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
            <h2 className="text-xl font-black uppercase tracking-wider text-on-surface">Quotations Database</h2>
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={inputCls + " w-auto"}
              />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className={inputCls + " w-auto"}
              >
                <option value="All">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Final">Final</option>
              </select>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className={inputCls + " w-auto"}
                title="Start Date"
              />
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className={inputCls + " w-auto"}
                title="End Date"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-surface-container text-on-surface-variant font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-4 py-3">Quotation Name</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {isLoadingQuotations ? (
                  <tr><td colSpan={6} className="text-center py-8 opacity-50">Loading database...</td></tr>
                ) : dbQuotations.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 opacity-50">No quotations found.</td></tr>
                ) : (
                  dbQuotations.map(q => (
                    <tr key={q.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-on-surface">{q.name}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{q.clientName || '—'}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{q.destination || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-1 rounded font-black uppercase tracking-wider ${q.status === 'Final' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant opacity-80">{new Date(q.updatedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handlePreviewFromDB(q)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-bold transition-colors"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => { handleLoadFromDB(q); setViewMode('editor'); }}
                          className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded font-bold transition-colors"
                        >
                          Load & Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFromDB(q.id, q.name)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded font-bold transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          {/* ── LEFT PANEL: FORMS & CONTROLS ── */}
          <div className="w-full lg:w-1/2 space-y-6">

            {/* Presets & Save */}
            <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Quotation Templates</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => loadPreset(hiteshPreset)}
                    className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-[10px] uppercase font-black tracking-widest shadow-md hover:scale-105 transition-all"
                  >
                    ⚡ Hitesh North East
                  </button>
                  <button
                    onClick={() => loadPreset(keralaPreset)}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl text-[10px] uppercase font-black tracking-widest shadow-md hover:scale-105 transition-all"
                  >
                    🌴 Kerala Demo
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

              <div className="border-t border-outline-variant/20 pt-4 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <input
                    type="text"
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    className={inputCls + " flex-1"}
                    placeholder="Quotation Name (e.g. Kerala July 2026)"
                  />
                  <label className="flex items-center gap-2 text-xs font-bold whitespace-nowrap cursor-pointer">
                    <input type="checkbox" checked={isFinal} onChange={e => setIsFinal(e.target.checked)} className="accent-primary w-4 h-4" />
                    Mark as Final
                  </label>
                </div>
                <div className="flex flex-wrap gap-2 justify-end mt-2">
                  <button
                    onClick={handleSaveAsNew}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-bold whitespace-nowrap hover:opacity-95 transition-opacity"
                  >
                    Save as New Draft
                  </button>
                  {activeQuoteId && (
                    <button
                      onClick={handleUpdateCurrent}
                      className="px-4 py-2 bg-on-surface text-surface dark:bg-white dark:text-black rounded-lg text-xs font-bold whitespace-nowrap hover:opacity-95 transition-opacity"
                    >
                      Update Current Draft
                    </button>
                  )}
                </div>
              </div>

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
                  <label className={labelCls}>Prepared By</label>
                  <input type="text" value={data.preparedBy || ''} onChange={e => upd({ preparedBy: e.target.value })} className={inputCls} placeholder="Curator Board" />
                </div>
                <div>
                  <label className={labelCls}>Quotation Date</label>
                  <input
                    type="date"
                    value={formatDateToInput(data.quotationDate)}
                    onChange={e => upd({ quotationDate: formatDateToDB(e.target.value) })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Traveling Date</label>
                  <input
                    type="date"
                    value={formatDateToInput(data.travelingDate)}
                    onChange={e => upd({ travelingDate: formatDateToDB(e.target.value) })}
                    className={inputCls}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Hero Banner Image URL</label>
                  <div className="flex gap-2">
                    <input type="text" value={data.heroImageUrl || ''} onChange={e => upd({ heroImageUrl: e.target.value })} className={inputCls} placeholder="https://..." />
                    <button
                      type="button"
                      onClick={() => openSelectorFor('heroImageUrl')}
                      className="px-3 py-1 bg-surface-container hover:bg-surface-container-high rounded-xl border border-outline-variant/30 text-xs font-bold flex items-center gap-1 shrink-0 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">photo_library</span>
                      Select
                    </button>
                  </div>
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

            {/* Pricing Options */}
            <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">2. Pricing Options</h3>
                <button onClick={addOption} className="px-3 py-1 bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high text-xs font-bold rounded-lg transition-colors">+ Add Option</button>
              </div>

              <div className="space-y-8">
                {data.options.map((opt, optIdx) => (
                  <div key={optIdx} className="p-4 border border-outline-variant/20 rounded-xl bg-surface-container-lowest space-y-4 relative">
                    {data.options.length > 1 && (
                      <button onClick={() => removeOption(optIdx)} className="absolute right-3 top-3 text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-lg shadow-sm">
                        <span className="material-symbols-outlined text-sm block">delete</span>
                      </button>
                    )}

                    <div>
                      <label className={labelCls}>Option Title</label>
                      <input type="text" value={opt.optionTitle} onChange={e => updateOptionTitle(optIdx, e.target.value)} className={inputCls} placeholder="e.g. Option 1 (3 Star) 08 Nights" />
                    </div>

                    <div className="border-t border-outline-variant/10 pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <label className={labelCls + " !mb-0"}>Hotels Grid</label>
                        <button onClick={() => addHotelRow(optIdx)} className="text-[10px] font-bold text-primary px-2 py-1 bg-primary/10 rounded">+ Row</button>
                      </div>
                      <div className="space-y-3">
                        {opt.hotels.map((row, idx) => (
                          <div key={idx} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 relative">
                            <button onClick={() => removeHotelRow(optIdx, idx)} className="absolute right-2 top-2 text-red-400 hover:text-red-600"><span className="material-symbols-outlined text-sm">close</span></button>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              <div className="col-span-2 sm:col-span-1"><input type="text" value={row.destination} onChange={e => updateHotelRow(optIdx, idx, { destination: e.target.value })} className={inputCls + " !text-xs !py-1.5"} placeholder="Dest" /></div>
                              <div className="col-span-2"><input type="text" value={row.hotels} onChange={e => updateHotelRow(optIdx, idx, { hotels: e.target.value })} className={inputCls + " !text-xs !py-1.5"} placeholder="Hotels" /></div>
                              <div><input type="text" value={row.mealPlan} onChange={e => updateHotelRow(optIdx, idx, { mealPlan: e.target.value })} className={inputCls + " !text-xs !py-1.5"} placeholder="Meals" /></div>
                              <div><input type="text" value={row.nights} onChange={e => updateHotelRow(optIdx, idx, { nights: e.target.value })} className={inputCls + " !text-xs !py-1.5"} placeholder="Nights" /></div>
                              <div><input type="text" value={row.rooms} onChange={e => updateHotelRow(optIdx, idx, { rooms: e.target.value })} className={inputCls + " !text-xs !py-1.5"} placeholder="Rooms" /></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-outline-variant/10 pt-4 grid grid-cols-1 gap-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className={labelCls + " !mb-0"}>Package Costs</label>
                          <button onClick={() => addPackageCost(optIdx, { category: 'Adults', cost: 0, pax: 1 })} className="text-[10px] font-bold text-primary px-2 py-1 bg-primary/10 rounded">+ Cost</button>
                        </div>
                        <div className="space-y-2">
                          {opt.packageCosts.map((c, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input type="text" value={c.category} onChange={e => upd({ options: data.options.map((o, i) => i === optIdx ? { ...o, packageCosts: o.packageCosts.map((pc, j) => j === idx ? { ...pc, category: e.target.value } : pc) } : o) })} className={inputCls.replace('w-full', '') + " !text-xs !py-1 !px-2 flex-1 min-w-[60px]"} placeholder="Cat" />
                              <input type="number" value={c.cost} onChange={e => upd({ options: data.options.map((o, i) => i === optIdx ? { ...o, packageCosts: o.packageCosts.map((pc, j) => j === idx ? { ...pc, cost: Number(e.target.value) } : pc) } : o) })} className={inputCls.replace('w-full', '') + " !text-xs !py-1 !px-2 w-20 shrink-0"} placeholder="Cost" />
                              <input type="number" value={c.pax} onChange={e => upd({ options: data.options.map((o, i) => i === optIdx ? { ...o, packageCosts: o.packageCosts.map((pc, j) => j === idx ? { ...pc, pax: Number(e.target.value) } : pc) } : o) })} className={inputCls.replace('w-full', '') + " !text-xs !py-1 !px-2 w-16 shrink-0"} placeholder="Pax" />
                              <button onClick={() => removePackageCost(optIdx, idx)} className="text-red-400 hover:text-red-600 shrink-0"><span className="material-symbols-outlined text-sm">close</span></button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className={labelCls + " !mb-0"}>Flight Costs</label>
                          <button onClick={() => addFlightCost(optIdx, { city: 'Route', cost: 0, pax: 1 })} className="text-[10px] font-bold text-primary px-2 py-1 bg-primary/10 rounded">+ Flight</button>
                        </div>
                        <div className="space-y-2">
                          {opt.flightCosts.map((c, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input type="text" value={c.city} onChange={e => upd({ options: data.options.map((o, i) => i === optIdx ? { ...o, flightCosts: o.flightCosts.map((fc, j) => j === idx ? { ...fc, city: e.target.value } : fc) } : o) })} className={inputCls.replace('w-full', '') + " !text-xs !py-1 !px-2 flex-1 min-w-[60px]"} placeholder="City" />
                              <input type="number" value={c.cost} onChange={e => upd({ options: data.options.map((o, i) => i === optIdx ? { ...o, flightCosts: o.flightCosts.map((fc, j) => j === idx ? { ...fc, cost: Number(e.target.value) } : fc) } : o) })} className={inputCls.replace('w-full', '') + " !text-xs !py-1 !px-2 w-20 shrink-0"} placeholder="Cost" />
                              <input type="number" value={c.pax} onChange={e => upd({ options: data.options.map((o, i) => i === optIdx ? { ...o, flightCosts: o.flightCosts.map((fc, j) => j === idx ? { ...fc, pax: Number(e.target.value) } : fc) } : o) })} className={inputCls.replace('w-full', '') + " !text-xs !py-1 !px-2 w-16 shrink-0"} placeholder="Pax" />
                              <button onClick={() => removeFlightCost(optIdx, idx)} className="text-red-400 hover:text-red-600 shrink-0"><span className="material-symbols-outlined text-sm">close</span></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
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
                        <div className="flex gap-2">
                          <input type="text" value={day.imageUrl || ''} onChange={e => updateItineraryDay(idx, { imageUrl: e.target.value })} className={inputCls} placeholder="https://..." />
                          <button
                            type="button"
                            onClick={() => openSelectorFor('itineraryDay', idx)}
                            className="px-3 py-1 bg-surface-container hover:bg-surface-container-high rounded-xl border border-outline-variant/30 text-xs font-bold flex items-center gap-1 shrink-0 transition-all"
                          >
                            <span className="material-symbols-outlined text-sm font-bold">photo_library</span>
                            Select
                          </button>
                        </div>
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
                  type="button"
                  onClick={() => openSelectorFor('visualArchive')}
                  className="px-3 py-1 bg-surface-container hover:bg-surface-container-high rounded-xl border border-outline-variant/30 text-xs font-bold flex items-center gap-1 shrink-0 transition-all"
                >
                  <span className="material-symbols-outlined text-sm font-bold">photo_library</span>
                  Select
                </button>
                <button
                  onClick={() => {
                    if (!newArchiveUrl.trim()) return;
                    upd({ visualArchive: [...data.visualArchive, newArchiveUrl.trim()] });
                    setNewArchiveUrl('');
                  }}
                  className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary-hover shadow-lg transition-all"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/10 pb-3">
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">5. Terms & Guidelines Templates</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadPolicyTemplate('domestic')}
                    className="px-2.5 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-400 dark:hover:bg-sky-900/40 rounded-xl text-[9px] uppercase font-black tracking-widest transition-all"
                  >
                    🇮🇳 Domestic Presets
                  </button>
                  <button
                    onClick={() => loadPolicyTemplate('international')}
                    className="px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-900/40 rounded-xl text-[9px] uppercase font-black tracking-widest transition-all"
                  >
                    🌐 International Presets
                  </button>
                </div>
              </div>

              {/* Inclusions */}
              <div>
                <h3 className={labelCls}>Package Inclusions</h3>
                <div className="space-y-2 mb-3">
                  {data.inclusions.map((inc, i) => (
                    <div key={i} className="flex items-start gap-2 bg-surface-container-low p-1.5 rounded-lg border border-outline-variant/10">
                      <textarea
                        value={inc}
                        onChange={e => upd({ inclusions: data.inclusions.map((item, idx) => idx === i ? e.target.value : item) })}
                        className={inputCls + " !text-xs !py-1 !px-2 flex-1 resize-y min-h-[32px]"}
                      />
                      <button onClick={() => upd({ inclusions: data.inclusions.filter((_, idx) => idx !== i) })} className="text-red-400 hover:text-red-600 px-2 text-lg leading-none mt-0.5">×</button>
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
                <div className="space-y-2 mb-3">
                  {data.exclusions.map((ex, i) => (
                    <div key={i} className="flex items-start gap-2 bg-surface-container-low p-1.5 rounded-lg border border-outline-variant/10">
                      <textarea
                        value={ex}
                        onChange={e => upd({ exclusions: data.exclusions.map((item, idx) => idx === i ? e.target.value : item) })}
                        className={inputCls + " !text-xs !py-1 !px-2 flex-1 resize-y min-h-[32px]"}
                      />
                      <button onClick={() => upd({ exclusions: data.exclusions.filter((_, idx) => idx !== i) })} className="text-red-400 hover:text-red-600 px-2 text-lg leading-none mt-0.5">×</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newExcl} onChange={e => setNewExcl(e.target.value)} className={inputCls} placeholder="Add exclusion..." />
                  <button onClick={() => { if (newExcl) { upd({ exclusions: [...data.exclusions, newExcl] }); setNewExcl(''); } }} className="px-3 py-1 bg-surface-container rounded-lg text-xs border border-outline-variant/20">+</button>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="pt-4 border-t border-outline-variant/10">
                <h3 className={labelCls}>Terms & Conditions</h3>
                <div className="space-y-2 mb-3">
                  {(data.termsAndConditions || []).map((term, i) => (
                    <div key={i} className="flex items-start gap-2 bg-surface-container-low p-1.5 rounded-lg border border-outline-variant/10">
                      <textarea
                        value={term}
                        onChange={e => upd({ termsAndConditions: (data.termsAndConditions || []).map((item, idx) => idx === i ? e.target.value : item) })}
                        className={inputCls + " !text-xs !py-1 !px-2 flex-1 resize-y min-h-[32px]"}
                      />
                      <button onClick={() => upd({ termsAndConditions: (data.termsAndConditions || []).filter((_, idx) => idx !== i) })} className="text-red-400 hover:text-red-600 px-2 text-lg leading-none mt-0.5">×</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newTerms} onChange={e => setNewTerms(e.target.value)} className={inputCls} placeholder="Add term or condition..." />
                  <button onClick={() => { if (newTerms) { upd({ termsAndConditions: [...(data.termsAndConditions || []), newTerms] }); setNewTerms(''); } }} className="px-3 py-1 bg-surface-container rounded-lg text-xs border border-outline-variant/20">+</button>
                </div>
              </div>

              {/* Documents */}
              <div className="pt-4 border-t border-outline-variant/10">
                <h3 className={labelCls}>Documents Required</h3>
                <div className="space-y-2 mb-3">
                  {data.documentsRequired.map((doc, i) => (
                    <div key={i} className="flex items-start gap-2 bg-surface-container-low p-1.5 rounded-lg border border-outline-variant/10">
                      <textarea
                        value={doc}
                        onChange={e => upd({ documentsRequired: data.documentsRequired.map((item, idx) => idx === i ? e.target.value : item) })}
                        className={inputCls + " !text-xs !py-1 !px-2 flex-1 resize-y min-h-[32px]"}
                      />
                      <button onClick={() => upd({ documentsRequired: data.documentsRequired.filter((_, idx) => idx !== i) })} className="text-red-400 hover:text-red-600 px-2 text-lg leading-none mt-0.5">×</button>
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
                <div className="space-y-2 mb-3">
                  {data.cancellationPolicy.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 bg-surface-container-low p-1.5 rounded-lg border border-outline-variant/10">
                      <textarea
                        value={c}
                        onChange={e => upd({ cancellationPolicy: data.cancellationPolicy.map((item, idx) => idx === i ? e.target.value : item) })}
                        className={inputCls + " !text-xs !py-1 !px-2 flex-1 resize-y min-h-[32px]"}
                      />
                      <button onClick={() => upd({ cancellationPolicy: data.cancellationPolicy.filter((_, idx) => idx !== i) })} className="text-red-400 hover:text-red-600 px-2 text-lg leading-none mt-0.5">×</button>
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
                <div className="space-y-2 mb-3">
                  {data.importantInfo.map((inf, i) => (
                    <div key={i} className="flex items-start gap-2 bg-surface-container-low p-1.5 rounded-lg border border-outline-variant/10">
                      <textarea
                        value={inf}
                        onChange={e => upd({ importantInfo: data.importantInfo.map((item, idx) => idx === i ? e.target.value : item) })}
                        className={inputCls + " !text-xs !py-1 !px-2 flex-1 resize-y min-h-[32px]"}
                      />
                      <button onClick={() => upd({ importantInfo: data.importantInfo.filter((_, idx) => idx !== i) })} className="text-red-400 hover:text-red-600 px-2 text-lg leading-none mt-0.5">×</button>
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
              <div className="flex gap-3">

                <button
                  onClick={handlePrint}
                  className="px-4 py-3 bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-xl text-xs font-black tracking-widest uppercase flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-sm font-bold">print</span>
                  Print / PDF
                </button>
              </div>
            </div>

            {/* Rendered Live Preview Frame */}
            <div className="bg-gray-100 dark:bg-neutral-900 border border-outline-variant/20 rounded-2xl p-4 max-h-[85vh] overflow-y-auto space-y-6 custom-scrollbar shadow-inner">

              {/* SHEET 1: COVER PAGE (NO BORDER) */}
              <div className="bg-white text-black p-8 rounded shadow-md max-w-[640px] mx-auto min-h-[850px] relative flex flex-col justify-between" style={{ fontSize: '11px' }}>
                <div className="text-center mt-12">
                  <Logo className="justify-center mb-8" textClassName="text-2xl" />
                  {data.heroImageUrl && (
                    <img src={data.heroImageUrl} className="w-full h-80 object-cover rounded-2xl mb-8 shadow-sm" alt="Hero Banner" />
                  )}
                  <h1 className="text-4xl font-light uppercase italic tracking-tighter leading-tight mb-2 font-serif" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>{data.title}</h1>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{data.destination} &bull; SIGNATURE EXPEDITION</p>
                </div>
              </div>

              {/* SHEET 2: DETAILS PAGE */}
              <div className="bg-white text-black p-8 rounded shadow-md border-[3px] border-double border-black max-w-[640px] mx-auto min-h-[850px] relative flex flex-col justify-between" style={{ fontSize: '11px' }}>
                <div>
                  <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
                    <Logo textClassName="text-xl" />
                    <div className="text-[7px] text-right leading-tight text-gray-500 uppercase tracking-widest font-black">
                      Quotation Details
                    </div>
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
                      <div className="font-bold">{data.preparedBy || 'Curator Board'}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="font-black margin-0 text-[11px]">{data.clientName}</p>
                    <p className="margin-0 leading-relaxed text-gray-600">{data.greetingText}</p>
                    <p className="margin-0 leading-relaxed text-gray-600">{data.messageText}</p>
                  </div>

                  {data.options.map((opt, optIdx) => (
                    <div key={optIdx} className="mb-6">
                      <div className="font-black text-[9px] uppercase tracking-widest text-gray-400 mb-2 italic">{opt.optionTitle}</div>
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
                          {opt.hotels.map((h, i) => (
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
                          <ul className="list-none p-0 m-0">
                            {(opt.packageCosts && opt.packageCosts.length > 0) ? opt.packageCosts.map((c, i) => (
                              <li key={i} className="flex justify-between border-b border-gray-100 py-1 text-[10px]">
                                <span>{c.category} (x{c.pax})</span>
                                <strong>Rs. {(c.pax > 0 ? c.cost * c.pax : c.cost).toLocaleString('en-IN')}/- {c.pax === 0 && <span className="text-[9px] font-normal text-gray-400 ml-1">(Per Person)</span>}</strong>
                              </li>
                            )) : (data.perPersonCost ? (
                              <li className="flex justify-between border-b border-gray-100 py-1 text-[10px]">
                                <span>Per Person</span>
                                <strong>{data.perPersonCost}</strong>
                              </li>
                            ) : null)}
                          </ul>
                        </div>
                        {opt.flightCosts && opt.flightCosts.length > 0 && (
                          <div>
                            <div className="text-[7px] font-black uppercase text-gray-400">Additional Flight Costs</div>
                            <ul className="list-none p-0 m-0">
                              {opt.flightCosts.map((f, i) => (
                                <li key={i} className="flex justify-between border-b border-gray-100 py-1 text-[10px]">
                                  <span>{f.city} (x{f.pax})</span>
                                  <strong>Rs. {(f.pax > 0 ? f.cost * f.pax : f.cost).toLocaleString('en-IN')}/- {f.pax === 0 && <span className="text-[9px] font-normal text-gray-400 ml-1">(Per Person)</span>}</strong>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {((opt.packageCosts && opt.packageCosts.length > 0) || (opt.flightCosts && opt.flightCosts.length > 0)) && (
                          <div className="col-span-2 border-t border-dashed border-gray-300 pt-2 mt-1">
                            <div className="text-[7px] font-black uppercase text-gray-400 mb-2">Total Estimate Breakdown (Option {optIdx + 1})</div>
                            <table className="w-full text-[8px] text-center border border-gray-200">
                              <thead className="bg-gray-100 font-bold">
                                <tr>
                                  <th className="border border-gray-200 p-1.5 text-left">Category</th>
                                  <th className="border border-gray-200 p-1.5">Package Cost</th>
                                  <th className="border border-gray-200 p-1.5">Flight Cost</th>
                                  <th className="border border-gray-200 p-1.5">Total Estimate</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(opt.packageCosts || []).map((c, i) => {
                                  const flightCost = opt.flightCosts && opt.flightCosts.length > 0 ? opt.flightCosts[0].cost : 0;
                                  const totalPerPerson = c.cost + flightCost;
                                  return (
                                    <tr key={i}>
                                      <td className="border border-gray-200 p-1.5 text-left font-bold">{c.category}</td>
                                      <td className="border border-gray-200 p-1.5">Rs. {c.cost.toLocaleString('en-IN')}/-</td>
                                      <td className="border border-gray-200 p-1.5">Rs. {flightCost.toLocaleString('en-IN')}/-</td>
                                      <td className="border border-gray-200 p-1.5 font-bold text-red-600">Rs. {totalPerPerson.toLocaleString('en-IN')}/- {c.pax > 0 ? `x ${String(c.pax).padStart(2, '0')}` : '(Per Person)'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-2 flex flex-col items-center text-[7px] text-gray-500 font-bold uppercase tracking-widest text-center mt-auto">
                  <div>103 | Raj Victoriya, Near Samarth Circle, Adajan, Surat, Gujarat 395009</div>
                  <div className="flex gap-4 mt-1">
                    <span>tushar@journeyflicker.com | pashv@journeyflicker.com</span>
                    <span>+91 98792 68811 | +91 97266 98987 | 0261 3564717</span>
                  </div>
                </div>
              </div>

              {/* SHEET 3+: ITINERARY PAGES */}
              {itineraryChunks.map((chunk, index) => (
                <div key={index} className="bg-white text-black p-8 rounded shadow-md border-[3px] border-double border-black max-w-[640px] mx-auto min-h-[850px] relative flex flex-col justify-between" style={{ fontSize: '11px' }}>
                  <div>
                    <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
                      <Logo textClassName="text-xl" />
                      <div className="text-[7px] text-right leading-tight text-gray-500 uppercase tracking-widest font-black">
                        Detailed Itinerary - Page {index + 1}
                      </div>
                    </div>

                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b pb-1 font-serif italic">Detailed Day Schedule</div>

                    <div className="space-y-6">
                      {chunk.map((day, i) => (
                        <div key={i} className={`pb-6 ${i === chunk.length - 1 ? '' : 'border-b border-gray-100'}`}>
                          <div className="flex gap-5 items-start">
                            {day.imageUrl && <img src={day.imageUrl} className="w-36 h-24 object-cover rounded-lg border border-gray-200 shrink-0" alt="" />}
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-sm text-black italic tracking-wide">{day.day}: {day.title || 'Day Schedule details'}</div>
                              <p className="text-xs text-gray-700 leading-relaxed mt-1.5 text-justify">{day.description || 'Provide day activities...'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-2 flex flex-col items-center text-[7px] text-gray-500 font-bold uppercase tracking-widest text-center mt-auto">
                    <div>103 | Raj Victoriya, Near Samarth Circle, Adajan, Surat, Gujarat 395009</div>
                    <div className="flex gap-4 mt-1">
                      <span>tushar@journeyflicker.com | pashv@journeyflicker.com</span>
                      <span>+91 98792 68811 | +91 97266 98987 | 0261 3564717</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* SHEET 4: TERMS & CONDITIONS (INCLUSIONS/EXCLUSIONS) */}
              <div className="bg-white text-black p-8 rounded shadow-md border-[3px] border-double border-black max-w-[640px] mx-auto min-h-[850px] relative flex flex-col justify-between" style={{ fontSize: '11px' }}>
                <div>
                  <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
                    <Logo textClassName="text-xl" />
                    <div className="text-[7px] text-right leading-tight text-gray-500 uppercase tracking-widest font-black">
                      Terms & Conditions
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
                  {data.termsAndConditions && data.termsAndConditions.length > 0 && (
                    <div className="mt-4">
                      <div className="text-[10px] font-black text-black border-b pb-1 mb-2 italic">Terms & Conditions</div>
                      <ul className="pl-4 m-0 space-y-1 list-disc text-[10px] text-gray-600">
                        {data.termsAndConditions.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-2 flex flex-col items-center text-[7px] text-gray-500 font-bold uppercase tracking-widest text-center mt-auto">
                  <div>103 | Raj Victoriya, Near Samarth Circle, Adajan, Surat, Gujarat 395009</div>
                  <div className="flex gap-4 mt-1">
                    <span>tushar@journeyflicker.com | pashv@journeyflicker.com</span>
                    <span>+91 98792 68811 | +91 97266 98987 | 0261 3564717</span>
                  </div>
                </div>
              </div>

              {/* SHEET 5: VISUAL ARCHIVE GALLERY */}
              {data.visualArchive.length > 0 && (
                <div className="bg-white text-black p-8 rounded shadow-md border-[3px] border-double border-black max-w-[640px] mx-auto min-h-[850px] relative flex flex-col justify-between" style={{ fontSize: '11px' }}>
                  <div>
                    <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
                      <Logo textClassName="text-xl" />
                      <div className="text-[7px] text-right leading-tight text-gray-500 uppercase tracking-widest font-black">
                        Visual Archive
                      </div>
                    </div>

                    <div className="text-[10px] font-black text-black border-b pb-1 mb-3 italic">Tour Gallery</div>
                    <div className="grid grid-cols-3 gap-3">
                      {data.visualArchive.slice(0, 6).map((url, i) => (
                        <img key={i} src={url} className="w-full h-28 object-cover rounded-lg border border-gray-200" alt="Gallery item" />
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-2 flex flex-col items-center text-[7px] text-gray-500 font-bold uppercase tracking-widest text-center mt-auto">
                    <div>103 | Raj Victoriya, Near Samarth Circle, Adajan, Surat, Gujarat 395009</div>
                    <div className="flex gap-4 mt-1">
                      <span>tushar@journeyflicker.com | pashv@journeyflicker.com</span>
                      <span>+91 98792 68811 | +91 97266 98987 | 0261 3564717</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SHEET 6: POLICIES & GUIDELINES (NO BORDER) */}
              <div className="bg-white text-black p-8 rounded shadow-md max-w-[640px] mx-auto min-h-[850px] relative flex flex-col justify-between" style={{ fontSize: '11px' }}>
                <div>
                  <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
                    <Logo textClassName="text-xl" />
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

                {/* COMPLETE FOOTER (NO BORDER) */}
                <div className="complete-footer mt-10 pt-6 border-t-2 border-black flex flex-col items-start text-left w-full">
                  <Logo className="mb-3" textClassName="text-lg" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-black mb-2">THE CURATOR BOARD</h4>
                  <div className="text-[9px] leading-relaxed text-gray-600 font-medium space-y-0.5">
                    <div><strong>Email:</strong> tushar@journeyflicker.com | pashv@journeyflicker.com</div>
                    <div><strong>Phone:</strong> +91 98792 68811 | +91 97266 98987 | 0261 3564717</div>
                    <div><strong>Address:</strong> Raj Victoriya, 103, near Samarth Circle, Adajan Gam, Adajan, Surat, Gujarat 395009</div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
      <MediaSelectorModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
