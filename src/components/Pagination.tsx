'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const searchParams = useSearchParams();

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    return `/?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center mt-10 space-x-2">
      {/* Prev */}
      {currentPage > 1 ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium"
        >
          前へ
        </Link>
      ) : (
        <span className="px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-sm font-medium cursor-not-allowed">
          前へ
        </span>
      )}

      {/* Pages */}
      <div className="hidden sm:flex space-x-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
          .map((p, i, arr) => {
             // Add ellipsis logic if needed, but for now simple gap check
             const prev = arr[i - 1];
             const showEllipsis = prev && p - prev > 1;

             return (
               <div key={p} className="flex">
                  {showEllipsis && <span className="px-2 py-2 text-gray-400">...</span>}
                  <Link
                    href={createPageUrl(p)}
                    className={`px-4 py-2 border rounded-md text-sm font-medium ${
                      currentPage === p
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </Link>
               </div>
             );
          })}
      </div>
      
      {/* Mobile Page Indicator (Simpler) */}
      <span className="sm:hidden flex items-center px-2 text-sm text-gray-600">
          {currentPage} / {totalPages}
      </span>

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium"
        >
          次へ
        </Link>
      ) : (
        <span className="px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-sm font-medium cursor-not-allowed">
          次へ
        </span>
      )}
    </div>
  );
}
