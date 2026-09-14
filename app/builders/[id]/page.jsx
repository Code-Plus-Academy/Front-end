import React from 'react';
import { BuilderDetail } from '../../../src/views/Static';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';
import initialBuildersData from '../../../src/data/builders.json';

export async function generateMetadata({ params }) {
  const { id } = params;
  const builder = (initialBuildersData || []).find(
    (b) => String(b.id).toLowerCase() === String(id).toLowerCase()
  );

  if (!builder) {
    return {
      title: 'Builder Profile | FocusGram',
      description: 'Meet the engineering and founding team behind FocusGram.',
    };
  }

  return {
    title: `${builder.name} — ${builder.role} | FocusGram`,
    description: builder.bio || `Meet ${builder.name}, ${builder.role} at FocusGram.`,
    alternates: {
      canonical: `/builders/${builder.id}`,
    },
    openGraph: {
      title: `${builder.name} — ${builder.role}`,
      description: builder.bio,
      url: `/builders/${builder.id}`,
      images: builder.avatar ? [builder.avatar] : [],
    }
  };
}

export default function Page() {
  return (
    <AppLayout noPadding>
      <BuilderDetail />
    </AppLayout>
  );
}
