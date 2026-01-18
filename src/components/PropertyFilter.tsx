'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';

const PREFECTURES = [
  '東京都',
  '神奈川県',
  '千葉県',
  '埼玉県',
  '茨城県',
  '栃木県',
  '群馬県',
  'その他'
];

export function PropertyFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [minRent, setMinRent] = useState(searchParams.get('minRent') || '');
  const [maxRent, setMaxRent] = useState(searchParams.get('maxRent') || '');
  const [prefecture, setPrefecture] = useState(searchParams.get('prefecture') || '');
  const [status, setStatus] = useState(searchParams.get('status') || ''); // 'available' or '' (all)

  // Update URL function
  const applyFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Rent
    if (minRent) params.set('minRent', minRent);
    else params.delete('minRent');
    
    if (maxRent) params.set('maxRent', maxRent);
    else params.delete('maxRent');
    
    // Region
    if (prefecture) params.set('prefecture', prefecture);
    else params.delete('prefecture');
    
    // Status (if 'available', set it. if empty, delete to show all)
    if (status) params.set('status', status);
    else params.delete('status');

    // Reset pagination on filter change
    params.delete('page');

    router.push(`/?${params.toString()}`);
  }, [minRent, maxRent, prefecture, status, router, searchParams]);

  // Debounce for text inputs isn't strictly necessary if we use a "Apply" button or onBlur, 
  // but let's use a "Apply" button style or auto-apply logic.
  // For simplicity and better UX on mobile, let's use immediate state update but apply on specific triggers or a dedicated button.
  // Actually, for a search form, "on change" for selects and "on blur/enter" for inputs is common, 
  // or just a big "Search" button. 
  // Let's go with a responsive Grid with a "絞り込む" button.

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        
        {/* Region Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">エリア</label>
          <select
            value={prefecture}
            onChange={(e) => setPrefecture(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
          >
            <option value="">全てのエリア</option>
            {PREFECTURES.map((pref) => (
              <option key={pref} value={pref}>{pref}</option>
            ))}
          </select>
        </div>

        {/* Rent Filter */}
        <div className="col-span-1 md:col-span-2">
           <label className="block text-sm font-medium text-gray-700 mb-1">賃料</label>
           <div className="flex items-center space-x-2">
             <input
               type="number"
               placeholder="下限なし"
               value={minRent}
               onChange={(e) => setMinRent(e.target.value)}
               className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
             />
             <span className="text-gray-400">〜</span>
             <input
               type="number"
               placeholder="上限なし"
               value={maxRent}
               onChange={(e) => setMaxRent(e.target.value)}
               className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
             />
           </div>
        </div>

        {/* Status & Submit */}
        <div className="flex items-center space-x-4">
           <div className="flex items-center h-10">
              <input
                id="status-available"
                type="checkbox"
                checked={status === 'available'}
                onChange={(e) => setStatus(e.target.checked ? 'available' : '')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="status-available" className="ml-2 block text-sm text-gray-700 select-none cursor-pointer">
                空室のみ
              </label>
           </div>
           
           <button
             onClick={applyFilter}
             className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
           >
             検索
           </button>
        </div>
      </div>
    </div>
  );
}
