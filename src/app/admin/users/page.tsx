'use client';

import { useState, useEffect } from 'react';
import UserTabs from '@/components/admin/users/UserTabs';
import AdminUsersTab from '@/components/admin/users/AdminUsersTab';
import SellerUsersTab from '@/components/admin/users/SellerUsersTab';
import BuyerUsersTab from '@/components/admin/users/BuyerUsersTab';

// Base User Interface
interface BaseUser {
  id: number;
  email: string;
  name: string;
  phone: string;
  email_verified: boolean;
  created_at: string;
  avg_rating: number;
  total_ratings: number;
}

// Specific User Types
export interface AdminUser extends BaseUser {
  role: 'admin';
}

export interface SellerUser extends BaseUser {
  role: 'seller';
  business_name?: string;
  owner_name?: string;
  business_type?: string;
  verified_status: string;
  rejection_reason?: string;
}

export interface BuyerUser extends BaseUser {
  role: 'buyer';
  address?: string;
  parish?: string;
}

// Union type for all users
export type IUser = AdminUser | SellerUser | BuyerUser;

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState<'admin' | 'seller' | 'buyer'>('admin');
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async (role?: string) => {
    try {
      const response = await fetch(`/api/admin/users${role ? `?role=${role}` : ''}`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(activeTab);
  }, [activeTab]);

  const handleUserCreated = () => {
    fetchUsers(activeTab);
  };

  const handleUserDeleted = (userId: number) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  // Type guards for filtering
  const isAdminUser = (user: IUser): user is AdminUser => user.role === 'admin';
  const isSellerUser = (user: IUser): user is SellerUser => user.role === 'seller';
  const isBuyerUser = (user: IUser): user is BuyerUser => user.role === 'buyer';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage all users in the system</p>
        </div>

        <UserTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-6">
          {activeTab === 'admin' && (
            <AdminUsersTab 
              users={users.filter(isAdminUser)}
              onUserCreated={handleUserCreated}
              onUserDeleted={handleUserDeleted}
            />
          )}
          {activeTab === 'seller' && (
            <SellerUsersTab 
              users={users.filter(isSellerUser)}
              onUserDeleted={handleUserDeleted}
            />
          )}
          {activeTab === 'buyer' && (
            <BuyerUsersTab 
              users={users.filter(isBuyerUser)}
              onUserDeleted={handleUserDeleted}
            />
          )}
        </div>
      </div>
    </div>
  );
}