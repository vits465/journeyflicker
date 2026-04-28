async function addTour() {
  const adminCreds = { username: "Fliker", password: "JourneyFliker0465" };
  
  try {
    // 1. Login
    const loginRes = await fetch("http://localhost:5174/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminCreds)
    });
    const { token } = await loginRes.json();
    console.log("Logged in, token received.");

    const tourData = {
      name: "Japan Discovery: 12 Days of Heritage & Innovation",
      region: "Japan",
      days: 12,
      price: "$3,595",
      category: "Signature Expedition",
      rating: 4.9,
      heroImageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070",
      overviewDescription: "A comprehensive 12-day journey through Japan's most iconic cities. From the bustling streets of Osaka and Tokyo to the serene temples of Kyoto and the historical gardens of Kanazawa.",
      overviewExtended: "This expedition blends the high-speed thrill of the Shinkansen with the quiet contemplation of ancient shrines. Explore the 'Kitchen of Japan' in Osaka, the spiritual heart of Kyoto, and the natural majesty of Mt. Fuji and Hakone.",
      transport: "Shinkansen (Bullet Train), Private Transfers, Local Transit",
      guide: "Professional English-speaking local guides",
      pickup: "Osaka Kansai International Airport (KIX)",
      itinerary: [
        { title: "Arrive in Osaka", description: "Meet your driver at KIX and transfer to your hotel. Free evening to explore the vibrant Namba district.", accommodation: "Grids Premium / Hotel Monterey Grasmere", meals: "Room Only" },
        { title: "Osaka Walking Discovery", description: "Visit Osaka Castle, Tsuruhashi, and the neon-lit Dotonbori. Experience the city's famous street food culture.", schedule: "09:00 City Walk | 14:00 Castle Visit", meals: "Breakfast" },
        { title: "Mount Koya Spiritual Trail", description: "Full day tour to the sacred Mount Koya, visiting Kongobuji Temple and the Danjō-garan Buddhist complex.", meals: "Breakfast, Japanese Lunch" },
        { title: "Bullet Train to Kyoto", description: "Experience the Shinkansen as you move from Osaka to Kyoto. Check-in and enjoy a free afternoon in the Gion district.", meals: "Breakfast" },
        { title: "Kyoto Temple Mastery", description: "A deep dive into Kyoto's heritage: Kiyomizu Dera, Arashiyama Bamboo Grove, and the Fushimi Inari Shrine.", schedule: "All-day Temple Circuit", meals: "Breakfast" }
      ],
      sightseeing: [
        { title: "Mt. Fuji & Hakone", description: "Ascend to the 5th Station for panoramic views, followed by an Ashi Lake cruise.", icon: "landscape" },
        { title: "Bullet Train (Shinkansen)", description: "Travel between cities at 320km/h in total comfort.", icon: "train" },
        { title: "Nikko Heritage", description: "Explore the Toshogu Shrine and the breathtaking Kegon Falls.", icon: "castle" }
      ]
    };

    // 2. Add Tour
    const res = await fetch("http://localhost:5174/api/tours", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(tourData)
    });
    const data = await res.json();
    console.log("Tour added successfully:", data.id);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

addTour();
