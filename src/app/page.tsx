
import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';

import { Property } from '@/lib/types';

export const revalidate = 0; // Dynamic rendering for now, or use ISR with revalidate tag

import { PropertyFilter } from '@/components/PropertyFilter';
import { Pagination } from '@/components/Pagination';

export default async function Home(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  // Parse Params
  const page = Number(searchParams.page) || 1;
  const minRent = searchParams.minRent ? Number(searchParams.minRent) : null;
  const maxRent = searchParams.maxRent ? Number(searchParams.maxRent) : null;
  const prefecture = typeof searchParams.prefecture === 'string' ? searchParams.prefecture : null;
  const status = searchParams.status === 'available' ? 'available' : null;

  const LIMIT = 24;
  const from = (page - 1) * LIMIT;
  const to = from + LIMIT - 1;

  // Build Query
  let query = supabase
    .from('Property')
    .select('*', { count: 'exact' });

  if (minRent) query = query.gte('rent', minRent);
  if (maxRent) query = query.lte('rent', maxRent);
  if (prefecture) query = query.eq('prefecture', prefecture);
  if (status === 'available') {
      // Logic: Show only non-occupied? Or explicit "available"?
      // DB has 'available', 'occupied', 'unknown'.
      // Usually "Available" filter means excluding "occupied".
      query = query.neq('status', 'occupied');
  }

  // Execute
  const { data, count, error } = await query
    .order('lastSeenAt', { ascending: false })
    .range(from, to)
    .returns<Property[]>();

  if (error) {
      console.error('Query Error:', error);
  }

  const properties = data || [];
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / LIMIT);

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
        
        {/* Filter Section */}
        <PropertyFilter />

        {/* Results Info */}
        <div className="mb-4 text-sm text-gray-500 flex justify-between items-end">
            <span>
                {totalCount}件中 {properties.length > 0 ? `${from + 1}〜${Math.min(to + 1, totalCount)}` : 0}件を表示
            </span>
        </div>

        {!properties || properties.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100 dash-border">
            <p className="text-gray-500 text-lg">条件に一致する物件が見つかりませんでした。</p>
            <p className="text-gray-400 text-sm mt-2">検索条件を変更してみてください。</p>
          </div>
        ) : (
          <>
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

            {/* Pagination */}
            <Pagination currentPage={page} totalPages={totalPages} />
          </>
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
