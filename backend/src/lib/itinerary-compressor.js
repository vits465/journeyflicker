// ── Utility to generate a valid ID ───────────────────────────────────────────
function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Smart Algorithmic Day Merging ──────────────────────────────────────────
export function compressItineraryAlgorithmic(originalTour, targetDays) {
  const originalDays = originalTour.itinerary || [];
  const N = originalDays.length;

  if (N === 0) {
    throw new Error("The selected tour has an empty itinerary.");
  }

  let compressedItinerary = [];

  if (N <= targetDays) {
    // No compression needed, just clone and adjust day titles
    compressedItinerary = originalDays.map((d, index) => {
      const cleanTitle = d.title.replace(/^Day \d+\s*:\s*/i, "");
      return {
        ...d,
        title: `Day ${index + 1}: ${cleanTitle}`
      };
    });
  } else {
    // Compress first N-1 days into targetDays - 1 days, and preserve the final day.
    const activityDays = originalDays.slice(0, N - 1);
    const lastDay = originalDays[N - 1];
    const targetActivityDays = targetDays - 1;

    // Group first N-1 days into targetActivityDays buckets
    const buckets = [];
    const baseSize = Math.floor(activityDays.length / targetActivityDays);
    const extra = activityDays.length % targetActivityDays;
    
    let dayIndex = 0;
    for (let i = 0; i < targetActivityDays; i++) {
      const blockSize = baseSize + (i < extra ? 1 : 0);
      const blockDays = activityDays.slice(dayIndex, dayIndex + blockSize);
      dayIndex += blockSize;
      buckets.push(blockDays);
    }

    // Merge the buckets for activity days
    compressedItinerary = buckets.map((block, index) => {
      const dayNum = index + 1;
      if (block.length === 1) {
        const d = block[0];
        const cleanTitle = d.title.replace(/^Day \d+\s*:\s*/i, "");
        return {
          title: `Day ${dayNum}: ${cleanTitle}`,
          description: d.description || "",
          imageUrl: d.imageUrl || originalTour.heroImageUrl || "",
          schedule: d.schedule || "",
          accommodation: d.accommodation || "N/A",
          meals: d.meals || ""
        };
      }

      // Merge multiple days
      const titles = block.map(d => d.title.replace(/^Day \d+\s*:\s*/i, "")).filter(Boolean);
      const descriptions = block.map(d => d.description).filter(Boolean);
      const schedules = block.map(d => d.schedule).filter(Boolean);
      const accommodations = block.map(d => d.accommodation).filter(a => a && a !== "N/A" && a.toLowerCase() !== "none");
      const meals = block.map(d => d.meals).filter(Boolean);

      // Pick first valid image URL in the block
      const validImage = block.find(d => d.imageUrl)?.imageUrl || originalTour.heroImageUrl || "";

      return {
        title: `Day ${dayNum}: ${titles.slice(0, 2).join(" & ")}${titles.length > 2 ? " & Highlights" : ""}`,
        description: descriptions.join(" "),
        imageUrl: validImage,
        schedule: schedules.join(" · "),
        accommodation: accommodations[accommodations.length - 1] || "N/A", // final day's hotel
        meals: meals.join(" · ")
      };
    });

    // Compulsorily append the original departure day as the last day
    const cleanLastTitle = lastDay.title.replace(/^Day \d+\s*:\s*/i, "");
    compressedItinerary.push({
      title: `Day ${targetDays}: ${cleanLastTitle}`,
      description: lastDay.description || "",
      imageUrl: lastDay.imageUrl || originalTour.heroImageUrl || "",
      schedule: lastDay.schedule || "",
      accommodation: lastDay.accommodation || "N/A",
      meals: lastDay.meals || ""
    });
  }

  // Scale the price elegantly
  let newPrice = originalTour.price;
  const numericPrice = parseInt(originalTour.price.replace(/[^0-9]/g, ""), 10);
  if (!isNaN(numericPrice)) {
    const ratio = targetDays / N;
    // Overhead baseline multiplier (short trips have higher per-day costs)
    const adjustedRatio = Math.max(0.6, ratio * 1.15); 
    const newNumericPrice = Math.round((numericPrice * adjustedRatio) / 50) * 50; // round to nearest $50
    newPrice = `$${newNumericPrice.toLocaleString()}`;
  }

  // Pick top sightseeing highlights that fit in
  const originalSightseeing = originalTour.sightseeing || [];
  const compressedSightseeing = originalSightseeing.slice(0, Math.min(originalSightseeing.length, targetDays + 1));

  // Construct short tour object
  const shortTour = {
    id: newId("tour"),
    name: `${originalTour.name} (Express Edition)`,
    region: originalTour.region,
    days: targetDays,
    price: newPrice,
    category: `${originalTour.category || "Signature"} Express`,
    rating: originalTour.rating || 5,
    heroImageUrl: originalTour.heroImageUrl,
    overviewDescription: `A perfectly condensed ${targetDays}-day luxury escape. ${originalTour.overviewDescription}`,
    overviewExtended: `Designed for discerning travelers demanding high impact in limited time, this curated itinerary delivers the absolute pinnacle of our standard tour. Enjoy private first-class comfort, exquisite dining, and premium lodging on a seamless ${targetDays}-day adventure.`,
    transport: originalTour.transport,
    guide: originalTour.guide,
    pickup: originalTour.pickup,
    itinerary: compressedItinerary,
    sightseeing: compressedSightseeing,
    visualArchive: originalTour.visualArchive || [],
    testimonials: (originalTour.testimonials || []).slice(0, 2),
    departureWindows: originalTour.departureWindows || [],
    maxGuests: Math.max(2, originalTour.maxGuests - 2 || 6),
    published: true,
    createdAt: Date.now()
  };

  return shortTour;
}

// ── Gemini AI Premium Curation ──────────────────────────────────────────
export async function compressItineraryAI(originalTour, targetDays, apiKey) {
  const systemPrompt = `
You are an expert luxury travel copywriter and elite travel curator for JourneyFlicker.
Your task is to take an existing high-end travel itinerary and compress/curate it into a perfect, brand-new ${targetDays}-day "Express Edition" itinerary.

Original Tour Data:
${JSON.stringify(originalTour, null, 2)}

Requirements for the new ${targetDays}-day tour:
1. Duration ("days"): Must be exactly ${targetDays}.
2. Name ("name"): Create a premium, gorgeous name (e.g., "${originalTour.name} Escape", "${originalTour.name} Highlights" or "${originalTour.name} Express").
3. Overview Description ("overviewDescription") & Extended Overview ("overviewExtended"): Rewrite these to sound like a cohesive, fully realized luxury ${targetDays}-day experience. Do NOT mention that it was "shortened", "compressed", or "slashed" from a longer tour. Make it sound like it was designed from the ground up as a perfect, premium ${targetDays}-day odyssey.
4. Price ("price"): Scale the price beautifully. Calculate it as a premium ${targetDays}-day rate (around 60-70% of the original, rounded to the nearest $50). Format it with a dollar sign and comma separator (e.g., if original is $3,450, new could be $2,250).
5. Itinerary Array ("itinerary"): Create exactly ${targetDays} daily entries. Combine days logically (e.g. merging arrival and local highlights, or combining peak adventure and scenic transfers) so that the signature highlights are elegantly included but the pace remains relaxed and opulent.
   - Compulsory Departure Preservation: The very last day of the new compressed itinerary (Day ${targetDays}) MUST be derived exactly from the last day of the original itinerary (the departure/checkout day). All activity compression and day-merging must happen for the days preceding it. Do not merge the original last day (departure) into standard activity days.
   For each day, provide:
   - "title": A beautiful, evocative title (e.g., "Day 1: Arrival & Alpine Sunset Cruise")
   - "description": A stunning, evocative luxury travel description of the experiences (2-3 sentences in premium travel brochure style).
   - "imageUrl": Select the most appropriate image URL from the original itinerary or visual archive.
   - "schedule": A premium daily timeline (e.g., "09:00 Arrival - 14:00 Scenic Check-in - 18:00 Sunset Sail").
   - "accommodation": Name of a luxury hotel (use the original hotels or logical high-end options).
   - "meals": Specified premium meals (e.g., "Breakfast - Scenic Lakefront Dinner").
6. Sightseeing ("sightseeing"): Select the top 3-4 most iconic sightseeing highlights from the original list that are featured in this new ${targetDays}-day version. Preserve their structure exactly.
7. Output format: You must return ONLY a single, valid JSON object matching the Tour schema. Do not wrap in markdown \`\`\`json code blocks. No explanations, no introductory text, no suffix. Return raw JSON only.
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API Error (HTTP ${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!replyText) {
    throw new Error("Received empty response from Gemini API.");
  }

  // Parse the JSON
  let parsedTour = JSON.parse(replyText.trim());

  // Explicitly delete database identifiers to prevent duplicate key errors in MongoDB
  delete parsedTour._id;

  // Clean up or inject properties if missing
  parsedTour.id = newId("tour");
  parsedTour.createdAt = Date.now();
  parsedTour.published = true;
  
  // Ensure sightseeing matches structural requirements
  if (parsedTour.sightseeing) {
    parsedTour.sightseeing = parsedTour.sightseeing.map(item => ({
      title: item.title || "",
      description: item.description || "",
      icon: item.icon || "explore",
      imageUrl: item.imageUrl || ""
    }));
  }

  return parsedTour;
}
