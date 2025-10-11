// /app/admin/cars/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface Make {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  created_at: string;
}

interface Model {
  id: string;
  name: string;
  slug: string;
  make_id: string;
  make_name: string;
  created_at: string;
}

export default function CarsManagement() {
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'makes' | 'models'>('makes');

  // Form states
  const [makeForm, setMakeForm] = useState({ name: '', logo_url: '' });
  const [modelForm, setModelForm] = useState({ name: '', make_id: '' });
  const [editingMake, setEditingMake] = useState<Make | null>(null);
  const [editingModel, setEditingModel] = useState<Model | null>(null);

  // Fetch data
  useEffect(() => {
    fetchMakes();
    fetchModels();
  }, []);

  const fetchMakes = async () => {
    try {
      const response = await fetch('/api/makes');
      const result = await response.json();
      if (result.success) {
        setMakes(result.data);
      }
    } catch (error) {
      console.error('Error fetching makes:', error);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models');
      const result = await response.json();
      if (result.success) {
        setModels(result.data);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  // Make CRUD operations
  const handleCreateMake = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/makes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(makeForm),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Make created successfully!');
        setMakeForm({ name: '', logo_url: '' });
        fetchMakes();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Failed to create make');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMake) return;

    setLoading(true);

    try {
      const response = await fetch('/api/makes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...makeForm, id: editingMake.id }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Make updated successfully!');
        setMakeForm({ name: '', logo_url: '' });
        setEditingMake(null);
        fetchMakes();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Failed to update make');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMake = async (id: string) => {
    if (!confirm('Are you sure you want to delete this make?')) return;

    try {
      const response = await fetch(`/api/makes?id=${id}`, { method: 'DELETE' });
      const result = await response.json();
      
      if (result.success) {
        alert('Make deleted successfully!');
        fetchMakes();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Failed to delete make');
    }
  };

  // Model CRUD operations
  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelForm),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Model created successfully!');
        setModelForm({ name: '', make_id: '' });
        fetchModels();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Failed to create model');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModel) return;

    setLoading(true);

    try {
      const response = await fetch('/api/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...modelForm, id: editingModel.id }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Model updated successfully!');
        setModelForm({ name: '', make_id: '' });
        setEditingModel(null);
        fetchModels();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Failed to update model');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return;

    try {
      const response = await fetch(`/api/models?id=${id}`, { method: 'DELETE' });
      const result = await response.json();
      
      if (result.success) {
        alert('Model deleted successfully!');
        fetchModels();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Failed to delete model');
    }
  };

  // Edit handlers
  const startEditMake = (make: Make) => {
    setEditingMake(make);
    setMakeForm({ name: make.name, logo_url: make.logo_url || '' });
  };

  const startEditModel = (model: Model) => {
    setEditingModel(model);
    setModelForm({ name: model.name, make_id: model.make_id });
  };

  const cancelEdit = () => {
    setEditingMake(null);
    setEditingModel(null);
    setMakeForm({ name: '', logo_url: '' });
    setModelForm({ name: '', make_id: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Cars Management</h1>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('makes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'makes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Makes
              </button>
              <button
                onClick={() => setActiveTab('models')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'models'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Models
              </button>
            </nav>
          </div>
        </div>

        {/* Makes Tab */}
        {activeTab === 'makes' && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Make Form */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                {editingMake ? 'Edit Make' : 'Add New Make'}
              </h2>
              <form onSubmit={editingMake ? handleUpdateMake : handleCreateMake} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Make Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={makeForm.name}
                    onChange={(e) => setMakeForm({ ...makeForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Toyota, Honda, BMW"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={makeForm.logo_url}
                    onChange={(e) => setMakeForm({ ...makeForm, logo_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
                  >
                    {loading ? 'Saving...' : (editingMake ? 'Update' : 'Create')}
                  </button>
                  {editingMake && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Makes List */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">All Makes ({makes.length})</h2>
              <div className="space-y-3">
                {makes.map((make) => (
                  <div key={make.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {make.logo_url && (
                        <img src={make.logo_url} alt={make.name} className="w-8 h-8 object-contain" />
                      )}
                      <span className="font-medium">{make.name}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditMake(make)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMake(make.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Models Tab */}
        {activeTab === 'models' && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Model Form */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                {editingModel ? 'Edit Model' : 'Add New Model'}
              </h2>
              <form onSubmit={editingModel ? handleUpdateModel : handleCreateModel} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Make *
                  </label>
                  <select
                    required
                    value={modelForm.make_id}
                    onChange={(e) => setModelForm({ ...modelForm, make_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Make</option>
                    {makes.map((make) => (
                      <option key={make.id} value={make.id}>{make.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={modelForm.name}
                    onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Civic, Corolla, X5"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
                  >
                    {loading ? 'Saving...' : (editingModel ? 'Update' : 'Create')}
                  </button>
                  {editingModel && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Models List */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">All Models ({models.length})</h2>
              <div className="space-y-3">
                {models.map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-gray-500">{model.make_name}</div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditModel(model)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteModel(model.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}