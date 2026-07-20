'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const POPULAR_UNIVERSITIES = [
  'Savitribai Phule Pune University (SPPU)',
  'Delhi University (DU)',
  'Mumbai University (MU)',
  'Visvesvaraya Technological University (VTU)',
  'JNTU Hyderabad',
  'Anna University',
  'Gujarat Technological University (GTU)',
  'Maharshi Dayanand University (MDU)',
  'Dr. A.P.J. Abdul Kalam Technical University (AKTU)',
];

export default function AddCollegeForm({ action }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [location, setLocation] = useState('');
  const [existingColleges, setExistingColleges] = useState([]);

  useEffect(() => {
    fetch('/api/notes/autosuggest/college')
      .then(r => r.json())
      .then(data => {
        if (data && data.colleges) {
          setExistingColleges(data.colleges);
        }
      })
      .catch(() => {});
  }, []);

  // Deduplication suggestions
  const getCollegeSuggestions = () => {
    if (!name || name.trim().length < 2) return [];
    const q = name.toLowerCase().trim();
    return existingColleges.filter(c => c.name.toLowerCase().includes(q)).slice(0, 3);
  };

  const getUniversitySuggestions = () => {
    if (!university || university.trim().length < 2) return [];
    const q = university.toLowerCase().trim();
    return POPULAR_UNIVERSITIES.filter(u => u.toLowerCase().includes(q)).slice(0, 3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);

    try {
      const result = await action(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Request submitted successfully!');
        router.push('/notes/colleges');
      }
    } catch (err) {
      toast.error('Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label htmlFor="name" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
          College / Institute Name <span style={{ color: 'var(--red)' }}>*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Pune Institute of Computer Technology"
          style={{ width: '100%' }}
        />

        {getCollegeSuggestions().length > 0 && (
          <div style={{ marginTop: 8, padding: 12, borderRadius: 8, background: 'rgba(0, 180, 216, 0.08)', border: '1px solid var(--green)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>lightbulb</span>
              <span>Existing Indexed Colleges Found (Check before requesting):</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {getCollegeSuggestions().map(c => (
                <div
                  key={c.id}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    fontSize: 13,
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text)' }}>{c.name}</strong>
                    <span style={{ fontSize: 11, color: 'var(--sub)', marginLeft: 8 }}>{c.location || 'India'}</span>
                  </div>
                  <Link
                    href={`/notes/colleges/${c.slug}`}
                    target="_blank"
                    className="btn-ghost"
                    style={{ fontSize: 11, padding: '2px 8px', color: 'var(--green)' }}
                  >
                    View College ↗
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div>
          <label htmlFor="university" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            Affiliated University
          </label>
          <input
            id="university"
            name="university"
            type="text"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="e.g. SPPU"
            style={{ width: '100%' }}
          />

          {getUniversitySuggestions().length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {getUniversitySuggestions().map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUniversity(u)}
                  style={{
                    fontSize: 11,
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: 'var(--s2)',
                    border: '1px solid var(--border)',
                    color: 'var(--green)',
                    cursor: 'pointer'
                  }}
                >
                  + Use {u.split(' (')[1]?.replace(')', '') || u}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="location" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            Location / City <span style={{ color: 'var(--red)' }}>*</span>
          </label>
          <input
            id="location"
            name="location"
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Pune, Maharashtra"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div>
          <label htmlFor="website" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            Official Website URL
          </label>
          <input
            id="website"
            name="website"
            type="url"
            placeholder="e.g. https://www.pict.edu"
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label htmlFor="phone" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            Contact Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="e.g. +91 20 2437 1101"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
          Contact Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="e.g. info@pict.edu"
          style={{ width: '100%' }}
        />
      </div>

      <div>
        <label htmlFor="address" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
          Full Campus Address
        </label>
        <textarea
          id="address"
          name="address"
          rows={2}
          placeholder="e.g. Survey No. 27, Near Trimurti Chowk, Dhankawadi, Pune, Maharashtra 411043"
          style={{ width: '100%', resize: 'vertical' }}
        />
      </div>

      <div>
        <label htmlFor="description" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
          College Description / About
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="e.g. Autonomous engineering institute offering undergraduate & postgraduate degrees."
          style={{ width: '100%', resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ flex: 1, padding: '12px' }}
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
          style={{ flex: 1, padding: '12px' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
