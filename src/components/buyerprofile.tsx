'use client';

import React, { useEffect, useState } from 'react';
import { getAuthData } from '@/lib/auth';
import { useToast } from '@/hooks/useToast'; // ✅ Toast hook import

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export default function BuyerProfile() {
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // ✅ Toast hook use karein
  const { successmsg, errormsg } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const authData = getAuthData();
        if (!authData?.token) return setLoading(false);

        const res = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${authData.token}` },
        });
        const result = await res.json();

        if (result.success) {
          setForm({
            name: result.data.name,
            email: result.data.email,
            phone: result.data.phone || '',
            password: '',
          });
          successmsg('Profile loaded successfully');
        } else {
          errormsg(result.error || 'Failed to load profile');
        }
      } catch {
        errormsg('Something went wrong while fetching profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const authData = getAuthData();
      if (!authData?.token) {
        errormsg('Not authorized');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authData.token}`,
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          password: form.password,
        }),
      });

      const result = await res.json();
      if (result.success) {
        successmsg('Profile updated successfully!');
        setForm({ ...form, password: '' }); // clear password field
      } else {
        errormsg(result.error || 'Failed to update profile');
      }
    } catch {
      errormsg('An error occurred while updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading profile...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {/* ✅ Ab yahan custom message display ki zaroorat nahi, kyunki toast automatically show hoga */}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          disabled
          className="w-full border border-gray-200 bg-gray-100 rounded-lg px-4 py-2 text-gray-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
        <input
          type="text"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Change Password (optional)
        </label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Leave blank to keep current password"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}