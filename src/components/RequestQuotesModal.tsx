// components/RequestQuotesModal.tsx
import { useState, useEffect } from 'react';
import { X, MessageCircle, User, Calendar, DollarSign, Package, Truck } from 'lucide-react';
import { useToast } from '@/hooks/useToast'; 

interface Quote {
  id: number;
  seller_name: string;
  seller_company: string;
  price: number;
  delivery_time: string;
  availability: string;
  condition: string;
  warranty: string;
  notes: string;
  status: string;
  created_at: string;
}

interface RequestQuotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any;
}

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    const authData = localStorage.getItem('authData');
    return authData ? JSON.parse(authData).token : null;
  } catch (error) {
    return null;
  }
};

export default function RequestQuotesModal({ isOpen, onClose, request }: RequestQuotesModalProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const { successmsg, errormsg, infomsg } = useToast(); 

  useEffect(() => {
    if (isOpen && request) {
      fetchQuotes();
    }
  }, [isOpen, request]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      const response = await fetch(`/api/quotes/request/${request.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setQuotes(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async (quoteId: number) => {
    if (!confirm('Are you sure you want to accept this quote?')) return;
    
    try {
      const token = getAuthToken();
      const response = await fetch('/api/quotes/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quoteId })
      });

      const result = await response.json();
      if (result.success) {
        successmsg('Quote accepted successfully!');
        fetchQuotes(); // Refresh quotes
      } else {
        errormsg(result.error || 'Failed to accept quote');
      }
    } catch (error) {
      console.error('Error accepting quote:', error);
      errormsg('Failed to accept quote');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Quotes for {request.part_name}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading quotes...</p>
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No quotes received yet for this request.</p>
              <p className="text-sm text-gray-500 mt-2">
                Sellers will submit quotes here when they respond to your request.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div key={quote.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">
                        {quote.seller_company || quote.seller_name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold text-green-600">J${quote.price}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{quote.delivery_time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          <span className="capitalize">{quote.condition}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {quote.status}
                      </span>
                    </div>
                  </div>

                  {quote.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{quote.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Received: {new Date(quote.created_at).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => handleAcceptQuote(quote.id)}
                      disabled={quote.status === 'accepted'}
                      className={`px-4 py-2 rounded font-semibold ${
                        quote.status === 'accepted' 
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {quote.status === 'accepted' ? 'Accepted' : 'Accept Quote'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}