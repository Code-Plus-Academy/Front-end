'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { deleteNoteAction } from '../../../actions';

export default function DeleteButton({ noteId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm('Are you absolutely sure you want to delete this study resource? This action is permanent and cannot be undone.');
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await deleteNoteAction(noteId);
      if (res && res.success) {
        toast.success('Resource deleted successfully!');
        router.push('/notes');
        router.refresh();
      } else {
        toast.error(res?.error || 'Failed to delete resource. Please try again.');
      }
    } catch (e) {
      console.error(e);
      toast.error('An unexpected error occurred while deleting.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="btn-danger"
      style={{
        background: '#ef4444',
        color: '#fff',
        border: 'none',
        padding: '10px 18px',
        borderRadius: 'var(--r-md)',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.2s',
        opacity: loading ? 0.6 : 1
      }}
    >
      {loading ? 'Deleting...' : 'Delete Resource'}
    </button>
  );
}
