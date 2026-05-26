const BOT_USER_AGENTS = [
  'twitterbot',
  'facebookexternalhit',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'slackbot',
  'discordbot',
  'vkshare',
  'googlebot',
  'bingbot'
];

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API endpoints)
     * - uploads (static images)
     * - assets (CSS, JS, fonts)
     * - static files with extensions (e.g. favicon.ico, manifest.json)
     */
    '/((?!api|uploads|assets|favicon|.*\\..*).*)',
  ],
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();

  // Check if User-Agent indicates a search engine or social sharing crawler
  const isBot = BOT_USER_AGENTS.some(bot => userAgent.includes(bot));

  if (isBot) {
    const path = url.pathname;
    
    // Default fallback SEO metadata
    let title = "JourneyFlicker | Curated Discovery";
    let desc = "JourneyFlicker is a luxury travel-agency web app offering curated expeditions, destinations, and visa intelligence.";
    let image = "https://journeyflicker.vercel.app/apple-touch-icon.png";
    const backendHost = "https://journeyflicker-backend.vercel.app";

    try {
      // 1. Dynamic Tour Pages
      if (path.startsWith('/tours/')) {
        const tourId = path.split('/tours/')[1];
        if (tourId) {
          const res = await fetch(`${backendHost}/api/tours/${tourId}`);
          if (res.ok) {
            const tour = await res.json();
            title = `${tour.name} — Curated Expeditions`;
            desc = tour.overviewDescription || tour.overviewExtended || desc;
            image = tour.heroImageUrl || image;
          }
        }
      }
      // 2. Dynamic Destination Pages
      else if (path.startsWith('/destinations/')) {
        const destId = path.split('/destinations/')[1];
        if (destId) {
          const res = await fetch(`${backendHost}/api/destinations/${destId}`);
          if (res.ok) {
            const dest = await res.json();
            title = `${dest.name} — Luxury Destinations`;
            desc = dest.description || dest.essenceText || desc;
            image = dest.heroImageUrl || image;
          }
        }
      }
      // 3. Static Editorial Pages (SEO settings from database)
      else {
        const res = await fetch(`${backendHost}/api/seo-settings`);
        if (res.ok) {
          const seoPages = await res.json();
          const matchedPage = seoPages.find(p => p.path === path);
          if (matchedPage) {
            title = matchedPage.title || title;
            desc = matchedPage.desc || desc;
            image = matchedPage.ogImage || image;
          }
        }
      }
    } catch (err) {
      console.error("[SEO Edge Middleware Error]", err);
    }

    // Serve HTML with Open Graph & Twitter meta tags directly to the bot
    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url.href}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${image}" />
</head>
<body>
  <h1>${title}</h1>
  <p>${desc}</p>
</body>
</html>`,
      {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      }
    );
  }

  // Real visitor: returning nothing lets Vercel continue rendering Vite's index.html
  return;
}
