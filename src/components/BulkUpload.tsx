'use client';

import { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X, Loader } from 'lucide-react';

interface BulkUploadProps {
  sellerEmail: string;
  onSuccess?: (data: any) => void;
  onClose?: () => void;
}

export default function BulkUpload({ sellerEmail, onSuccess, onClose }: BulkUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    const fileName = selectedFile.name.toLowerCase();

    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      setError('Please upload a CSV or Excel file');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setError('');
    setResults(null);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sellerEmail', sellerEmail);

      const response = await fetch('/api/parts/bulk-upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResults(data);
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/parts/bulk-upload');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'partsfinda_bulk_upload_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download template');
    }
  };

  const reset = () => {
    setFile(null);
    setResults(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Bulk Upload Parts</h2>
          <p className="text-gray-600 mt-1">Upload multiple parts at once using CSV or Excel</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Download Template */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Need a template?</h3>
            <p className="text-sm text-blue-700 mt-1">
              Download our CSV template with the correct format and sample data
            </p>
            <button
              onClick={downloadTemplate}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      {!results && (
        <>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              className="hidden"
            />

            {!file ? (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload Your File</h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop your CSV or Excel file here, or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Choose File
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  Supported formats: CSV, XLSX, XLS • Max size: 5MB
                </p>
              </>
            ) : (
              <div>
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">File Selected</h3>
                <p className="text-gray-600 mb-1">{file.name}</p>
                <p className="text-sm text-gray-500 mb-4">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Parts
                      </>
                    )}
                  </button>
                  <button
                    onClick={reset}
                    disabled={uploading}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Choose Different File
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
        </>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Success Summary */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900">Upload Complete!</h3>
                <p className="text-green-700 mt-1">
                  {results.summary.successfulImports} of {results.summary.totalRows} parts imported successfully
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {results.summary.totalRows}
              </div>
              <div className="text-sm text-gray-600">Total Rows</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {results.summary.successfulImports}
              </div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {results.summary.failedImports}
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>

          {/* Failed Imports */}
          {results.invalidParts && results.invalidParts.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Failed Imports</h3>
              <div className="bg-red-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                {results.invalidParts.map((item: any, index: number) => (
                  <div key={index} className="mb-3 pb-3 border-b border-red-200 last:border-0">
                    <p className="font-medium text-red-900">
                      Row {item.row}: {item.part.name || 'Unknown Part'}
                    </p>
                    <ul className="text-sm text-red-700 mt-1">
                      {item.errors.map((error: string, i: number) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Upload More Parts
            </button>
            <button
              onClick={() => window.location.href = '/seller/dashboard'}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!results && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">File Requirements:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• First row must contain column headers</li>
            <li>• Required columns: Name, Price, Stock, Condition</li>
            <li>• Optional columns: Part Number, Make, Model, Year, Description, Category</li>
            <li>• Condition values: new, used, or refurbished</li>
            <li>• Price should be in JMD without currency symbol</li>
          </ul>
        </div>
      )}
    </div>
  );
}
