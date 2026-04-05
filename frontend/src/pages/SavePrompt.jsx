import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Bookmark } from 'lucide-react';

export default function SavePrompt() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(window.location.search);
  const carparkId = params.get('id');
  const carpark = location.state?.carpark;

  // Get userId from localStorage
  const userId = localStorage.getItem('userId');

  // Mutation: call POST /api/favorites
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !carparkId) throw new Error('Missing userId or carparkId');
      const res = await fetch('http://localhost:3000/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, carparkId }),
      });
      if (!res.ok) throw new Error('Failed to save favorite');
      return res.json();
    },
    onSuccess: () => navigate('/ThankYou'),
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 dark:from-blue-50 dark:to-slate-50 text-white dark:text-slate-800 flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center space-y-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="w-16 h-16 bg-teal-500/20 dark:bg-teal-100 rounded-2xl flex items-center justify-center mx-auto"
        >
          <Bookmark className="w-8 h-8 text-teal-400 dark:text-teal-600" />
        </motion.div>

        <div>
          <h1 className="text-2xl font-bold text-white dark:text-slate-900">Save This Carpark?</h1>
          <p className="text-slate-400 dark:text-slate-600 text-sm mt-2">
            Would you like to save <span className="text-teal-400 dark:text-teal-600 font-medium">{carpark?.name}</span> for quick access later?
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isLoading}
            className="w-full h-14 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/25"
          >
            <Bookmark className="w-5 h-5 mr-2" />
            {saveMutation.isLoading ? 'Saving...' : 'Save Carpark'}
          </Button>
          <button
            onClick={() => navigate('/ThankYou')}
            className="w-full text-center text-sm text-slate-400 dark:text-slate-600 hover:text-slate-300 dark:hover:text-slate-500 py-2"
          >
            Skip
          </button>
        </div>
      </motion.div>
    </div>
  );
}