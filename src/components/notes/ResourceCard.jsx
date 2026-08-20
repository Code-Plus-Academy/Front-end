'use client';

import React from 'react';
import NoteCard from './NoteCard';

export default function ResourceCard({ resource, note, ...props }) {
  return <NoteCard note={resource || note} {...props} />;
}
