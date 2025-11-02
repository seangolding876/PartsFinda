'use client';

import { useState, useEffect } from 'react';
import ContactMessagesTable from '@/components/admin/contact-messages/ContactMessagesTable';
import ContactMessagesFilters from '@/components/admin/contact-messages/ContactMessagesFilters';
import ContactMessageDetails from '@/components/admin/contact-messages/ContactMessageDetails';
import {  MessageStatus, MessageType } from '@/types/contact';
import { getAuthToken, isAdmin, logout } from '@/lib/auth';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  type: MessageType;
  status: MessageStatus;
  admin_notes: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface FilterCounts {
  status: Array<{ status: string; count: number }>;
  type: Array<{ type: string; count: number }>;
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const token = getAuthToken();
  
  // Filters state
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: '',
    page: 1,
    limit: 20
  });

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const [filterCounts, setFilterCounts] = useState<FilterCounts>({
    status: [],
    type: []
  });

const fetchMessages = async () => {
  try {
    setLoading(true);
    
    // ✅ USE YOUR EXISTING AUTH UTILITY

    
    if (!token) {
      console.error('❌ User not authenticated');
      // Redirect to login or show message
      alert('Please login to access this page');
      window.location.href = '/auth/login';
      return;
    }

    // Also check if user is admin
    if (!isAdmin()) {
      console.error('❌ User is not admin');
      alert('Access denied. Admin privileges required.');
      return;
    }

    const queryParams = new URLSearchParams({
      status: filters.status,
      type: filters.type,
      page: filters.page.toString(),
      limit: filters.limit.toString(),
      ...(filters.search && { search: filters.search })
    });

    const response = await fetch(`/api/admin/contact-messages?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Handle non-OK responses
    if (response.status === 401) {
      console.error('❌ Unauthorized - token may be invalid');
      logout(); // Use your logout function
      return;
    }

    if (response.status === 403) {
      console.error('❌ Forbidden - user is not admin');
      alert('Access denied. Admin privileges required.');
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      setMessages(data.data.messages);
      setPagination(data.data.pagination);
      setFilterCounts(data.data.filters);
    } else {
      console.error('Failed to fetch messages:', data.error);
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    alert('Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchMessages();
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 })); // Reset to page 1 when filters change
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleStatusUpdate = async (messageId: string, newStatus: MessageStatus) => {
    try {
      
      const response = await fetch('/api/admin/contact-messages', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId,
          status: newStatus
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: newStatus } : msg
        ));
        
        // Update selected message if it's the one being viewed
        if (selectedMessage && selectedMessage.id === messageId) {
          setSelectedMessage(prev => prev ? { ...prev, status: newStatus } : null);
        }

        // Refresh counts
        fetchMessages();
      } else {
        console.error('Failed to update status:', data.error);
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  const handleViewDetails = (message: ContactMessage) => {
    setSelectedMessage(message);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedMessage(null);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/contact-messages?id=${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove from local state
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        
        // Close details if viewing the deleted message
        if (selectedMessage && selectedMessage.id === messageId) {
          handleCloseDetails();
        }

        // Refresh counts
        fetchMessages();
      } else {
        console.error('Failed to delete message:', data.error);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const getStatusColor = (status: MessageStatus) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: MessageType) => {
    switch (type) {
      case 'general': return 'bg-purple-100 text-purple-800';
      case 'parts': return 'bg-indigo-100 text-indigo-800';
      case 'seller': return 'bg-green-100 text-green-800';
      case 'technical': return 'bg-orange-100 text-orange-800';
      case 'billing': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
          <p className="text-gray-600 mt-2">
            Manage and respond to customer inquiries and messages
          </p>
        </div>

        {/* Filters */}
        <ContactMessagesFilters
          filters={filters}
          filterCounts={filterCounts}
          onFilterChange={handleFilterChange}
          onRefresh={fetchMessages}
        />

        {/* Messages Table */}
        <ContactMessagesTable
          messages={messages}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onStatusUpdate={handleStatusUpdate}
          onViewDetails={handleViewDetails}
          onDeleteMessage={handleDeleteMessage}
          getStatusColor={getStatusColor}
          getTypeColor={getTypeColor}
        />

        {/* Message Details Modal */}
        {showDetails && selectedMessage && (
          <ContactMessageDetails
            message={selectedMessage}
            onClose={handleCloseDetails}
            onStatusUpdate={handleStatusUpdate}
            getStatusColor={getStatusColor}
            getTypeColor={getTypeColor}
          />
        )}
      </div>
    </div>
  );
}