import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import { api, SeoPage } from '../lib/api';

type SEOProps = {
  pageId?: string; // 'home', 'about', 'tours', 'destinations'
  title?: string;
  description?: string;
  image?: string;
};

export function SEO({ pageId, title, description, image }: SEOProps) {
  const [seoSettings, setSeoSettings] = useState<SeoPage | null>(null);

  useEffect(() => {
    if (pageId) {
      api.getSeoSettings().then(data => {
        const found = data.find(p => p.id === pageId);
        if (found) setSeoSettings(found);
      }).catch(console.error);
    }
  }, [pageId]);

  const finalTitle = title || seoSettings?.title || 'JourneyFlicker | Curated Discovery';
  const finalDescription = description || seoSettings?.desc || 'Discover the world\'s most breathtaking destinations with JourneyFlicker.';
  const finalImage = image || seoSettings?.ogImage || 'https://journeyflicker.vercel.app/og-default.jpg';

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
    </Helmet>
  );
}
