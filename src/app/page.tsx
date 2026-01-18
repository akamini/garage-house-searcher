
import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';

import { Property } from '@/lib/types';

export const revalidate = 0; // Dynamic rendering for now, or use ISR with revalidate tag

export default async function Home() {
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from('Property')
    .select('*')
    .order('lastSeenAt', { ascending: false })
    .returns<Property[]>();

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Garage House Searcher
              <span className="ml-2 text-sm font-normal text-gray-500">
                  関東のガレージハウス新着情報
              </span>
            </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!properties || properties.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">物件情報がありません。</p>
            <p className="text-gray-400 text-sm mt-2">APIを実行してデータを収集してください。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop) => (
              <div key={prop.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100 flex flex-col">
                <div className="relative h-48 w-full bg-gray-200">
                  {prop.imageUrl && !prop.imageUrl.startsWith('data:') ? (
                    // Use standard img tag with key to ensure re-render if url changes
                    <img 
                      src={prop.imageUrl} 
                      alt={prop.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 bg-gray-100">
                      <span className="text-xs">No Image</span>
                    </div>
                  )}
                  {prop.status === 'occupied' && (
                    <div className="absolute top-2 right-2 bg-gray-900/80 text-white text-xs font-bold px-2 py-1 rounded">
                      満室
                    </div>
                  )}
                  {isNew(prop.firstSeenAt) && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      新着
                    </div>
                  )}
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs text-blue-600 font-semibold mb-1">{prop.source}</p>
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight mb-2">
                        <a href={prop.detailUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                            {prop.name}
                        </a>
                        </h3>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-2 flex items-center">
                    <span className="mr-1">📍</span> {prop.prefecture} {prop.address}
                  </p>
                  
                  <div className="mt-auto pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-end">
                        <div className="text-2xl font-bold text-gray-900">
                            {prop.rent ? `¥${prop.rent.toLocaleString()}` : <span className="text-sm text-gray-400">価格未公開</span>}
                        </div>
                        <a 
                            href={prop.detailUrl}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            詳細を見る →
                        </a>
                    </div>
                  </div>
                  
                  {prop.features && prop.features.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                          {prop.features.slice(0, 3).map((f, i) => (
                              <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                  {f}
                              </span>
                          ))}
                      </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function isNew(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    // New within 3 days
    return (now.getTime() - date.getTime()) < 3 * 24 * 60 * 60 * 1000;
}
