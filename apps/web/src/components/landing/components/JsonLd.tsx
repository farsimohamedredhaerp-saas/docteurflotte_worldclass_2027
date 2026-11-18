// apps/web/src/components/landing/components/JsonLd.tsx
import React from 'react';
import { FAQ } from '../constants';

export function JsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'DocteurFlotte',
        url: 'https://docteurflotte.dz',
        logo: 'https://docteurflotte.dz/icon.png',
        description:
          'Plateforme souveraine de télémétrie, IoT multi-métiers et maintenance prescriptive 5.0 pour flottes industrielles en Algérie.',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'DZ',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'technical support',
          availableLanguage: ['French', 'Arabic'],
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'DocteurFlotte',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web, Progressive Web App (PWA)',
        offers: {
          '@type': 'Offer',
          priceCurrency: 'DZD',
          price: '1500',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            priceCurrency: 'DZD',
            unitText: 'VEHICLE_MONTH',
          },
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '48',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map((item) => ({
          '@type': 'Question',
          name: item.qFr,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.aFr,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

