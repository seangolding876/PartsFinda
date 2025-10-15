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

export default function QuotesTab() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/quotes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setQuotes(data.data);
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
      const token = localStorage.getItem('token');
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
        alert('Quote accepted successfully!');
        fetchQuotes(); // Refresh quotes
      }
    } catch (error) {
      console.error('Error accepting quote:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">Loading quotes...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Quotes Received</h3>
      
      {quotes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No quotes received yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
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
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => setSelectedQuote(quote)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    View Detail
                  </button>
                  <button
                    onClick={() => handleAcceptQuote(quote.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Accept Quote
                  </button>
                </div>
              </div>
              
              <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                <span>Received: {new Date(quote.created_at).toLocaleDateString()}</span>
                <span className={`px-2 py-1 rounded ${
                  quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {quote.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quote Detail Modal */}
      {selectedQuote && (
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
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleAcceptQuote(selectedQuote.id);
                      setSelectedQuote(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Accept Quote
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}