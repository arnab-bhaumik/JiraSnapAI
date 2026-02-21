'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';

interface DragDropZoneProps {
  onImageSelected: (base64: string, mimeType: string) => void;
  imagePreview: string | null;
  onRemoveImage: () => void;
}

export default function DragDropZone({ onImageSelected, imagePreview, onRemoveImage }: DragDropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please drop an image file (PNG, JPG, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      onImageSelected(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  if (imagePreview) {
    return (
      <div className="image-preview-container" style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
        <img src={imagePreview} alt="Preview" style={{ width: '100%', display: 'block', maxHeight: '400px', objectFit: 'contain', background: '#f8fafd' }} />
        <button
          onClick={onRemoveImage}
          style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}
        >
          x
        </button>
      </div>
    );
  }

  return (
    <div
      className="upload-container"
      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{ borderColor: isDragActive ? 'var(--primary)' : 'var(--border-dashed)', background: isDragActive ? 'var(--primary-light)' : 'var(--bg-input)' }}
    >
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
      <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <p className="upload-text">Drop your screenshot here</p>
      <p className="upload-hint">or click to browse - PNG, JPG, GIF up to 10MB</p>
    </div>
  );
}
