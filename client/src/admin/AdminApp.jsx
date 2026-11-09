import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SEO } from '../components/common/SEO.jsx';

export default function AdminApp() {
  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col items-center justify-center p-4">
      <SEO title="Admin Portal" noIndex={true} />
      <div className="max-w-md w-full bg-stone-800 p-8 rounded-2xl border border-stone-700 shadow-2xl text-center space-y-4">
        <h1 className="font-serif text-2xl font-bold text-gold-400">
          Manikpur Eidgah Admin
        </h1>
        <p className="text-sm text-stone-400">
          Protected Administrative Dashboard (Lazy-Loaded Chunk). Full admin interface is implemented in Phase 6.
        </p>
      </div>
    </div>
  );
}
