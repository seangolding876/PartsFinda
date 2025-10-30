// components/EnhancedRequestQuotesModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, MessageCircle, User, Calendar, DollarSign, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast'; // ✅ Toast hook import

interface EnhancedQuote {
  id: number;
  seller_name: string;
  seller_company: string;
  seller_id: string;
  price: number;
  delivery_time: string;
  availability: string;
  condition: string;
  warranty: string;
  notes: string;
  status: string;
  created_at: string;
}

interface EnhancedRequestQuotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  onQuoteUpdate?: () => void;
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

export default function EnhancedRequestQuotesModal({ 
  isOpen, 
  onClose, 
  request,
  onQuoteUpdate 
}: EnhancedRequestQuotesModalProps) {
  const [quotes, setQuotes] = useState<EnhancedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [processing, setProcessing] = useState<number | null>(null);

  // ✅ Toast hook use karein
  const { successmsg, errormsg } = useToast();

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
          if (result.data.length > 0) {
            successmsg(`Loaded ${result.data.length} quotes`);
          }
        }
      }
    } catch (error) {
      errormsg('Error fetching quotes');
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async (quoteId: number) => {
    const userConfirmed = window.confirm('Are you sure you want to accept this quote? All other quotes will be automatically rejected.');
    if (!userConfirmed) return;
    
    try {
      setProcessing(quoteId);
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
        // Create conversation automatically
        await createConversation(result.sellerId);
        
        // Send automatic acceptance message
        await sendAcceptanceMessage(result.sellerId);
        
        successmsg('Quote accepted successfully! Conversation started with seller.');
        
        // Refresh quotes and parent component
        fetchQuotes();
        if (onQuoteUpdate) onQuoteUpdate();
      } else {
        errormsg(result.error || 'Failed to accept quote');
      }
    } catch (error) {
      errormsg('Failed to accept quote');
      console.error('Error accepting quote:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectQuote = async (quoteId: number) => {
    const userConfirmed = window.confirm('Are you sure you want to reject this quote?');
    if (!userConfirmed) return;
    
    try {
      setProcessing(quoteId);
      const token = getAuthToken();
      const response = await fetch('/api/quotes/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quoteId })
      });

      const result = await response.json();
      if (result.success) {
        successmsg('Quote rejected successfully!');
        fetchQuotes();
        if (onQuoteUpdate) onQuoteUpdate();
      } else {
        errormsg(result.error || 'Failed to reject quote');
      }
    } catch (error) {
      errormsg('Failed to reject quote');
      console.error('Error rejecting quote:', error);
    } finally {
      setProcessing(null);
    }
  };

  const createConversation = async (sellerId: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          partRequestId: request.id,
          sellerId: sellerId
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const sendAcceptanceMessage = async (sellerId: string) => {
    try {
      const token = getAuthToken();
      
      // First get conversation
      const convResponse = await fetch('/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const convResult = await convResponse.json();
      if (convResult.success) {
        const conversation = convResult.data.find((conv: any) => 
          conv.participant.id === sellerId && conv.relatedRequest.id === request.id
        );

        if (conversation) {
          // Send automatic message
          await fetch(`/api/messages/${conversation.id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              messageText: `Hello! I have accepted your quote for ${request.part_name}. Please let me know the next steps for pickup/delivery.`
            })
          });
        }
      }
    } catch (error) {
      console.error('Error sending acceptance message:', error);
    }
  };

  const handleSendMessage = async (sellerId: string) => {
    if (!messageText.trim()) {
      errormsg('Please enter a message');
      return;
    }

    try {
      const token = getAuthToken();
      
      // First create conversation if not exists
      const convResult = await createConversation(sellerId);
      let conversationId = convResult.data?.id;

      if (!conversationId) {
        // If conversation already exists, find it
        const convResponse = await fetch('/api/messages/conversations', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const conversations = await convResponse.json();
        if (conversations.success) {
          const existingConv = conversations.data.find((conv: any) => 
            conv.participant.id === sellerId && conv.relatedRequest.id === request.id
          );
          conversationId = existingConv?.id;
        }
      }

      if (conversationId) {
        const response = await fetch(`/api/messages/${conversationId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            messageText: messageText.trim()
          })
        });

        const result = await response.json();
        if (result.success) {
          successmsg('Message sent successfully!');
          setMessageText('');
          setSelectedSeller(null);
        } else {
          errormsg(result.error || 'Failed to send message');
        }
      }
    } catch (error) {
      errormsg('Failed to send message');
      console.error('Error sending message:', error);
    }
  };

  // Check if any quote is accepted
  const hasAcceptedQuote = quotes.some(quote => quote.status === 'accepted');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Quotes for {request.part_name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Message Composer */}
          {selectedSeller && (
            <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-blue-800">Send Message to Seller</h3>
                <button
                  onClick={() => setSelectedSeller(null)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message here..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
              <div className="flex justify-end gap-3 mt-3">
                <button
                  onClick={() => setSelectedSeller(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSendMessage(selectedSeller)}
                  disabled={!messageText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Message
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading quotes...</p>
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No quotes received yet for this request.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div key={quote.id} className={`border rounded-lg p-4 ${
                  quote.status === 'accepted' ? 'border-green-500 bg-green-50' :
                  quote.status === 'rejected' ? 'border-red-500 bg-red-50' :
                  'border-gray-200'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
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
                        {quote.warranty && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Warranty: {quote.warranty}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {quote.status}
                      </span>
                    </div>
                  </div>

                  {quote.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-700 bg-white bg-opacity-50 p-3 rounded">{quote.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Received: {new Date(quote.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      {quote.status === 'pending' && (
                        <>
                          <button
                            onClick={() => setSelectedSeller(quote.seller_id)}
                            disabled={processing !== null}
                            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Message
                          </button>
                          <button
                            onClick={() => handleAcceptQuote(quote.id)}
                            disabled={processing !== null || hasAcceptedQuote}
                            className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing === quote.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            {hasAcceptedQuote ? 'Already Accepted' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleRejectQuote(quote.id)}
                            disabled={processing !== null || hasAcceptedQuote}
                            className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing === quote.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            Reject
                          </button>
                        </>
                      )}
                      {quote.status === 'accepted' && (
                        <span className="text-green-600 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Accepted
                        </span>
                      )}
                      {quote.status === 'rejected' && (
                        <span className="text-red-600 font-semibold flex items-center gap-1">
                          <XCircle className="w-4 h-4" />
                          Rejected
                        </span>
                      )}
                    </div>
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