// components/Dashboard/QuotesTab.tsx
import { useState, useEffect } from 'react';

interface Quote {
  id: number;
  request_id: number;
  seller_id: number;
  price: number;
  availability: string;
  delivery_time: string;
  notes: string;
  warranty: string;
  condition: string;
  status: string;
  created_at: string;
  part_name: string;
  part_number: string;
  seller_name: string;
  seller_company: string;
  make_name: string;
  model_name: string;
  requested_budget: number;
}

// Auth utility - same as seller dashboard
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    const authData = localStorage.getItem('authData');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed.token || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export default function QuotesTab() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const token = getAuthToken();
      if (!token) {
        setError('Please login again');
        return;
      }

      console.log('🔄 Fetching quotes with token...');
      const response = await fetch('/api/quotes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      console.log('📨 API Response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success) {
        setQuotes(data.data || []);
        console.log(`✅ Loaded ${data.data?.length || 0} quotes`);
      } else {
        throw new Error(data.error || 'Failed to fetch quotes');
      }
    } catch (error: any) {
      console.error('❌ Error fetching quotes:', error);
      setError(error.message || 'Failed to load quotes');
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async (quoteId: number) => {
    if (!confirm('Are you sure you want to accept this quote? Other quotes for the same part will be automatically rejected.')) return;
    
    try {
      const token = getAuthToken();
      if (!token) {
        alert('Please login again');
        return;
      }

      const response = await fetch('/api/quotes/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quoteId })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Quote accepted successfully! Other quotes for this part have been automatically rejected.');
        fetchQuotes(); // Refresh quotes
      } else {
        alert(data.error || 'Failed to accept quote');
      }
    } catch (error: any) {
      console.error('Error accepting quote:', error);
      alert('Failed to accept quote. Please try again.');
    }
  };

  const handleRejectQuote = async (quoteId: number) => {
    if (!confirm('Are you sure you want to reject this quote?')) return;
    
    try {
      const token = getAuthToken();
      if (!token) {
        alert('Please login again');
        return;
      }

      const response = await fetch('/api/quotes/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quoteId })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Quote rejected successfully!');
        fetchQuotes(); // Refresh quotes
      } else {
        alert(data.error || 'Failed to reject quote');
      }
    } catch (error: any) {
      console.error('Error rejecting quote:', error);
      alert('Failed to reject quote. Please try again.');
    }
  };

  // Check if any quote for the same part request is accepted
  const isAnyQuoteAcceptedForRequest = (requestId: number) => {
    return quotes.some(quote => 
      quote.request_id === requestId && quote.status === 'accepted'
    );
  };

  // Check if a specific quote can be accepted/rejected
  const canModifyQuote = (quote: Quote) => {
    // If this quote is already accepted or rejected, cannot modify
    if (quote.status !== 'pending') return false;
    
    // If any other quote for the same request is accepted, cannot modify this one
    if (isAnyQuoteAcceptedForRequest(quote.request_id)) return false;
    
    return true;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Loading quotes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <button
            onClick={fetchQuotes}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Quotes Received</h3>
        <button
          onClick={fetchQuotes}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
        >
          Refresh
        </button>
      </div>
      
      {quotes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No quotes received yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            Quotes from sellers will appear here when they respond to your part requests.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => {
            const canModify = canModifyQuote(quote);
            const isRequestAccepted = isAnyQuoteAcceptedForRequest(quote.request_id);
            
            return (
              <div key={quote.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-800">
                      {quote.part_name}
                      {quote.part_number && ` (${quote.part_number})`}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {quote.make_name} {quote.model_name}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Seller:</span>{' '}
                        {quote.seller_company || quote.seller_name}
                      </div>
                      <div>
                        <span className="font-medium">Price:</span>{' '}
                        <span className="text-green-600 font-semibold">
                          ${quote.price}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Delivery:</span>{' '}
                        {quote.delivery_time}
                      </div>
                      <div>
                        <span className="font-medium">Condition:</span>{' '}
                        {quote.condition}
                      </div>
                    </div>
                    {quote.notes && (
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {quote.notes}
                      </p>
                    )}
                    
                    {/* Auto-reject notice */}
                    {isRequestAccepted && quote.status === 'pending' && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                        ⚠️ Another quote for this part has been accepted. This quote is automatically rejected.
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => setSelectedQuote(quote)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      View Detail
                    </button>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptQuote(quote.id)}
                        disabled={!canModify}
                        className={`px-3 py-2 rounded text-sm flex-1 ${
                          !canModify 
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {quote.status === 'accepted' ? 'Accepted' : 'Accept'}
                      </button>
                      
                      <button
                        onClick={() => handleRejectQuote(quote.id)}
                        disabled={!canModify}
                        className={`px-3 py-2 rounded text-sm flex-1 ${
                          !canModify 
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {quote.status === 'rejected' ? 'Rejected' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                  <span>Received: {new Date(quote.created_at).toLocaleDateString()}</span>
                  <span className={`px-2 py-1 rounded ${
                    quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {quote.status}
                    {isRequestAccepted && quote.status === 'pending' && ' (auto-rejected)'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quote Detail Modal */}
      {selectedQuote && (() => {
        const canModify = canModifyQuote(selectedQuote);
        const isRequestAccepted = isAnyQuoteAcceptedForRequest(selectedQuote.request_id);
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Quote Details</h3>
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-medium">Part Name:</label>
                      <p>{selectedQuote.part_name}</p>
                    </div>
                    <div>
                      <label className="font-medium">Part Number:</label>
                      <p>{selectedQuote.part_number || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="font-medium">Vehicle:</label>
                      <p>{selectedQuote.make_name} {selectedQuote.model_name}</p>
                    </div>
                    <div>
                      <label className="font-medium">Seller:</label>
                      <p>{selectedQuote.seller_company || selectedQuote.seller_name}</p>
                    </div>
                    <div>
                      <label className="font-medium">Price:</label>
                      <p className="text-green-600 font-semibold">${selectedQuote.price}</p>
                    </div>
                    <div>
                      <label className="font-medium">Your Budget:</label>
                      <p>${selectedQuote.requested_budget || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="font-medium">Delivery Time:</label>
                      <p>{selectedQuote.delivery_time}</p>
                    </div>
                    <div>
                      <label className="font-medium">Availability:</label>
                      <p>{selectedQuote.availability}</p>
                    </div>
                    <div>
                      <label className="font-medium">Condition:</label>
                      <p>{selectedQuote.condition}</p>
                    </div>
                    <div>
                      <label className="font-medium">Warranty:</label>
                      <p>{selectedQuote.warranty || 'No warranty'}</p>
                    </div>
                  </div>
                  
                  {selectedQuote.notes && (
                    <div>
                      <label className="font-medium">Seller Notes:</label>
                      <p className="mt-1 p-3 bg-gray-50 rounded">{selectedQuote.notes}</p>
                    </div>
                  )}
                  
                  {/* Auto-reject notice in modal */}
                  {isRequestAccepted && selectedQuote.status === 'pending' && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      ⚠️ Another quote for this part has been accepted. This quote is automatically rejected and cannot be modified.
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setSelectedQuote(null)}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Close
                    </button>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          handleRejectQuote(selectedQuote.id);
                          setSelectedQuote(null);
                        }}
                        disabled={!canModify}
                        className={`px-4 py-2 rounded ${
                          !canModify 
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {selectedQuote.status === 'rejected' ? 'Already Rejected' : 'Reject Quote'}
                      </button>
                      
                      <button
                        onClick={() => {
                          handleAcceptQuote(selectedQuote.id);
                          setSelectedQuote(null);
                        }}
                        disabled={!canModify}
                        className={`px-4 py-2 rounded ${
                          !canModify 
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {selectedQuote.status === 'accepted' ? 'Already Accepted' : 'Accept Quote'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}