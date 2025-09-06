'use client';

import { useState } from 'react';

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(0);
  const [messageText, setMessageText] = useState('');

  const conversations = [
    {
      id: 1,
      name: 'AutoParts Pro',
      lastMessage: 'Yes, the brake pads are still available',
      time: '2 hours ago',
      unread: 2,
      avatar: '👤'
    },
    {
      id: 2,
      name: 'Speed Shop',
      lastMessage: 'I can offer a discount for bulk orders',
      time: '5 hours ago',
      unread: 0,
      avatar: '👤'
    },
    {
      id: 3,
      name: 'Factory Direct',
      lastMessage: 'Shipping will take 3-5 business days',
      time: '1 day ago',
      unread: 0,
      avatar: '👤'
    }
  ];

  const messages = [
    {
      id: 1,
      sender: 'AutoParts Pro',
      text: 'Hello! How can I help you today?',
      time: '10:30 AM',
      isMe: false
    },
    {
      id: 2,
      sender: 'Me',
      text: 'Hi, I\'m interested in the ceramic brake pads. Are they still available?',
      time: '10:32 AM',
      isMe: true
    },
    {
      id: 3,
      sender: 'AutoParts Pro',
      text: 'Yes, the brake pads are still available. We have 5 sets in stock.',
      time: '10:33 AM',
      isMe: false
    },
    {
      id: 4,
      sender: 'AutoParts Pro',
      text: 'Would you like to place an order?',
      time: '10:33 AM',
      isMe: false
    }
  ];

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // In a real app, this would send the message to the backend
      console.log('Sending message:', messageText);
      setMessageText('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Messages</h1>

        <div className="bg-white rounded-lg shadow" style={{ height: '600px' }}>
          <div className="grid md:grid-cols-3 h-full">
            {/* Conversations List */}
            <div className="border-r overflow-y-auto">
              <div className="p-4 border-b">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                {conversations.map((conv, index) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(index)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedConversation === index ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{conv.avatar}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold">{conv.name}</h3>
                          <span className="text-xs text-gray-500">{conv.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{conv.lastMessage}</p>
                      </div>
                      {conv.unread > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages Area */}
            <div className="md:col-span-2 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">👤</div>
                  <div>
                    <h2 className="font-semibold">{conversations[selectedConversation].name}</h2>
                    <p className="text-sm text-gray-500">Online</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.isMe
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <p className={`text-xs mt-1 ${
                          msg.isMe ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
