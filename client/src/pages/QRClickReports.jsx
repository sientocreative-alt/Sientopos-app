import { useState } from 'react';
import { Search } from 'lucide-react';
// import emptyStateImg from '../assets/empty-state.png'; // Placeholder if we had one

const QRClickReports = () => {
    const [selectedMenu, setSelectedMenu] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const handleFilter = () => {
        setHasSearched(true);
        // Fetch report logic here
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">Pano</h1>
                <div className="text-xs text-blue-500 mt-1">Pano</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
                {/* Filter Bar */}
                <div className="flex gap-4 mb-8">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Menü Seçiniz"
                            value={selectedMenu}
                            onChange={(e) => setSelectedMenu(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <button
                        onClick={handleFilter}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Filtrele
                    </button>
                </div>

                {/* Content / Empty State */}
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-64 h-64 mb-6 relative">
                        {/* 
                           Simulating the illustration with a placeholder or simple SVG.
                           In a real app, we would import the specific SVG/PNG.
                        */}
                        <svg viewBox="0 0 200 200" className="w-full h-full text-gray-200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="100" cy="100" r="80" fill="#F3F4F6" />
                            <rect x="60" y="80" width="80" height="40" rx="4" fill="#E5E7EB" />
                            <path d="M90 110L100 120L110 110" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="100" cy="100" r="20" stroke="#6366F1" strokeWidth="2" strokeDasharray="4 4" />
                        </svg>
                    </div>
                    {!hasSearched && (
                        <p className="text-gray-500 text-sm">Raporları görüntülemek için filtreleme yapınız.</p>
                    )}
                    {hasSearched && (
                        <div className="w-full">
                            <p className="text-center text-gray-500">Veri bulunamadı.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRClickReports;
