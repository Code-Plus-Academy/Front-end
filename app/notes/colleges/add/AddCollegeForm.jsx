'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function AddCollegeForm({ action }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
          placeholder="e.g. Pune Institute of Computer Technology"
          style={{ width: '100%' }}
        />
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
            placeholder="e.g. SPPU"
            style={{ width: '100%' }}
          />
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
