import { useState, useRef, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, subDays, startOfWeek, endOfWeek, addDays, getDay, isWithinInterval } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const Subeler = () => {
    const { user } = useAuth();
    const [filteredData, setFilteredData] = useState([]);
    const [totals, setTotals] = useState({
        ciro: 0, servis: 0, kk: 0, nakit: 0, ikram: 0, iptal: 0, atik: 0
    });
    const [loading, setLoading] = useState(false);

    // Date Picker State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: startOfMonth(new Date()),
        end: new Date()
    });
    const [activePreset, setActivePreset] = useState('Bu Ay');
    const [viewDate, setViewDate] = useState(new Date());
    const datePickerRef = useRef(null);

    const [isFiltered, setIsFiltered] = useState(false);

    // Initial Filter Application
    useEffect(() => {
        if (user?.business_id) {
            applyFilter();
        }
    }, [user]);

    const fetchReportData = async (start, end) => {
        setLoading(true);
        try {
            const startDateStr = start.toISOString();
            const endDateStr = end.toISOString();

            // 1. Fetch all businesses (branches) linked to the user's business context
            const { data: businesses, error: busError } = await supabase
                .from('businesses')
                .select('id, name')
                .eq('id', user.business_id);

            if (busError) throw busError;

            // 2. Fetch payments for the given period (SOURCE OF TRUTH FOR REVENUE)
            const { data: payments, error: paymentsError } = await supabase
                .from('payments')
                .select('amount, payment_method, created_at')
                .eq('business_id', user.business_id)
                .gte('created_at', startDateStr)
                .lte('created_at', endDateStr);

            if (paymentsError) throw paymentsError;

            // 3. Fetch order items for the given period (ONLY FOR NON-REVENUE STATS: Gift, Cancel, Waste)
            const { data: items, error: itemsError } = await supabase
                .from('order_items')
                .select('price, quantity, modifiers, status, created_at')
                .eq('business_id', user.business_id)
                .gte('created_at', startDateStr)
                .lte('created_at', endDateStr)
                .in('status', ['gift', 'cancel', 'waste']);

            if (itemsError) throw itemsError;

            // 4. Fetch POS settings for the branch name
            const { data: settings } = await supabase
                .from('pos_settings')
                .select('full_name, business_display_name')
                .eq('business_id', user.business_id)
                .single();

            const branchName = settings?.business_display_name || businesses[0]?.name || settings?.full_name || 'İsimsiz Şube';

            // 5. Aggregation
            const stats = {
                name: branchName,
                ciro: 0,
                servis: 0,
                kk: 0,
                nakit: 0,
                ikram: 0,
                iptal: 0,
                atik: 0
            };

            // Aggregate Revenues from Payments
            payments.forEach(p => {
                const amount = parseFloat(p.amount || 0);
                stats.ciro += amount;
                if (p.payment_method === 'Kredi Kartı') {
                    stats.kk += amount;
                } else {
                    stats.nakit += amount;
                }
            });

            // Aggregate Non-Revenue items from Order Items
            items.forEach(item => {
                const totalItemPrice = (item.price + (item.modifiers?.reduce((sum, m) => sum + (m.price || 0), 0) || 0)) * item.quantity;
                if (item.status === 'gift') {
                    stats.ikram += totalItemPrice;
                } else if (item.status === 'cancel') {
                    stats.iptal += totalItemPrice;
                } else if (item.status === 'waste') {
                    stats.atik += totalItemPrice;
                }
            });

            setFilteredData([stats]);

            const totalSum = {
                ciro: stats.ciro,
                servis: stats.servis,
                kk: stats.kk,
                nakit: stats.nakit,
                ikram: stats.ikram,
                iptal: stats.iptal,
                atik: stats.atik
            };
            setTotals(totalSum);

        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = (overrideRange) => {
        const currentRange = overrideRange || dateRange;
        if (!currentRange.start) return;

        const start = new Date(currentRange.start);
        start.setHours(0, 0, 0, 0);
        const end = currentRange.end ? new Date(currentRange.end) : new Date(start);
        end.setHours(23, 59, 59, 999);

        fetchReportData(start, end);
    };

    const handleFilterClick = () => {
        applyFilter();
        setShowDatePicker(false);
        setIsFiltered(true);
    };

    const handleClearFilter = () => {
        const defaultRange = { start: startOfMonth(new Date()), end: new Date() };
        setDateRange(defaultRange);
        setActivePreset('Bu Ay');
        applyFilter(defaultRange);
        setIsFiltered(false);
    };

    const fmtMoney = (amount) => {
        return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' ₺';
    };

    const handleExport = () => {
        import('xlsx').then(XLSX => {
            const exportData = filteredData.map(row => ({
                'Şube Adı': row.name,
                'Ciro': row.ciro,
                'Servis Ücreti': row.servis,
                'Kredi Kartı': row.kk,
                'Nakit': row.nakit,
                'İkram': row.ikram,
                'İptal': row.iptal,
                'Atık': row.atik
            }));

            if (filteredData.length > 0) {
                exportData.push({
                    'Şube Adı': 'TOPLAM',
                    'Ciro': totals.ciro,
                    'Servis Ücreti': totals.servis,
                    'Kredi Kartı': totals.kk,
                    'Nakit': totals.nakit,
                    'İkram': totals.ikram,
                    'İptal': totals.iptal,
                    'Atık': totals.atik
                });
            }

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wscols = Object.keys(exportData[0] || {}).map(() => ({ wch: 15 }));
            ws['!cols'] = wscols;

            XLSX.utils.book_append_sheet(wb, ws, "Şube Ciroları");
            XLSX.writeFile(wb, "Sube_Cirolari.xlsx");
        });
    };

    // --- Existing DatePicker Logic (kept roughly same) ---
    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setShowDatePicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const presets = [
        { label: 'Bugün', action: () => setPreset(new Date(), new Date()) },
        { label: 'Dün', action: () => setPreset(subDays(new Date(), 1), subDays(new Date(), 1)) },
        { label: 'Son 7 Gün', action: () => setPreset(subDays(new Date(), 6), new Date()) },
        { label: 'Son 30 Gün', action: () => setPreset(subDays(new Date(), 29), new Date()) },
        { label: 'Bu Ay', action: () => setPreset(startOfMonth(new Date()), new Date()) },
        { label: 'Geçen Ay', action: () => { const last = subDays(startOfMonth(new Date()), 1); setPreset(startOfMonth(last), endOfMonth(last)); } },
        { label: 'Tüm Zamanlar', action: () => setPreset(new Date(2023, 0, 1), new Date()) },
    ];

    const setPreset = (start, end) => {
        setDateRange({ start, end });
    };

    const generateMonthDays = (baseDate) => {
        const startDate = startOfWeek(startOfMonth(baseDate), { weekStartsOn: 1 });
        const endDate = endOfWeek(endOfMonth(startOfMonth(baseDate)), { weekStartsOn: 1 });
        return eachDayOfInterval({ start: startDate, end: endDate });
    };

    const month1 = viewDate;
    const month2 = addMonths(viewDate, 1);
    const days1 = generateMonthDays(month1);
    const days2 = generateMonthDays(month2);
    const weekDays = ['Pt', 'Sa', 'Çr', 'Pe', 'Cu', 'Ct', 'Pz'];

    const handleDateClick = (day) => {
        setActivePreset('Diğer');
        if (!dateRange.start || (dateRange.start && dateRange.end)) {
            setDateRange({ start: day, end: null });
        } else {
            if (day < dateRange.start) setDateRange({ start: day, end: dateRange.start });
            else setDateRange({ ...dateRange, end: day });
        }
    };

    const isSelected = (day) => {
        if (!dateRange.start) return false;
        if (dateRange.end) return day >= dateRange.start && day <= dateRange.end;
        return isSameDay(day, dateRange.start);
    };

    const formatDateInput = () => {
        if (!dateRange.start) return '';
        const startStr = format(dateRange.start, 'dd/MM/yyyy');
        const endStr = dateRange.end ? format(dateRange.end, 'dd/MM/yyyy') : startStr;
        return `${startStr} - ${endStr}`;
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">Şubeler</h1>
                    <div className="text-xs text-gray-400 mt-1 flex gap-1">
                        <span>Pano</span>
                        <span>•</span>
                        <span>Faturalar</span>
                        <span>•</span>
                        <span>Şubeler</span>
                    </div>
                </div>
                <button
                    onClick={handleExport}
                    className="bg-purple-100 text-purple-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-200 transition flex items-center gap-2"
                >
                    <Download size={16} /> Excele aktar
                </button>
            </div>

            {/* Content Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[500px]">

                {/* Filter Section */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 relative z-10">
                    <h2 className="text-lg font-bold text-gray-800 self-start md:self-center">Şube Ciroları</h2>

                    <div className="flex items-center gap-2 w-full md:w-auto relative" ref={datePickerRef}>
                        <div className="relative flex-1 md:flex-none">
                            <input
                                readOnly
                                type="text"
                                value={formatDateInput()}
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className="w-full md:w-72 pl-4 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-purple-500 transition cursor-pointer bg-white"
                            />

                            {showDatePicker && (
                                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-100 shadow-2xl rounded-xl flex overflow-hidden w-[700px] z-50">
                                    <div className="w-40 bg-gray-50/50 border-r border-gray-100 p-2 flex flex-col gap-1">
                                        {presets.map((preset) => (
                                            <button key={preset.label} onClick={() => { setActivePreset(preset.label); preset.action(); }} className={`text-left px-3 py-2 text-sm rounded-lg transition-colors ${activePreset === preset.label ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>{preset.label}</button>
                                        ))}
                                    </div>
                                    <div className="flex-1 p-4">
                                        <div className="flex justify-between items-center mb-4 px-2">
                                            <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="text-gray-400 hover:text-gray-600"><ChevronLeft size={20} /></button>
                                            <div className="flex gap-8 font-semibold text-gray-700">
                                                <span className="w-32 text-center">{format(month1, 'MMMM yyyy', { locale: tr })}</span>
                                                <span className="w-32 text-center">{format(month2, 'MMMM yyyy', { locale: tr })}</span>
                                            </div>
                                            <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="text-gray-400 hover:text-gray-600"><ChevronRight size={20} /></button>
                                        </div>
                                        <div className="flex gap-8">
                                            {[days1, days2].map((days, mIdx) => (
                                                <div key={mIdx} className="flex-1">
                                                    <div className="grid grid-cols-7 mb-2">{weekDays.map(d => <div key={d} className="text-xs font-bold text-gray-400 text-center">{d}</div>)}</div>
                                                    <div className="grid grid-cols-7 gap-1">
                                                        {days.map((day, idx) => {
                                                            const isCurMonth = isSameMonth(day, mIdx === 0 ? month1 : month2);
                                                            return (
                                                                <button key={idx} onClick={() => handleDateClick(day)} className={`h-8 w-8 rounded-full text-sm flex items-center justify-center transition ${!isCurMonth ? 'text-gray-300' : 'text-gray-700'} ${isSelected(day) ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm' : 'hover:bg-gray-100'} ${isSameDay(day, dateRange.start) ? 'bg-blue-600' : ''}`}>{format(day, 'd')}</button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <button onClick={handleFilterClick} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">Uygula</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleFilterClick}
                            className="bg-blue-100 text-blue-600 px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-200 transition flex items-center gap-2"
                        >
                            <Search size={16} /> Filtrele
                        </button>

                        {isFiltered && (
                            <button
                                onClick={handleClearFilter}
                                className="bg-red-100 text-red-500 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 transition flex items-center gap-2"
                            >
                                <X size={16} /> Filtreyi Temizle
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto relative z-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-medium">Veriler yükleniyor...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="py-4 pl-4 rounded-l-lg">ŞUBE ADI</th>
                                    <th className="py-4 text-center">CİRO</th>
                                    <th className="py-4 text-center">SERVİS ÜCRETİ</th>
                                    <th className="py-4 text-center">KREDİ KARTI</th>
                                    <th className="py-4 text-center">NAKİT</th>
                                    <th className="py-4 text-center">İKRAM</th>
                                    <th className="py-4 text-center">İPTAL</th>
                                    <th className="py-4 pr-4 text-center rounded-r-lg">ATIK</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-medium">
                                {filteredData.length > 0 && totals.ciro > 0 ? (
                                    <>
                                        {filteredData.map((row, idx) => (
                                            <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                                                <td className="py-5 pl-4 text-gray-800">{row.name}</td>
                                                <td className="py-5 text-center text-gray-800">{fmtMoney(row.ciro)}</td>
                                                <td className="py-5 text-center text-gray-800">{fmtMoney(row.servis)}</td>
                                                <td className="py-5 text-center text-gray-800">{fmtMoney(row.kk)}</td>
                                                <td className="py-5 text-center text-gray-800">{fmtMoney(row.nakit)}</td>
                                                <td className="py-5 text-center text-gray-800">{fmtMoney(row.ikram)}</td>
                                                <td className="py-5 text-center text-gray-800">{fmtMoney(row.iptal)}</td>
                                                <td className="py-5 pr-4 text-center text-gray-800">{fmtMoney(row.atik)}</td>
                                            </tr>
                                        ))}
                                        {/* Total Row */}
                                        <tr className="hover:bg-gray-50/50 transition bg-gray-50/30">
                                            <td className="py-5 pl-4 font-bold text-gray-800">TOPLAM</td>
                                            <td className="py-5 text-center font-bold text-gray-800">{fmtMoney(totals.ciro)}</td>
                                            <td className="py-5 text-center font-bold text-gray-800">{fmtMoney(totals.servis)}</td>
                                            <td className="py-5 text-center font-bold text-gray-800">{fmtMoney(totals.kk)}</td>
                                            <td className="py-5 text-center font-bold text-gray-800">{fmtMoney(totals.nakit)}</td>
                                            <td className="py-5 text-center font-bold text-gray-800">{fmtMoney(totals.ikram)}</td>
                                            <td className="py-5 text-center font-bold text-gray-800">{fmtMoney(totals.iptal)}</td>
                                            <td className="py-5 pr-4 text-center font-bold text-gray-800">{fmtMoney(totals.atik)}</td>
                                        </tr>
                                    </>
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="py-20 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <Search size={40} className="text-gray-200" />
                                                <p>Seçilen tarih aralığında veri bulunamadı.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Subeler;
