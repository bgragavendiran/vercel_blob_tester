'use client';
import React, {useRef, useState} from 'react';
import {Check, Copy, Eye, Image as ImageIcon, Loader2, Upload, X} from 'lucide-react';

import {upload} from '@vercel/blob/client';


// --- REAL UPLOAD FUNCTION (Use this in your project) ---
const realUpload = async (file, onProgress) => {
    // ----------------------------------------------------------------------
    // ⚠️ UNCOMMENT THIS BLOCK FOR LOCAL USE
    // ----------------------------------------------------------------------

    const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload', // Points to your Next.js API route

        onUploadProgress: (progressEvent) => {
            onProgress(progressEvent.percentage);
        },
    });
    return newBlob;

    // Fallback if user forgets to uncomment
    console.error("Vercel Blob import is commented out. Please uncomment it in the code.");
    alert("Please uncomment the 'upload' import and the code inside 'realUpload' to use real Vercel Blob storage.");
    throw new Error("Vercel Blob SDK not active");
};


// --- COMPONENT 1: IMAGE UPLOADER ---
const ImageUploader = ({onUploadComplete}) => {
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const inputRef = useRef(null);

    const handleFiles = async (file) => {
        if (!file || !file.type.startsWith('image/')) {
            alert("Please upload an image file.");
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            let result;

            result = await realUpload(file, setProgress);

            onUploadComplete(result);
        } catch (error) {
            console.error("Upload failed:", error);
            // Alert is already handled in realUpload if it's the SDK missing error
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files[0]);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto mb-8">
            <div
                className={`relative flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed transition-all duration-300 ease-in-out
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'}
          ${uploading ? 'pointer-events-none opacity-80' : 'hover:bg-slate-100 cursor-pointer'}
        `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleChange}
                />

                {uploading ? (
                    <div className="flex flex-col items-center gap-3 w-full px-8">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin"/>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                                style={{width: `${progress}%`}}
                            />
                        </div>
                        <p className="text-sm font-medium text-slate-600">Uploading... {progress}%</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-slate-500">
                        <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                            <Upload className="w-6 h-6 text-blue-500"/>
                        </div>
                        <p className="font-semibold text-slate-700">Click to upload</p>
                        <p className="text-xs mt-1">or drag and drop SVG, PNG, JPG</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- COMPONENT 2: IMAGE VIEWER (GALLERY) ---
const ImageViewer = ({images, onDelete}) => {
    const [copiedId, setCopiedId] = useState(null);

    const copyToClipboard = (text, id) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        document.body.removeChild(textArea);
    };

    if (!images || images.length === 0) {
        return (
            <div className="text-center py-12 px-4 rounded-xl border border-slate-200 bg-slate-50 border-dashed">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-200 mb-4">
                    <ImageIcon className="w-6 h-6 text-slate-400"/>
                </div>
                <h3 className="text-lg font-medium text-slate-900">No images yet</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-1">
                    Upload an image above to see it appear in your Vercel Blob gallery.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {images.map((img, idx) => (
                <div
                    key={img.url + idx}
                    className="group relative bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                    {/* Image Area */}
                    <div className="aspect-video w-full overflow-hidden bg-slate-100 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={img.url}
                            alt={img.pathname}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        <div
                            className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                            <a
                                href={img.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-white rounded-full text-slate-700 hover:text-blue-600 shadow-sm transform translate-y-2 group-hover:translate-y-0 transition-all"
                                title="View Full Size"
                            >
                                <Eye className="w-4 h-4"/>
                            </a>
                        </div>
                    </div>

                    <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-slate-800 truncate pr-2" title={img.pathname}>
                                {img.pathname}
                            </p>
                            <button
                                onClick={() => onDelete(idx)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title="Remove from view"
                            >
                                <X className="w-4 h-4"/>
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                {img.contentType || 'image/unknown'}
              </span>

                            <button
                                onClick={() => copyToClipboard(img.url, idx)}
                                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                {copiedId === idx ? (
                                    <>
                                        <Check className="w-3 h-3"/> Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3 h-3"/> Copy URL
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- MAIN APP ---
export default function App() {
    const [images, setImages] = useState([]);

    const handleUploadComplete = (newBlob) => {
        setImages((prev) => [newBlob, ...prev]);
    };

    const handleDelete = (indexToDelete) => {
        setImages((prev) => prev.filter((_, idx) => idx !== indexToDelete));
    };

    return (
        <div className="min-h-screen bg-white p-6 md:p-12 font-sans text-slate-900">
            <div className="max-w-3xl mx-auto">
                <header className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-black rounded-xl shadow-lg mb-4">
                        <svg
                            viewBox="0 0 1155 1000"
                            className="w-8 h-8 text-white fill-current"
                        >
                            <path d="M577.344 0L1154.69 1000H0L577.344 0Z"/>
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        Vercel Blob Storage
                    </h1>
                    <p className="text-slate-500">
                        Upload images securely and serve them instantly.
                    </p>
                </header>

                <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">
                        Upload New File
                    </h2>
                    <ImageUploader onUploadComplete={handleUploadComplete}/>
                </section>

                <section>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center justify-between">
                        <span>Recent Uploads</span>
                        <span
                            className="text-xs normal-case font-normal bg-slate-100 px-2 py-1 rounded-full text-slate-500">
                    {images.length} files
                </span>
                    </h2>
                    <ImageViewer images={images} onDelete={handleDelete}/>
                </section>

                {/* Helper Note for Developer */}
                <div className="mt-12 p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Local Testing Mode Instructions:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Install SDK: <code className="bg-yellow-100 px-1 rounded">npm install @vercel/blob</code>
                        </li>
                        <li>Uncomment <code className="bg-yellow-100 px-1 rounded">import</code> line at top of file
                        </li>
                        <li>Uncomment <code className="bg-yellow-100 px-1 rounded">realUpload</code> logic</li>
                        <li>Set <code className="bg-yellow-100 px-1 rounded">ENABLE_SIMULATION_MODE = false</code></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}