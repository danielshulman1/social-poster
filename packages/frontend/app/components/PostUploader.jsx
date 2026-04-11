'use client';

import { useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';

export default function PostUploader({ onComplete, getAuthToken }) {
  const [uploadType, setUploadType] = useState('file');
  const [file, setFile] = useState(null);
  const [textPaste, setTextPaste] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!['text/plain', 'text/csv', 'application/vnd.ms-excel'].includes(selectedFile.type) && !selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.txt')) {
        setError('Only .txt and .csv files are supported');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    try {
      setLoading(true);
      setError(null);

      let body;

      if (uploadType === 'file') {
        if (!file) {
          setError('Please select a file');
          return;
        }
        const fileContent = await file.text();
        body = {
          uploadType: 'file',
          fileContent,
          fileName: file.name,
        };
      } else {
        if (!textPaste.trim()) {
          setError('Please paste some text');
          return;
        }
        body = {
          uploadType: 'text',
          textPaste,
        };
      }

      const token = getAuthToken();
      const res = await fetch('/api/onboarding/posts/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload posts');
      }

      const data = await res.json();
      setStats(data.stats);

      // Auto-advance after 2 seconds
      setTimeout(() => onComplete(), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (stats) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-accent mb-6">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-sora font-bold text-black dark:text-white mb-3">
          Posts Uploaded Successfully!
        </h2>
        <div className="space-y-3 mb-8">
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Posts</p>
            <p className="text-3xl font-bold text-black dark:text-white">{stats.totalPosts}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Average Length</p>
            <p className="text-lg text-gray-700 dark:text-gray-300">{stats.averagePostLength} characters</p>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Analyzing posts and building your persona...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Upload Type Tabs */}
      <div className="flex gap-4 mb-8">
        {['file', 'text'].map((type) => (
          <button
            key={type}
            onClick={() => {
              setUploadType(type);
              setError(null);
              setFile(null);
              setTextPaste('');
            }}
            className={`flex-1 px-6 py-3 rounded-full font-plus-jakarta font-semibold transition-all ${
              uploadType === type
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {type === 'file' ? 'Upload File' : 'Paste Text'}
          </button>
        ))}
      </div>

      {/* File Upload */}
      {uploadType === 'file' && (
        <div className="mb-8">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center mb-4 hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer">
            <input
              type="file"
              accept=".txt,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-700 dark:text-gray-300 font-semibold mb-1">
                {file ? file.name : 'Drop your file here or click to browse'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Supports .txt and .csv files
              </p>
            </label>
          </div>

          {file && (
            <p className="text-sm text-green-600 dark:text-green-400 mb-4">
              ✓ File selected: {file.name}
            </p>
          )}
        </div>
      )}

      {/* Text Paste */}
      {uploadType === 'text' && (
        <div className="mb-8">
          <textarea
            value={textPaste}
            onChange={(e) => setTextPaste(e.target.value)}
            placeholder={`Paste your posts here. Separate each post with a blank line.\n\nExample:\nFirst post content goes here\n\nSecond post content\n\nThird post content`}
            className="w-full h-48 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-black dark:focus:border-white focus:ring-0 resize-none"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={loading || (uploadType === 'file' ? !file : !textPaste.trim())}
        className="w-full px-8 py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold text-lg hover:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Upload & Continue
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
        We'll analyze these posts to understand your unique voice
      </p>
    </div>
  );
}
