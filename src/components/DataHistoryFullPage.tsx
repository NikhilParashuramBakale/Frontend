import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { NavigationMenu } from './NavigationMenu';
import { useMenu } from '../context/MenuContext';

type DataHistoryRow = {
  batId: string;
  location: string;
  date: string;
  frequency: string;
};

interface LocationState {
  data: DataHistoryRow[];
  clientName: string;
  serverName: string;
}

export function DataHistoryFullPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isExpanded } = useMenu();
  const state = location.state as LocationState | undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!state?.data) {
      navigate('/');
    }
  }, [state, navigate]);

  if (!state?.data) return null;

  const { data, clientName, serverName } = state;

  const [globalSearch, setGlobalSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof DataHistoryRow | null; direction: 'asc' | 'desc'; }>({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 25;

  const filteredData = data.filter((row) => {
    const q = globalSearch.toLowerCase();
    return (
      row.batId.toLowerCase().includes(q) ||
      row.location.toLowerCase().includes(q) ||
      row.date.toLowerCase().includes(q) ||
      row.frequency.toLowerCase().includes(q)
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    if (sortConfig.key === 'frequency') {
      const aNum = parseFloat(String(a.frequency).replace(/[^\d.]/g, '')) || 0;
      const bNum = parseFloat(String(b.frequency).replace(/[^\d.]/g, '')) || 0;
      return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
    }
    const av = String(a[sortConfig.key]).toLowerCase();
    const bv = String(b[sortConfig.key]).toLowerCase();
    if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
    if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSort = (key: keyof DataHistoryRow) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setGlobalSearch(value);
    setCurrentPage(1);
  };

  const handleBatIdClick = (batId: string) => {
    // Extract server and client numbers from serverName and clientName
    const serverNum = serverName.replace('Server ', '');
    const clientNum = clientName.replace('Client ', '');
    
    console.log('BAT ID clicked:', {
      batId,
      serverName,
      clientName,
      serverNum,
      clientNum,
      navigatingTo: `/bat/${serverNum}/${clientNum}/${batId}`
    });
    
    // Navigate using React Router - component will re-mount due to key prop
    navigate(`/bat/${serverNum}/${clientNum}/${batId}`);
  };
  const handleBack = () => navigate('/');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 to-blue-50/30 relative">
      <NavigationMenu />

      <div className={`bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 shadow-lg transition-all duration-300 ${isExpanded ? 'ml-64' : 'ml-16'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 border-b border-emerald-600/20 h-16 flex items-center">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">Data History - Full View</h1>
              <p className="text-sm text-emerald-100">{serverName} - {clientName}</p>
            </div>
          </div>
          {/* Removed total records from header as requested */}
          <div className="ml-auto"></div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto px-4 py-8 transition-all duration-300 ${isExpanded ? 'ml-64' : 'ml-16'}`}>
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search BAT ID, Location, Date, or Frequency..."
                  value={globalSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pl-9"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              <div className="text-sm text-gray-600 whitespace-nowrap">{sortedData.length} of {data.length} records</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed divide-y divide-gray-200">
              <colgroup>
                <col className="w-1/4" />
                <col className="w-1/4" />
                <col className="w-1/4" />
                <col className="w-1/4" />
              </colgroup>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('batId')}>
                    <div className="flex items-center gap-2">BAT ID<ArrowUpDown className="w-4 h-4" /></div>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('location')}>
                    <div className="flex items-center gap-2">Location<ArrowUpDown className="w-4 h-4" /></div>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-2">Date<ArrowUpDown className="w-4 h-4" /></div>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('frequency')}>
                    <div className="flex items-center gap-2">Frequency<ArrowUpDown className="w-4 h-4" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((row, index) => (
                  <tr key={`${row.batId}-${index}`} className="hover:bg-emerald-50/40 transition-colors duration-200">
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline" onClick={() => handleBatIdClick(row.batId)}>BAT{row.batId}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{row.location}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{row.date}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{row.frequency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, sortedData.length)} of {sortedData.length} entries</div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <button key={pageNum} className={`px-3 py-1 text-sm rounded border transition-colors ${pageNum === currentPage ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`} onClick={() => setCurrentPage(pageNum)}>
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button className="px-3 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}