'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, Paperclip, Phone, Video, MoreVertical, ArrowLeft, Check, CheckCheck, Clock, MessageCircle, User, RefreshCw } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

const getCurrentUserName = () => {
  const authData = getAuthData();
  return authData?.name || 'You';
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
  senderName: string;
  senderId: string;
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
  const [manualRefresh, setManualRefresh] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected } = useSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  // ✅ Get current user info
  const currentUserId = getCurrentUserId();
  const currentUserName = getCurrentUserName();

  // ✅ Fetch conversations
  const fetchConversations = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
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

  // ✅ FIXED: Fetch messages with proper user mapping
  const fetchMessages = async (conversationId: string) => {
    try {
      console.log('🔄 Fetching messages for conversation:', conversationId);
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`/api/messages/${conversationId}?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📨 Messages API response:', result);
        
        if (result.success && result.data && result.data.messages) {
          const formattedMessages: Message[] = result.data.messages.map((msg: any) => ({
            id: String(msg.id),
            text: msg.text,
            sender: msg.sender,
            senderName: msg.senderName,
            senderId: msg.senderId,
            timestamp: msg.timestamp,
            status: msg.status
          }));

          messageTracker.clear();
          formattedMessages.forEach((msg: Message) => messageTracker.add(msg.id));
          
          setMessages(formattedMessages);
          console.log('✅ Messages loaded:', formattedMessages.length, 'messages');
        } else {
          console.log('❌ No messages in response');
          setMessages([]);
        }
      } else {
        console.error('❌ Failed to fetch messages');
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      setMessages([]);
    }
  };

  // ✅ FIXED: Send Message Function with REAL-TIME updates
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // ✅ Create temporary message for immediate UI update
      const tempMessage: Message = {
        id: tempId,
        text: newMessage.trim(),
        sender: 'buyer',
        senderName: 'You',
        senderId: currentUserId || '',
        timestamp: new Date().toISOString(),
        status: 'sending'
      };
      
      // ✅ IMMEDIATELY add to UI for real-time feel
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');

      // Update conversation list
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

      // ✅ Send via API
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
        const result = await response.json();
        
        if (result.success) {
          // ✅ Replace temporary message with real one
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempId 
                ? { ...result.data, status: 'sent' }
                : msg
            )
          );
          
          console.log('✅ Message sent successfully');
        }
      } else {
        // Mark as failed
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? { ...msg, status: 'failed' } : msg
          )
        );
      }

    } catch (error) {
      console.error('❌ Error sending message:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id.startsWith('temp-') ? { ...msg, status: 'failed' } : msg
        )
      );
    } finally {
      setSending(false);
    }
  };

  // ✅ FIXED: REAL-TIME Socket Event Handlers
  useEffect(() => {
    if (!socket) {
      console.log('❌ Socket not available, using polling');
      return;
    }

    console.log('🎯 Setting up REAL-TIME socket listeners');

    const handleNewMessage = (messageData: any) => {
      console.log('📨 REAL-TIME: Socket received new message:', messageData);
      
      const messageId = String(messageData.id || messageData.messageId);
      
      // Prevent duplicates
      if (messageTracker.has(messageId)) {
        console.log('🔄 Skipping duplicate message:', messageId);
        return;
      }

      messageTracker.add(messageId);

      // Check if this message belongs to current conversation
      const currentConvId = selectedConversation?.id;
      const messageConvId = messageData.conversation_id || messageData.conversationId;
      
      if (currentConvId && messageConvId === currentConvId) {
        console.log('💬 Adding REAL-TIME message to current conversation');
        
        const isCurrentUser = messageData.sender_id === currentUserId || messageData.senderId === currentUserId;
        
        const formattedMessage: Message = {
          id: messageId,
          text: messageData.text || messageData.message_text,
          sender: isCurrentUser ? 'buyer' : 'seller',
          senderName: isCurrentUser ? 'You' : selectedConversation.participant.name,
          senderId: messageData.sender_id || messageData.senderId,
          timestamp: messageData.timestamp || new Date().toISOString(),
          status: 'delivered'
        };

        setMessages(prev => {
          // Remove any temporary messages and avoid duplicates
          const filteredMessages = prev.filter(msg => 
            !msg.id.startsWith('temp-') && msg.id !== messageId
          );
          return [...filteredMessages, formattedMessage];
        });

        // Update conversation last message
        setConversations(prev => 
          prev.map(conv => 
            conv.id === currentConvId 
              ? {
                  ...conv,
                  lastMessage: {
                    text: messageData.text || messageData.message_text,
                    timestamp: messageData.timestamp || new Date().toISOString(),
                    sender: isCurrentUser ? 'buyer' : 'seller'
                  }
                }
              : conv
          )
        );
      } else {
        console.log('🔄 New message for different conversation, refreshing list');
        fetchConversations(); // Refresh conversation list
      }
    };

    const handleMessageSent = (data: any) => {
      console.log('✅ Message sent confirmation:', data);
      // Update message status if needed
    };

    const handleConversationUpdate = () => {
      console.log('🔄 Conversation updated, refreshing list');
      fetchConversations();
    };

    // Register all socket events
    socket.on('new_message', handleNewMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('conversation_updated', handleConversationUpdate);
    socket.on('message_received', handleNewMessage);

    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socket.off('new_message', handleNewMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('conversation_updated', handleConversationUpdate);
      socket.off('message_received', handleNewMessage);
    };
  }, [socket, selectedConversation, currentUserId]);

  // ✅ Join conversation room when selected
  useEffect(() => {
    if (!socket || !selectedConversation) return;

    console.log('🎯 Joining conversation room:', selectedConversation.id);
    socket.emit('join_conversation', { 
      conversationId: selectedConversation.id,
      userId: currentUserId 
    });

    return () => {
      console.log('🎯 Leaving conversation room:', selectedConversation.id);
      socket.emit('leave_conversation', { 
        conversationId: selectedConversation.id,
        userId: currentUserId 
      });
    };
  }, [socket, selectedConversation, currentUserId]);

  // ✅ AUTO-REFRESH MESSAGES (Polling fallback)
  useEffect(() => {
    if (!selectedConversation) return;

    // Refresh messages every 3 seconds if socket is not connected
    if (!isConnected) {
      refreshIntervalRef.current = setInterval(() => {
        console.log('🔄 Auto-refreshing messages (polling fallback)');
        fetchMessages(selectedConversation.id);
      }, 3000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [selectedConversation, isConnected, manualRefresh]);

  // ✅ Manual refresh function
  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    setManualRefresh(prev => prev + 1);
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
    fetchConversations();
  };

  // Initial load
  useEffect(() => {
    fetchConversations().finally(() => setLoading(false));
  }, []);

  // ✅ Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      console.log('🔄 Loading messages for conversation:', selectedConversation.id);
      setMessages([]);
      messageTracker.clear();
      fetchMessages(selectedConversation.id);
    } else {
      setMessages([]);
    }
  }, [selectedConversation?.id, manualRefresh]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.relatedRequest.partName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Just now';
    }
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

  // ✅ Determine if message is from current user
  const isCurrentUserMessage = (message: Message) => {
    return message.senderName === 'You' || message.senderId === currentUserId;
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
        <p className="text-xs text-gray-500 mt-1">{selectedConversation?.participant.name} is typing...</p>
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
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800">Messages</h1>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleManualRefresh}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh messages"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${manualRefresh > 0 ? 'animate-spin' : ''}`} />
              </button>
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
                    <User className="w-4 h-4" />
                    <span>Seller</span>
                    <span className={`w-2 h-2 rounded-full ${
                      selectedConversation.participant.online ? 'bg-green-500' : 'bg-gray-400'
                    }`}></span>
                    {selectedConversation.participant.online ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={handleManualRefresh}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh messages"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-600 ${manualRefresh > 0 ? 'animate-spin' : ''}`} />
                </button>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{isConnected ? 'Real-time' : 'Polling'}</span>
                </div>
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
                  {messages.map((message) => {
                    const isCurrentUser = isCurrentUserMessage(message);
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md ${
                          isCurrentUser
                            ? 'bg-blue-500 text-white rounded-l-lg rounded-tr-lg'
                            : 'bg-white border rounded-r-lg rounded-tl-lg'
                        } p-3 shadow-sm`}>
                          
                          {/* Sender Name - Only show for other user */}
                          {!isCurrentUser && (
                            <div className="flex items-center gap-2 mb-1 text-gray-600">
                              <User className="w-3 h-3" />
                              <span className="text-xs font-medium">
                                {message.senderName}
                              </span>
                            </div>
                          )}
                          
                          <p className="text-sm">{message.text}</p>
                          
                          <div className={`flex items-center justify-between mt-2 ${
                            isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <span className="text-xs">{formatTime(message.timestamp)}</span>
                            {isCurrentUser && (
                              <div className="ml-2 flex items-center gap-1">
                                {getStatusIcon(message.status)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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