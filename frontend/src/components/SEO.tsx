import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

type SEOProps = {
  pageId?: string; // 'home', 'about', 'tours', 'destinations', 'visas', 'contact', 'faq'
  title?: string;
  description?: string;
  image?: string;
  canonicalUrl?: string;
  schema?: Record<string, any> | Record<string, any>[] | null;
  noindex?: boolean;
};

export function SEO({ 
  pageId, 
  title, 
  description, 
  image, 
  canonicalUrl, 
  schema, 
  noindex = false 
}: SEOProps) {
  const { data: seoSettings } = useQuery({
    queryKey: ['seo', pageId],
    queryFn: async () => {
      if (!pageId) return null;
      const data = await api.getSeoSettings();
      return data.find(p => p.id === pageId) || null;
    },
    enabled: !!pageId,
  });

  const finalTitle = title || seoSettings?.title || 'JourneyFlicker | Curated Discovery';
  const finalDescription = description || seoSettings?.desc || 'Discover the world\'s most breathtaking destinations with JourneyFlicker.';
  const finalImage = image || seoSettings?.ogImage || 'https://journeyflicker.com/favicon-96x96.png';

  // Programmatically resolve absolute canonical URL
  const defaultCanonical = typeof window !== 'undefined' 
    ? window.location.origin + window.location.pathname.replace(/\/$/, '') 
    : 'https://journeyflicker.com';
  const finalCanonical = canonicalUrl || defaultCanonical;

  return (
    <Helmet>
      {/* Search Engine Essentials */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={finalCanonical} />

      {/* Robots Directive */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph (Facebook / LinkedIn) */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={finalCanonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="JourneyFlicker" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />

      {/* JSON-LD Structured Data Schema */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}

