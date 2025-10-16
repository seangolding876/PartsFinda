// app/messages/page.tsx - COMPLETELY FIXED VERSION
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, Paperclip, Phone, Video, MoreVertical, ArrowLeft, Check, CheckCheck, Clock, MessageCircle } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Auth utility
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    const authData = localStorage.getItem('authData');
    return authData ? JSON.parse(authData).token : null;
  } catch (error) {
    return null;
  }
};

interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    role: string;
    avatar: string;
    location: string;
    online: boolean;
  };
  lastMessage: {
    text: string;
    timestamp: string;
    sender: string;
  };
  relatedRequest: {
    id: string;
    partName: string;
    vehicle: string;
    status: string;
  };
  unreadCount: number;
}

interface Message {
  id: string;
  text: string;
  sender: 'buyer' | 'seller';
  timestamp: string;
  status: string;
}

// Message tracking to prevent duplicates
const messageTracker = new Set();

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected } = useSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const conversationRef = useRef(selectedConversation);

  // Keep ref updated
  useEffect(() => {
    conversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setConversations(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`/api/messages/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Clear tracker for this conversation
          messageTracker.clear();
          result.data.forEach((msg: Message) => messageTracker.add(msg.id));
          
          setMessages(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // ✅ IMPROVED Send Message Function
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      
      // ✅ Create unique temporary ID
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // ✅ Optimistic update
      const tempMessage: Message = {
        id: tempId,
        text: newMessage.trim(),
        sender: 'buyer',
        timestamp: new Date().toISOString(),
        status: 'sending'
      };
      
      setMessages(prev => {
        const newMessages = [...prev, tempMessage];
        messageTracker.add(tempId);
        return newMessages;
      });
      
      setNewMessage('');

      // ✅ Update conversation list optimistically
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? {
                ...conv,
                lastMessage: {
                  text: newMessage.trim(),
                  timestamp: new Date().toISOString(),
                  sender: 'buyer'
                },
                unreadCount: 0
              }
            : conv
        )
      );

      // ✅ Try socket first
      if (socket && isConnected) {
        console.log('📤 Sending via socket:', {
          conversationId: selectedConversation.id,
          messageText: newMessage.trim(),
          receiverId: selectedConversation.participant.id
        });

        socket.emit('send_message', {
          conversationId: selectedConversation.id,
          messageText: newMessage.trim(),
          receiverId: selectedConversation.participant.id
        });

        // Server se confirmation aane par temporary message ko replace karenge
        // Yeh 'new_message' event mein handle hoga

      } else {
        // ✅ Fallback to API
        console.log('📤 Using API fallback');
        const token = getAuthToken();
        const response = await fetch(`/api/messages/${selectedConversation.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            messageText: newMessage.trim()
          })
        });

        if (response.ok) {
          // Refresh messages from server
          await fetchMessages(selectedConversation.id);
          await fetchConversations();
        } else {
          // Mark as failed
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempId 
                ? { ...msg, status: 'failed' }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id.startsWith('temp-') 
            ? { ...msg, status: 'failed' }
            : msg
        )
      );
    } finally {
      setSending(false);
    }
  };

  // ✅ IMPROVED Socket Event Handlers
  useEffect(() => {
    if (!socket) return;

    console.log('🎯 Setting up global socket listeners');

    // Global new message handler
    const handleNewMessage = (messageData: Message) => {
      console.log('📨 Received new message:', messageData);
      
      // ✅ Duplicate check
      if (messageTracker.has(messageData.id)) {
        console.log('🔄 Skipping duplicate message:', messageData.id);
        return;
      }

      messageTracker.add(messageData.id);

      const currentConversation = conversationRef.current;
      
      // ✅ Agar yeh message current conversation ka hai
      if (currentConversation && 
          messageData.sender !== 'buyer' && // Self messages already handled optimistically
          currentConversation.participant.id !== socket.id) {
        
        setMessages(prev => {
          // ✅ Temporary messages ko replace karo
          const filteredMessages = prev.filter(msg => !msg.id.startsWith('temp-'));
          return [...filteredMessages, messageData];
        });

        // ✅ Conversation list update
        setConversations(prev => 
          prev.map(conv => 
            conv.id === currentConversation.id 
              ? {
                  ...conv,
                  lastMessage: {
                    text: messageData.text,
                    timestamp: messageData.timestamp,
                    sender: messageData.sender
                  }
                }
              : conv
          )
        );
      }
    };

    // Conversation update handler
    const handleConversationUpdate = (updateData: any) => {
      console.log('🔄 Conversation updated:', updateData);
      // Sirf conversations refresh karo, messages nahi
      fetchConversations();
    };

    // Typing handler
    const handleUserTyping = (data: any) => {
      const currentConversation = conversationRef.current;
      if (currentConversation && data.userId === currentConversation.participant.id) {
        if (data.typing) {
          setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
        } else {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }
      }
    };

    // Register events
    socket.on('new_message', handleNewMessage);
    socket.on('conversation_updated', handleConversationUpdate);
    socket.on('user_typing', handleUserTyping);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up global socket listeners');
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_updated', handleConversationUpdate);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket]);

  // ✅ Conversation-specific socket setup
  useEffect(() => {
    if (!socket || !selectedConversation) return;

    console.log('🎯 Joining conversation:', selectedConversation.id);
    socket.emit('join_conversation', selectedConversation.id);

    return () => {
      console.log('🎯 Leaving conversation:', selectedConversation.id);
      socket.emit('leave_conversation', selectedConversation.id);
    };
  }, [socket, selectedConversation]);

  // Typing handlers
  const handleTypingStart = useCallback(() => {
    if (socket && selectedConversation) {
      socket.emit('typing_start', { conversationId: selectedConversation.id });
    }
  }, [socket, selectedConversation]);

  const handleTypingStop = useCallback(() => {
    if (socket && selectedConversation) {
      socket.emit('typing_stop', { conversationId: selectedConversation.id });
    }
  }, [socket, selectedConversation]);

  // Debounced typing stop
  useEffect(() => {
    if (newMessage.trim()) {
      handleTypingStart();
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingStop();
      }, 1000);
    } else {
      handleTypingStop();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, handleTypingStart, handleTypingStop]);

  // Initial load
  useEffect(() => {
    fetchConversations().finally(() => setLoading(false));
  }, []);

  // When conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      console.log('🔄 Loading messages for conversation:', selectedConversation.id);
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.relatedRequest.partName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <Clock className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  // Typing indicator
  const typingIndicator = typingUsers.length > 0 && (
    <div className="flex justify-start">
      <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">Typing...</p>
      </div>
    </div>
  );


  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Conversations Sidebar */}
      <div className={`w-full md:w-1/3 bg-white border-r ${selectedConversation ? 'hidden md:block' : 'block'}`}>
        {/* Header with connection status */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800">Messages</h1>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-500">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="overflow-y-auto h-full">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p>No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-r-4 border-r-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <img
                      src={conversation.participant.avatar}
                      alt={conversation.participant.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {conversation.participant.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {conversation.participant.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessage.timestamp)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 truncate mb-1">
                      {conversation.lastMessage.text || 'No messages yet'}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {conversation.relatedRequest.partName}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${selectedConversation ? 'block' : 'hidden md:flex'}`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <img
                  src={selectedConversation.participant.avatar}
                  alt={selectedConversation.participant.name}
                  className="w-10 h-10 rounded-full object-cover"
                />

                <div>
                  <h2 className="font-semibold text-gray-800">
                    {selectedConversation.participant.name}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className={`w-2 h-2 rounded-full ${
                      selectedConversation.participant.online ? 'bg-green-500' : 'bg-gray-400'
                    }`}></span>
                    {selectedConversation.participant.online ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No messages yet</p>
                  <p className="text-sm mt-2">Start the conversation by sending a message</p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'buyer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${
                        message.sender === 'buyer'
                          ? 'bg-blue-500 text-white rounded-l-lg rounded-tr-lg'
                          : 'bg-white border rounded-r-lg rounded-tl-lg'
                      } p-3 shadow-sm`}>
                        <p className="text-sm">{message.text}</p>
                        <div className={`flex items-center justify-between mt-2 ${
                          message.sender === 'buyer' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">{formatTime(message.timestamp)}</span>
                          {message.sender === 'buyer' && (
                            <div className="ml-2">
                              {getStatusIcon(message.status)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {typingIndicator}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t p-4">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>

                <div className="flex-1">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>

                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}