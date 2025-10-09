'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Send, Paperclip, Phone, Video, MoreVertical, ArrowLeft, Check, CheckCheck, Clock, Image, FileText, Star, MapPin } from 'lucide-react';

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Demo conversations data
  const conversations = [
    {
      id: 1,
      participant: {
        name: 'Kingston Auto Parts',
        role: 'supplier',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
        rating: 4.8,
        location: 'Kingston',
        lastSeen: '2 minutes ago',
        online: true
      },
      lastMessage: {
        text: 'I have the brake pads in stock. When would you like to pick them up?',
        timestamp: '2024-01-16T10:30:00Z',
        sender: 'supplier',
        read: false
      },
      relatedRequest: {
        id: 'REQ-001',
        partName: 'Brake Pads Set',
        vehicle: '2020 Toyota Camry',
        status: 'quoted'
      },
      unreadCount: 2
    },
    {
      id: 2,
      participant: {
        name: 'Spanish Town Motors',
        role: 'supplier',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
        rating: 4.9,
        location: 'Spanish Town',
        lastSeen: '1 hour ago',
        online: false
      },
      lastMessage: {
        text: 'Thanks for your business! The part is ready for pickup.',
        timestamp: '2024-01-15T16:45:00Z',
        sender: 'supplier',
        read: true
      },
      relatedRequest: {
        id: 'REQ-002',
        partName: 'Oil Filter',
        vehicle: '2019 Honda Civic',
        status: 'completed'
      },
      unreadCount: 0
    },
    {
      id: 3,
      participant: {
        name: 'John Doe',
        role: 'buyer',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
        rating: null,
        location: 'Portmore',
        lastSeen: '5 hours ago',
        online: false
      },
      lastMessage: {
        text: 'Do you have this part for a 2018 model as well?',
        timestamp: '2024-01-15T09:20:00Z',
        sender: 'buyer',
        read: true
      },
      relatedRequest: {
        id: 'REQ-003',
        partName: 'Air Filter',
        vehicle: '2017 BMW 3 Series',
        status: 'active'
      },
      unreadCount: 0
    }
  ];

  // Demo messages for selected conversation
  const getMessages = (conversationId) => {
    const messagesByConv = {
      1: [
        {
          id: 1,
          text: 'Hi! I saw your quote for the brake pads. Are these ceramic pads?',
          sender: 'buyer',
          timestamp: '2024-01-16T09:15:00Z',
          status: 'read'
        },
        {
          id: 2,
          text: 'Yes, these are premium ceramic brake pads. They come with a 2-year warranty.',
          sender: 'supplier',
          timestamp: '2024-01-16T09:18:00Z',
          status: 'read'
        },
        {
          id: 3,
          text: 'Great! Can you show me a photo of the actual pads?',
          sender: 'buyer',
          timestamp: '2024-01-16T09:20:00Z',
          status: 'read'
        },
        {
          id: 4,
          text: '',
          sender: 'supplier',
          timestamp: '2024-01-16T09:25:00Z',
          status: 'read',
          image: 'https://ext.same-assets.com/394992809/2530530056.webp',
          caption: 'Here are the brake pads in stock'
        },
        {
          id: 5,
          text: 'Perfect! These look exactly like what I need. What\'s the best price you can offer?',
          sender: 'buyer',
          timestamp: '2024-01-16T09:28:00Z',
          status: 'read'
        },
        {
          id: 6,
          text: 'I quoted J$8,500 but for you I can do J$8,200. This includes free installation guide.',
          sender: 'supplier',
          timestamp: '2024-01-16T09:30:00Z',
          status: 'read'
        },
        {
          id: 7,
          text: 'That sounds fair. When can I pick them up?',
          sender: 'buyer',
          timestamp: '2024-01-16T10:25:00Z',
          status: 'read'
        },
        {
          id: 8,
          text: 'I have the brake pads in stock. When would you like to pick them up?',
          sender: 'supplier',
          timestamp: '2024-01-16T10:30:00Z',
          status: 'delivered'
        }
      ],
      2: [
        {
          id: 1,
          text: 'Hi, I\'m interested in your oil filter quote.',
          sender: 'buyer',
          timestamp: '2024-01-14T14:00:00Z',
          status: 'read'
        },
        {
          id: 2,
          text: 'Hello! Yes, I have the Honda oil filter in stock. It\'s genuine OEM.',
          sender: 'supplier',
          timestamp: '2024-01-14T14:05:00Z',
          status: 'read'
        },
        {
          id: 3,
          text: 'Perfect! I\'ll take it. When can I pick it up?',
          sender: 'buyer',
          timestamp: '2024-01-14T14:10:00Z',
          status: 'read'
        },
        {
          id: 4,
          text: 'Available now! Shop address: 45 Burke Road, Spanish Town. Open until 6 PM.',
          sender: 'supplier',
          timestamp: '2024-01-14T14:15:00Z',
          status: 'read'
        },
        {
          id: 5,
          text: 'Thanks for your business! The part is ready for pickup.',
          sender: 'supplier',
          timestamp: '2024-01-15T16:45:00Z',
          status: 'read'
        }
      ],
      3: [
        {
          id: 1,
          text: 'Do you have this part for a 2018 model as well?',
          sender: 'buyer',
          timestamp: '2024-01-15T09:20:00Z',
          status: 'read'
        }
      ]
    };
    return messagesByConv[conversationId] || [];
  };

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (selectedConversation) {
      setMessages(getMessages(selectedConversation.id));
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.relatedRequest.partName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'buyer', // This would be dynamic based on current user
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Simulate supplier response
    setTimeout(() => {
      const response = {
        id: messages.length + 2,
        text: 'Thanks for your message! I\'ll get back to you shortly.',
        sender: 'supplier',
        timestamp: new Date().toISOString(),
        status: 'delivered'
      };
      setMessages(prev => [...prev, response]);
    }, 2000);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Conversations Sidebar */}
      <div className={`w-full md:w-1/3 bg-white border-r ${selectedConversation ? 'hidden md:block' : 'block'}`}>
        {/* Header */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800 mb-4">Messages</h1>

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
          {filteredConversations.map((conversation) => (
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
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessage.timestamp)}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      conversation.participant.role === 'supplier'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {conversation.participant.role}
                    </span>
                    {conversation.participant.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-600">{conversation.participant.rating}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      {conversation.participant.location}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 truncate mb-1">
                    {conversation.lastMessage.text}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Re: {conversation.relatedRequest.partName}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      conversation.relatedRequest.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : conversation.relatedRequest.status === 'quoted'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {conversation.relatedRequest.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
                    {selectedConversation.participant.online ? 'Online' : `Last seen ${selectedConversation.participant.lastSeen}`}
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
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Related Request Info */}
            <div className="bg-blue-50 border-b p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Request: {selectedConversation.relatedRequest.partName}
                  </p>
                  <p className="text-xs text-blue-600">
                    {selectedConversation.relatedRequest.vehicle} • {selectedConversation.relatedRequest.id}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  selectedConversation.relatedRequest.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : selectedConversation.relatedRequest.status === 'quoted'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedConversation.relatedRequest.status}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    {message.image && (
                      <div className="mb-2">
                        <img
                          src={message.image}
                          alt="Shared image"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        {message.caption && (
                          <p className="text-sm mt-2 opacity-90">{message.caption}</p>
                        )}
                      </div>
                    )}

                    {message.text && (
                      <p className="text-sm">{message.text}</p>
                    )}

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
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t p-4">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
