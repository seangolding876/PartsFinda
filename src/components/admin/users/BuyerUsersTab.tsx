'use client';

import { useState } from 'react';
import BuyerDetailsModal from './BuyerDetailsModal';

export interface BuyerUser {
  id: number;
  email: string;
  name: string;
  role: 'buyer';
  phone: string;
  email_verified: boolean;
  created_at: string;
  avg_rating: number;
  total_ratings: number;
  address?: string;
  parish?: string;
}

interface BuyerUsersTabProps {
  users: BuyerUser[];
  onUserDeleted: (userId: number) => void;
}

export default function BuyerUsersTab({ users, onUserDeleted }: BuyerUsersTabProps) {
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerUser | null>(null);

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this buyer?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        onUserDeleted(userId);
      } else {
        alert('Failed to delete user: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Buyer Users</h2>
        <div className="text-sm text-gray-500">
          Total: {users.length} buyers
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Buyer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.phone || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.parish || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{user.address ? `${user.address.substring(0, 30)}...` : 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-900">{user.avg_rating || 0}</span>
                    <span className="text-sm text-gray-500 ml-1">
                      ({user.total_ratings || 0} ratings)
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => setSelectedBuyer(user)}
                    className="text-blue-600 hover:text-blue-900 transition-colors"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No buyer users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <BuyerDetailsModal
        buyer={selectedBuyer}
        onClose={() => setSelectedBuyer(null)}
      />
    </div>
  );
}