// app/messages/page.tsx - COMPLETE FIXED VERSION
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  Send, 
  Paperclip, 
  ArrowLeft, 
  Check, 
  CheckCheck, 
  Clock, 
  MessageCircle, 
  User,
  Star,
  MapPin
} from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';

// Auth utility
const getAuthData = () => {
  if (typeof window === 'undefined') return null;
  try {
    const authData = localStorage.getItem('authData');
    return authData ? JSON.parse(authData) : null;
  } catch (error) {
    return null;
  }
};

const getAuthToken = () => {
  const authData = getAuthData();
  return authData?.token || null;
};

const getCurrentUserId = () => {
  const authData = getAuthData();
  return authData?.userId || null;
};

const getCurrentUserRole = () => {
  const authData = getAuthData();
  return authData?.role || null;
};

interface Conversation {
  id: string;
  part_request_id: string;
  part_name: string;
  make_name: string;
  model_name: string;
  vehicle_year: string;
  participant_id: string;
  participant_name: string;
  participant_business_name: string;
  participant_role: 'buyer' | 'seller';
  participant_location: string;
  last_message: string;
  last_message_time: string;
  last_message_sender_id: string;
  unread_count: number;
  request_status: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_business_name: string;
  sender_role: 'buyer' | 'seller';
}

// Message tracking to prevent duplicates
const messageTracker = new Set();

const isTemporaryMessage = (id: string): boolean => {
  return id.startsWith('temp-');
};

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

  const currentUserId = getCurrentUserId();
  const currentUserRole = getCurrentUserRole();

  // Keep ref updated
  useEffect(() => {
    conversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.log('❌ No token found for conversations');
        return;
      }

      const response = await fetch('/api/messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📋 Conversations API response:', result);
        
        if (result.success) {
          setConversations(result.data);
        } else {
          console.error('❌ Failed to fetch conversations:', result.error);
        }
      } else {
        console.error('❌ HTTP error fetching conversations:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      console.log('🔄 Fetching messages for conversation:', conversationId);
      const token = getAuthToken();
      if (!token) {
        console.log('❌ No token found for messages');
        return;
      }

      const response = await fetch(`/api/messages/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📨 Messages API Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📨 Messages API response:', result);
        
        if (result.success && result.data) {
          // Clear tracker for this conversation
          messageTracker.clear();
          result.data.forEach((msg: Message) => messageTracker.add(msg.id.toString()));
          
          setMessages(result.data);
          console.log('✅ Messages loaded:', result.data.length);
        } else {
          console.log('❌ No messages in response:', result);
          setMessages([]);
        }
      } else {
        console.error('❌ Failed to fetch messages, status:', response.status);
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      setMessages([]);
    }
  };

  // Send message function
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      
      // Create temporary message for optimistic update
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const tempMessage: Message = {
        id: tempId,
        conversation_id: selectedConversation.id,
        sender_id: currentUserId!,
        receiver_id: selectedConversation.participant_id,
        message_text: newMessage.trim(),
        is_read: false,
        created_at: new Date().toISOString(),
        sender_name: 'You',
        sender_business_name: '',
        sender_role: currentUserRole as 'buyer' | 'seller'
      };
      
      // Optimistic update
      setMessages(prev => {
        const newMessages = [...prev, tempMessage];
        messageTracker.add(tempId);
        return newMessages;
      });
      
      setNewMessage('');

      // Try socket first
      if (socket && isConnected) {
        console.log('📤 Sending via socket:', {
          conversationId: selectedConversation.id,
          messageText: newMessage.trim()
        });

        socket.emit('send_message', {
          conversationId: selectedConversation.id,
          messageText: newMessage.trim()
        });

      } else {
        // Fallback to API
        console.log('📤 Using API fallback');
        const token = getAuthToken();
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            partRequestId: selectedConversation.part_request_id,
            sellerId: selectedConversation.participant_id,
            messageText: newMessage.trim()
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Refresh messages to get the actual message from database
            await fetchMessages(selectedConversation.id);
            await fetchConversations();
          }
        } else {
          // Mark as failed
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempId 
                ? { ...msg, message_text: `${msg.message_text} (Failed)` }
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
            ? { ...msg, message_text: `${msg.message_text} (Failed)` }
            : msg
        )
      );
    } finally {
      setSending(false);
    }
  };

  // Socket Event Handlers
  useEffect(() => {
    if (!socket) return;

    console.log('🎯 Setting up socket listeners');

    // Handle new incoming messages
    const handleNewMessage = (messageData: any) => {
      console.log('📨 Received new message via socket:', messageData);
      
      const messageId = messageData.id.toString();
      
      // Duplicate check
      if (messageTracker.has(messageId)) {
        console.log('🔄 Skipping duplicate message:', messageId);
        return;
      }

      messageTracker.add(messageId);

      const currentConversation = conversationRef.current;
      
      if (currentConversation && messageData.conversation_id === currentConversation.id) {
        console.log('💬 Adding message to current conversation');
        
        setMessages(prev => {
          // Filter out temporary messages
          const filteredMessages = prev.filter(msg => !isTemporaryMessage(msg.id));
          
          // Check if message already exists
          if (filteredMessages.some(msg => msg.id.toString() === messageId)) {
            return filteredMessages;
          }
          
          // Add the new message
          const newMessage: Message = {
            id: messageId,
            conversation_id: messageData.conversation_id,
            sender_id: messageData.sender_id,
            receiver_id: messageData.receiver_id,
            message_text: messageData.message_text,
            is_read: messageData.is_read,
            created_at: messageData.created_at,
            sender_name: messageData.sender_name,
            sender_business_name: messageData.sender_business_name,
            sender_role: messageData.sender_role
          };
          
          return [...filteredMessages, newMessage];
        });

        // Update conversations list
        fetchConversations();
      }
    };

    // Handle conversation updates
    const handleConversationUpdate = (updateData: any) => {
      console.log('🔄 Conversation updated:', updateData);
      fetchConversations();
    };

    // Handle typing indicators
    const handleUserTyping = (data: any) => {
      const currentConversation = conversationRef.current;
      if (currentConversation && data.userId === currentConversation.participant_id) {
        if (data.typing) {
          setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
        } else {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }
      }
    };

    // Handle new message notifications
    const handleNewMessageNotification = (notificationData: any) => {
      console.log('🔔 New message notification:', notificationData);
      // Refresh conversations to update unread counts
      fetchConversations();
      
      // Play notification sound
      playNotificationSound();
    };

    // Register event listeners
    socket.on('new_message', handleNewMessage);
    socket.on('conversation_updated', handleConversationUpdate);
    socket.on('user_typing', handleUserTyping);
    socket.on('new_message_notification', handleNewMessageNotification);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_updated', handleConversationUpdate);
      socket.off('user_typing', handleUserTyping);
      socket.off('new_message_notification', handleNewMessageNotification);
    };
  }, [socket]);

  // Join/leave conversation rooms
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

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3'); // Add this sound file to your public folder
      audio.play().catch(() => {
        // Silent fail if audio can't play
      });
    } catch (error) {
      console.log('🔇 Could not play notification sound');
    }
  };

  // Initial load
  useEffect(() => {
    fetchConversations().finally(() => setLoading(false));
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      console.log('🔄 Loading messages for conversation:', selectedConversation.id);
      setMessages([]);
      fetchMessages(selectedConversation.id);
    } else {
      setMessages([]);
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participant_business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.part_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Utility functions
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      return 'Just now';
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString([], { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return timestamp;
    }
  };

  const getStatusIcon = (message: Message) => {
    if (message.sender_id !== currentUserId) return null;

    if (isTemporaryMessage(message.id)) {
      return <Clock className="w-3 h-3 text-gray-400" />;
    }

    if (message.message_text.includes('(Failed)')) {
      return <Clock className="w-3 h-3 text-red-500" />;
    }

    return message.is_read ? 
      <CheckCheck className="w-3 h-3 text-blue-500" /> : 
      <Check className="w-3 h-3 text-gray-400" />;
  };

  const isCurrentUser = (message: Message) => {
    return message.sender_id === currentUserId;
  };

  const getParticipantDisplayName = (conversation: Conversation) => {
    return conversation.participant_business_name || conversation.participant_name;
  };

  const getAvatarUrl = (conversation: Conversation) => {
    // You can implement your own avatar logic here
    return conversation.participant_role === 'seller' 
      ? 'https://media.istockphoto.com/id/1257558676/vector/buyer-avatar-icon.jpg?s=170667a&w=0&k=20&c=VG92-sJeQVUZaZO9cRgBHwnUTVRTDD252tM8z-dYyzA='
      : 'https://img.freepik.com/premium-vector/investment-banker-vector-character-flat-style-illustration_1033579-58081.jpg?semt=ais_hybrid&w=740&q=80';
  };

  // Typing indicator component
  const typingIndicator = typingUsers.length > 0 && (
    <div className="flex justify-start">
      <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {selectedConversation?.participant_name} is typing...
        </p>
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
      <div className={`w-full md:w-1/3 bg-white border-r border-gray-200 ${selectedConversation ? 'hidden md:block' : 'block'}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800">Messages</h1>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-500">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>

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

        <div className="overflow-y-auto h-[calc(100vh-120px)]">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No conversations yet</p>
              <p className="text-sm">Start a conversation by contacting a seller or responding to a buyer.</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-r-4 border-r-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={getAvatarUrl(conversation)}
                      alt={getParticipantDisplayName(conversation)}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      conversation.participant_role === 'seller' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {getParticipantDisplayName(conversation)}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatTime(conversation.last_message_time)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 truncate mb-1">
                      {conversation.last_message || 'No messages yet'}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {conversation.part_name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {conversation.make_name} {conversation.model_name} ({conversation.vehicle_year})
                        </span>
                      </div>
                      {conversation.unread_count > 0 && (
                        <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unread_count}
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
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>

                <img
                  src={getAvatarUrl(selectedConversation)}
                  alt={getParticipantDisplayName(selectedConversation)}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />

                <div>
                  <h2 className="font-semibold text-gray-800">
                    {getParticipantDisplayName(selectedConversation)}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span>{selectedConversation.participant_location}</span>
                    <span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs">
                      {selectedConversation.participant_role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="capitalize">{currentUserRole}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs">{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
            </div>

            {/* Related Request Info */}
            <div className="bg-blue-50 border-b border-blue-100 p-3">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-blue-800">Part Request:</span>
                  <span className="text-blue-700 ml-2">{selectedConversation.part_name}</span>
                </div>
                <div className="text-blue-600">
                  {selectedConversation.make_name} {selectedConversation.model_name} ({selectedConversation.vehicle_year})
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">No messages yet</p>
                  <p className="text-sm">Start the conversation by sending a message</p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser(message) ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${
                        isCurrentUser(message)
                          ? 'bg-blue-500 text-white rounded-l-lg rounded-tr-lg'
                          : 'bg-white border border-gray-200 rounded-r-lg rounded-tl-lg shadow-sm'
                      } p-3`}>
                        {/* Sender Name - Only show for other user */}
                        {!isCurrentUser(message) && (
                          <div className="flex items-center gap-2 mb-1 text-gray-600">
                            <User className="w-3 h-3" />
                            <span className="text-xs font-medium">
                              {message.sender_business_name || message.sender_name}
                            </span>
                          </div>
                        )}
                        
                        <p className="text-sm break-words">{message.message_text}</p>
                        
                        <div className={`flex items-center justify-between mt-2 ${
                          isCurrentUser(message) ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">{formatTime(message.created_at)}</span>
                          {isCurrentUser(message) && (
                            <div className="ml-2 flex items-center gap-1">
                              {getStatusIcon(message)}
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
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>

                <div className="flex-1">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
              <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}