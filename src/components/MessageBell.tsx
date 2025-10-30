// components/MessageBell.tsx
'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface MessageNotification {
  id: string;
  title: string;
  created_at: string;
  is_read: boolean;
}

export default function MessageBell() {
  const [messages, setMessages] = useState<MessageNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const authData = localStorage.getItem('authData');
      const token = authData ? JSON.parse(authData).token : null;
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const messageNotifications = result.data.filter((n: any) => n.type === 'message');
          setMessages(messageNotifications);
          setUnreadCount(messageNotifications.filter((m: any) => !m.is_read).length);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    try {
      const authData = localStorage.getItem('authData');
      const token = authData ? JSON.parse(authData).token : null;
      
      // Optional: call API to mark all message notifications as read
      // For now, just redirect to messages page (which can handle read status)
      window.location.href = '/messages';
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="relative">
        <button className="relative p-2 text-gray-600">
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={markAllAsRead}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}