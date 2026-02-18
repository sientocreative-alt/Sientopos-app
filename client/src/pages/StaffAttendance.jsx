import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, ChevronLeft, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';

const StaffAttendance = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [records, setRecords] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterOpen, setFilterOpen] = useState(false);

    useEffect(() => {
        if (user) {
            fetchStaff();
            fetchRecords();
        }
    }, [user, currentMonth]);

    const fetchStaff = async () => {
        const { data } = await supabase
            .from('staff')
            .select('id, first_name, last_name')
            .eq('business_id', user.business_id)
            .eq('is_archived', false);
        if (data) setStaff(data);
    };

    const fetchRecords = async () => {
        setLoading(true);
        const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

        const { data, error } = await supabase
            .from('staff_attendance')
            .select(`
                *,
                staff:staff_id (
                    first_name,
                    last_name
                )
            `)
            .eq('business_id', user.business_id)
            .gte('check_in', start)
            .lte('check_in', end)
            .order('check_in', { ascending: false });

        if (data) setRecords(data);
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
            const { error } = await supabase
                .from('staff_attendance')
                .delete()
                .eq('id', id);

            if (!error) {
                fetchRecords();
            }
        }
    };

    const formatDuration = (minutes) => {
        if (!minutes) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}s ${mins}dk`;
    };

    return (
        <div className="p-6 bg-[#F8F9FC] min-h-screen">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-800">Personel Takip</h1>
                        <nav className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="hover:text-gray-600 transition-all cursor-pointer">Pano</span>
                            <span>•</span>
                            <span className="hover:text-gray-600 transition-all cursor-pointer">Personel Yönetimi</span>
                            <span>•</span>
                            <span className="text-gray-600 font-medium">Personel Takip</span>
                        </nav>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-blue-50 text-blue-500 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-100 transition-all"
                        >
                            <ChevronLeft size={18} /> Önceki Ay
                        </button>
                        <button
                            onClick={() => navigate('/isletme/personel-saat/yeni')}
                            className="bg-[#2196F3] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                        >
                            <Plus size={18} /> Kayıt Ekle
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 mb-6 overflow-hidden">
                <button
                    onClick={() => setFilterOpen(!filterOpen)}
                    className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-all"
                >
                    <span className="text-sm font-bold text-gray-700">Filtreler</span>
                    <ChevronDown size={18} className={`text-gray-400 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                </button>
                {filterOpen && (
                    <div className="px-6 pb-6 border-t border-gray-50">
                        <div className="text-xs text-gray-400 mb-2 mt-4">Ay Seçimi</div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 hover:bg-gray-100 transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="flex-1 text-center font-bold text-gray-700">
                                {format(currentMonth, 'MMMM yyyy', { locale: tr })}
                            </div>
                            <button
                                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 hover:bg-gray-100 transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Records Card */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">
                        {format(currentMonth, 'yyyy MMMM', { locale: tr })} Ayı Personel Giriş - Çıkış Saatleri
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-900 text-white">
                                <th className="px-8 py-4 text-center text-xs font-bold uppercase tracking-widest">Tarih</th>
                                <th className="px-8 py-4 text-center text-xs font-bold uppercase tracking-widest">Ad</th>
                                <th className="px-8 py-4 text-center text-xs font-bold uppercase tracking-widest">Giriş</th>
                                <th className="px-8 py-4 text-center text-xs font-bold uppercase tracking-widest">Çıkış</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-10 text-center text-gray-400 italic">Yükleniyor...</td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-10 text-center text-gray-400 italic">Bu ay için kayıt bulunamadı.</td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.id} className="group hover:bg-gray-50/50 transition-all">
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-sm font-bold text-gray-700">
                                                {format(new Date(record.check_in), 'dd/MM/yyyy')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-sm font-bold text-gray-700">
                                                {record.staff?.first_name} {record.staff?.last_name}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-sm font-medium text-gray-600">
                                                {format(new Date(record.check_in), 'HH:mm')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center relative">
                                            <span className="text-sm font-medium text-gray-600">
                                                {record.check_out ? format(new Date(record.check_out), 'HH:mm') : '-'}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(record.id)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-red-50 rounded-lg text-red-500 hover:bg-red-100 transition-all opacity-0 group-hover:opacity-100"
                                                title="Sil"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StaffAttendance;
