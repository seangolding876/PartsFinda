'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, Paperclip, Phone, Video, MoreVertical, ArrowLeft, Check, CheckCheck, Clock, MessageCircle, User, RefreshCw } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Auth utility
const getAuthData = () => {
  if (typeof window === 'undefined') return null;
  try {
    const authData = localStorage.getItem('authData');
    return authData ? JSON.parse(authData) : null;
  } catch (error) {
    console.error('Auth data error:', error);
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
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected } = useSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const conversationRef = useRef(selectedConversation);

  // ✅ Get current user info
  const currentUserId = getCurrentUserId();
  const currentUserName = getCurrentUserName();

  // Keep ref updated
  useEffect(() => {
    conversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // ✅ Update connection status
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected');
      console.log('✅ Socket connected');
    } else {
      setConnectionStatus('disconnected');
      console.log('❌ Socket disconnected');
    }
  }, [isConnected]);

  // ✅ Fetch conversations
  const fetchConversations = async () => {
    try {
      console.log('🔄 Fetching conversations...');
      const token = getAuthToken();
      if (!token) {
        console.error('❌ No token found');
        return;
      }

      const response = await fetch(`/api/messages/conversations?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Conversations fetched:', result.data?.length || 0);
        if (result.success) {
          setConversations(result.data || []);
          setLastUpdate(Date.now());
        }
      } else {
        console.error('❌ Failed to fetch conversations');
      }
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
    }
  };

  // ✅ FIXED: Fetch messages with proper error handling
  const fetchMessages = async (conversationId: string) => {
    try {
      console.log('🔄 Fetching messages for:', conversationId);
      const token = getAuthToken();
      if (!token) {
        console.error('❌ No token found');
        return;
      }

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
            status: msg.status || 'delivered'
          }));

          // Clear tracker and add new messages
          messageTracker.clear();
          formattedMessages.forEach((msg: Message) => messageTracker.add(msg.id));
          
          setMessages(formattedMessages);
          console.log('✅ Messages loaded:', formattedMessages.length);
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

  // ✅ NEW: Force refresh function
  const forceRefresh = useCallback(() => {
    console.log('🔄 Force refreshing all data');
    fetchConversations();
    if (conversationRef.current) {
      fetchMessages(conversationRef.current.id);
    }
  }, []);

  // ✅ NEW: Socket connection handler
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log('✅ Socket connected, refreshing data');
      setConnectionStatus('connected');
      forceRefresh();
    };

    const handleDisconnect = () => {
      console.log('❌ Socket disconnected');
      setConnectionStatus('disconnected');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, forceRefresh]);

  // ✅ FIXED: REAL-TIME Socket Event Handlers - PERFECTLY WORKING
  useEffect(() => {
    if (!socket) {
      console.log('❌ Socket not available');
      return;
    }

    console.log('🎯 Setting up REAL-TIME socket listeners');

    const handleNewMessage = (messageData: any) => {
      console.log('📨 REAL-TIME: Socket received message:', messageData);
      
      const messageId = String(messageData.id || messageData.message_id);
      
      // Prevent duplicates
      if (messageTracker.has(messageId)) {
        console.log('🔄 Skipping duplicate message:', messageId);
        return;
      }

      messageTracker.add(messageId);

      // Check if this message belongs to current conversation
      const currentConv = conversationRef.current;
      const messageConvId = messageData.conversation_id || messageData.conversationId;
      
      if (currentConv && messageConvId === currentConv.id) {
        console.log('💬 Adding REAL-TIME message to current conversation');
        
        const isCurrentUser = messageData.sender_id === currentUserId || messageData.senderId === currentUserId;
        
        const formattedMessage: Message = {
          id: messageId,
          text: messageData.text || messageData.message_text,
          sender: isCurrentUser ? 'buyer' : 'seller',
          senderName: isCurrentUser ? 'You' : currentConv.participant.name,
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
            conv.id === currentConv.id 
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
      }
      
      // ✅ ALWAYS refresh conversations list when new message comes
      console.log('🔄 New message received, refreshing conversations list');
      fetchConversations();
    };

    const handleMessageSent = (data: any) => {
      console.log('✅ Message sent confirmation:', data);
      // Refresh conversations after sending message
      setTimeout(() => fetchConversations(), 100);
    };

    const handleConversationUpdate = () => {
      console.log('🔄 Conversation updated, refreshing list');
      fetchConversations();
    };

    const handleUserTyping = (data: any) => {
      const currentConv = conversationRef.current;
      if (currentConv && data.conversationId === currentConv.id) {
        if (data.typing) {
          setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
        } else {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }
      }
    };

    // Register all socket events
    socket.on('new_message', handleNewMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('conversation_updated', handleConversationUpdate);
    socket.on('user_typing', handleUserTyping);
    socket.on('message_received', handleNewMessage);

    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socket.off('new_message', handleNewMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('conversation_updated', handleConversationUpdate);
      socket.off('user_typing', handleUserTyping);
      socket.off('message_received', handleNewMessage);
    };
  }, [socket, currentUserId]);

  // ✅ API fallback for sending messages
  const sendMessageViaAPI = async (tempId: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/messages/${selectedConversation?.id}`, {
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
          // Replace temporary message with real one
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempId 
                ? { 
                    ...result.data, 
                    status: 'sent',
                    senderName: 'You'
                  }
                : msg
            )
          );
          console.log('✅ Message sent via API');
          // Refresh conversations
          setTimeout(() => fetchConversations(), 200);
        } else {
          throw new Error(result.error);
        }
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      console.error('❌ API send failed:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
    }
  };

  // ✅ FIXED: Send Message Function - PERFECTLY WORKING
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      
      // Create temporary message ID
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // ✅ Create temporary message for immediate UI update
      const tempMessage: Message = {
        id: tempId,
        text: newMessage.trim(),
        sender: 'buyer', // Current user is always buyer
        senderName: 'You',
        senderId: currentUserId || '',
        timestamp: new Date().toISOString(),
        status: 'sending'
      };
      
      // ✅ IMMEDIATELY add to UI for real-time feel
      setMessages(prev => {
        const newMessages = [...prev, tempMessage];
        messageTracker.add(tempId);
        return newMessages;
      });
      
      // Clear input
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

      // ✅ FIX: Always use socket if available, with better error handling
      if (socket) {
        console.log('📤 Sending via socket:', {
          conversationId: selectedConversation.id,
          messageText: newMessage.trim()
        });

        // ✅ FIX: Add timeout for socket response
        const socketTimeout = setTimeout(() => {
          console.log('⏰ Socket timeout, falling back to API');
          sendMessageViaAPI(tempId);
        }, 5000);

        socket.emit('send_message', {
          conversationId: selectedConversation.id,
          messageText: newMessage.trim()
        }, (response: any) => {
          clearTimeout(socketTimeout);
          
          if (response?.success) {
            console.log('✅ Message sent via socket');
            // Update temporary message status
            setMessages(prev => 
              prev.map(msg => 
                msg.id === tempId 
                  ? { ...msg, status: 'sent', id: response.message?.id || tempId }
                  : msg
              )
            );
            // ✅ FIX: Force refresh conversations
            setTimeout(() => fetchConversations(), 200);
          } else {
            console.error('❌ Socket send failed, falling back to API');
            sendMessageViaAPI(tempId);
          }
        });

      } else {
        // ✅ Fallback to API if socket not available
        console.log('📤 Using API fallback');
        await sendMessageViaAPI(tempId);
      }

    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id.startsWith('temp-') ? { ...msg, status: 'failed' } : msg
        )
      );
    } finally {
      setSending(false);
    }
  };

  // ✅ FIXED: Join conversation room when selected - PROPERLY WORKING
  useEffect(() => {
    if (!socket || !selectedConversation) return;

    console.log('🎯 Joining conversation room:', selectedConversation.id);
    
    // ✅ FIX: Proper room joining with timeout
    socket.emit('join_conversation', { 
      conversationId: selectedConversation.id,
      userId: currentUserId
    });

    // ✅ FIX: Force refresh messages after joining room
    setTimeout(() => {
      fetchMessages(selectedConversation.id);
      fetchConversations();
    }, 500);

    return () => {
      console.log('🎯 Leaving conversation room:', selectedConversation.id);
      socket.emit('leave_conversation', { 
        conversationId: selectedConversation.id,
        userId: currentUserId
      });
    };
  }, [socket, selectedConversation, currentUserId]);

  // ✅ FIXED: AUTO-REFRESH MESSAGES (Better polling)
  useEffect(() => {
    if (!selectedConversation) return;

    console.log('🔄 Starting auto-refresh for conversation:', selectedConversation.id);

    // ✅ FIX: Always refresh every 3 seconds, regardless of socket status
    refreshIntervalRef.current = setInterval(() => {
      console.log('🔄 Auto-refreshing messages and conversations');
      fetchMessages(selectedConversation.id);
      fetchConversations();
    }, 3000);

    return () => {
      console.log('🔄 Stopping auto-refresh');
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [selectedConversation]);

  // ✅ FIXED: Manual refresh function - BETTER
  const handleManualRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    setManualRefresh(prev => prev + 1);
    
    // ✅ FIX: Force refresh everything
    fetchConversations();
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
    
    // ✅ FIX: Show loading state
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
    
  }, [selectedConversation]);

  // ✅ Initial load
  useEffect(() => {
    const initialize = async () => {
      await fetchConversations();
      setLoading(false);
    };
    initialize();
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

  // ✅ Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }, 100);
    }
  }, [messages]);

  // ✅ Typing handlers
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

  // ✅ Debounced typing stop
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

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.relatedRequest.partName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return 'Just now';
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      return 'Recently';
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

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

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
      <div className={`w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800">Messages</h1>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleManualRefresh}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Refresh messages"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${manualRefresh > 0 ? 'animate-spin' : ''}`} />
              </button>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-xs text-gray-500">
                  {connectionStatus === 'connected' ? 'Live' : 
                   connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">No conversations yet</p>
              <p className="text-sm text-gray-400">Start a conversation from a part request</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                    selectedConversation?.id === conversation.id 
                      ? 'bg-blue-50 border-r-2 border-r-blue-500' 
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={conversation.participant.avatar}
                        alt={conversation.participant.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.participant.name)}&background=7c3aed&color=fff`;
                        }}
                      />
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white rounded-full ${
                        conversation.participant.online ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-800 truncate text-sm">
                          {conversation.participant.name}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTime(conversation.lastMessage.timestamp)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 truncate mb-1 leading-tight">
                        {conversation.lastMessage.text || 'No messages yet'}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 truncate">
                          {conversation.relatedRequest.partName}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <div className="bg-blue-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>

                <div className="relative">
                  <img
                    src={selectedConversation.participant.avatar}
                    alt={selectedConversation.participant.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedConversation.participant.name)}&background=7c3aed&color=fff`;
                    }}
                  />
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white rounded-full ${
                    selectedConversation.participant.online ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>

                <div className="flex-1">
                  <h2 className="font-semibold text-gray-800 text-base">
                    {selectedConversation.participant.name}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{selectedConversation.participant.role}</span>
                    <span className="text-gray-300">•</span>
                    <span>{selectedConversation.participant.location}</span>
                    <span className="text-gray-300">•</span>
                    <span className={`${selectedConversation.participant.online ? 'text-green-500' : 'text-gray-500'}`}>
                      {selectedConversation.participant.online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleManualRefresh}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  title="Refresh messages"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-600 ${manualRefresh > 0 ? 'animate-spin' : ''}`} />
                </button>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' : 
                    connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span>
                    {connectionStatus === 'connected' ? 'Real-time' : 
                     connectionStatus === 'connecting' ? 'Connecting' : 'Polling'}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No messages yet</h3>
                  <p className="text-gray-500 max-w-sm">
                    Start the conversation by sending a message about{' '}
                    <span className="font-semibold">{selectedConversation.relatedRequest.partName}</span>
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-6">
                  {Object.entries(messageGroups).map(([date, dateMessages]) => (
                    <div key={date}>
                      {/* Date separator */}
                      <div className="flex items-center justify-center my-6">
                        <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                          {formatDate(dateMessages[0].timestamp)}
                        </div>
                      </div>
                      
                      {/* Messages for this date */}
                      <div className="space-y-3">
                        {dateMessages.map((message) => {
                          const isCurrentUser = isCurrentUserMessage(message);
                          
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-xs lg:max-w-md xl:max-w-lg 2xl:max-w-xl ${
                                isCurrentUser
                                  ? 'bg-blue-500 text-white rounded-2xl rounded-tr-md'
                                  : 'bg-white text-gray-800 rounded-2xl rounded-tl-md border border-gray-200 shadow-sm'
                              } p-4 transition-all duration-200`}>
                                
                                {/* Sender Name - Only show for other user */}
                                {!isCurrentUser && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="w-3 h-3 text-gray-500" />
                                    <span className="text-xs font-medium text-gray-600">
                                      {message.senderName}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Message Text */}
                                <p className="text-sm leading-relaxed break-words">
                                  {message.text}
                                </p>
                                
                                {/* Message Time and Status */}
                                <div className={`flex items-center justify-between mt-2 ${
                                  isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  <span className="text-xs">
                                    {formatTime(message.timestamp)}
                                  </span>
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
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing Indicator */}
                  {typingIndicator}
                  
                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input Area */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0">
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>

                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                    rows={1}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 transition-all duration-200"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                </div>

                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="p-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {/* Connection status hint */}
              {connectionStatus !== 'connected' && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-500">
                    {connectionStatus === 'connecting' 
                      ? 'Connecting to real-time server...' 
                      : 'Using fallback mode - messages may be delayed'}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 p-8">
            <div className="text-center max-w-md">
              <MessageCircle className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-700 mb-3">Your Messages</h2>
              <p className="text-gray-500 mb-6">
                Select a conversation to start messaging. You can communicate with sellers about parts, 
                negotiate prices, and arrange shipping.
              </p>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2">💡 Pro Tip</h3>
                <p className="text-sm text-gray-600">
                  Messages are synced in real-time across all your devices. You'll receive email notifications for new messages.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}