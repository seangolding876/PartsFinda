'use client';

import { useState } from 'react';
import SellerDetailsModal from './SellerDetailsModal';

export interface SellerUser {
  id: number;
  email: string;
  name: string;
  role: 'seller';
  phone: string;
  email_verified: boolean;
  created_at: string;
  avg_rating: number;
  total_ratings: number;
  business_name?: string;
  owner_name?: string;
  business_type?: string;
  verified_status: string;
  rejection_reason?: string;
}

interface SellerUsersTabProps {
  users: SellerUser[];
  onUserDeleted: (userId: number) => void;
}

export default function SellerUsersTab({ users, onUserDeleted }: SellerUsersTabProps) {
  const [selectedSeller, setSelectedSeller] = useState<SellerUser | null>(null);

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this seller?')) return;

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
        <h2 className="text-xl font-semibold text-gray-800">Seller Users</h2>
        <div className="text-sm text-gray-500">
          Total: {users.length} sellers
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seller
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
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
                  <div className="text-sm text-gray-900">{user.business_name || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{user.owner_name || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-900">{user.avg_rating || 0}</span>
                    <span className="text-sm text-gray-500 ml-1">
                      ({user.total_ratings || 0} ratings)
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.verified_status === 'verified' 
                      ? 'bg-green-100 text-green-800'
                      : user.verified_status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.verified_status || 'pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => setSelectedSeller(user)}
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
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No seller users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SellerDetailsModal
        seller={selectedSeller}
        onClose={() => setSelectedSeller(null)}
      />
    </div>
  );
}