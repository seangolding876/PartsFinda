'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast'; 

// ✅ Star Rating Component
export const StarRating = ({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = "md",
  showLabel = false 
}: {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onRatingChange?.(star)}
            disabled={readonly}
            className={`${sizes[size]} ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform duration-200'
            } ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300 fill-current'
            }`}
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </button>
        ))}
      </div>
      {showLabel && !readonly && (
        <span className="text-xs text-gray-500 text-center">
          {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Rate this conversation'}
        </span>
      )}
    </div>
  );
};

// ✅ Rating Modal Component
export const RatingModal = ({ 
  isOpen, 
  onClose, 
  userToRate,
  onRatingSubmit 
}: {
  isOpen: boolean;
  onClose: () => void;
  userToRate: any;
  onRatingSubmit: (rating: number, comment: string) => void;
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { successmsg, errormsg, infomsg } = useToast(); 

  const handleSubmit = async () => {
    if (rating === 0) {
      infomsg('Please select a rating before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await onRatingSubmit(rating, comment);
      setRating(0);
      setComment('');
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setComment('');
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Rate Your Experience</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-center mb-6">
          <p className="text-gray-600 mb-2">
            How was your experience with{' '}
            <span className="font-semibold text-blue-600">
              {userToRate?.business_name || userToRate?.name || 'this user'}?
            </span>
          </p>
          <div className="flex justify-center my-4">
            <StarRating 
              rating={rating} 
              onRatingChange={setRating}
              size="lg"
              showLabel={true}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Comments (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this user..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Submitting...
              </div>
            ) : (
              'Submit Rating'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ User Rating Display Component
export const UserRatingDisplay = ({ userId, getAuthToken }: { 
  userId: string; 
  getAuthToken: () => string | null;
}) => {
  const [userRatings, setUserRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRatings = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(`/api/ratings?userId=${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setUserRatings(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching user ratings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserRatings();
    }
  }, [userId, getAuthToken]);

  const averageRating = userRatings.length > 0 
    ? userRatings.reduce((sum: number, rating: any) => sum + rating.rating, 0) / userRatings.length 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        Loading ratings...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <StarRating rating={Math.round(averageRating)} readonly={true} size="sm" />
      <span className="text-sm text-gray-600">
        {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'} 
        {userRatings.length > 0 && ` (${userRatings.length})`}
      </span>
    </div>
  );
};