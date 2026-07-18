'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  itemType: string;
  itemId: string;
  className?: string;
}

export default function FavoriteButton({ itemType, itemId, className = '' }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/personalization/favorites');
        if (res.ok) {
          const data = await res.json();
          const favorites = data.favorites || [];
          setIsFavorited(favorites.some((f: any) => f.item_type === itemType && f.item_id === itemId));
        }
      } catch { /* user may not be logged in */ }
    }
    checkStatus();
  }, [itemType, itemId]);

  async function toggle() {
    setLoading(true);
    try {
      if (isFavorited) {
        await fetch(`/api/personalization/favorites?item_type=${itemType}&item_id=${itemId}`, { method: 'DELETE' });
        setIsFavorited(false);
      } else {
        await fetch('/api/personalization/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_type: itemType, item_id: itemId }),
        });
        setIsFavorited(true);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        isFavorited
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
      } ${className}`}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
      {isFavorited ? 'Saved' : 'Save'}
    </button>
  );
}
