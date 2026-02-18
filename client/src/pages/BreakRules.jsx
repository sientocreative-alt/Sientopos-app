import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, HelpCircle } from 'lucide-react';

const BreakRules = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchRules();
        }
    }, [user]);

    const fetchRules = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('staff_break_rules')
            .select('*')
            .eq('business_id', user.business_id)
            .order('min_work_hours', { ascending: true });

        if (data) setRules(data);
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu mola kuralını silmek istediğinize emin misiniz?')) {
            const { error } = await supabase
                .from('staff_break_rules')
                .delete()
                .eq('id', id);

            if (!error) {
                fetchRules();
            }
        }
    };

    return (
        <div className="p-6 bg-[#F8F9FC] min-h-screen">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-800">Mola Süreleri</h1>
                        <nav className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="hover:text-gray-600 transition-all cursor-pointer">Pano</span>
                            <span>•</span>
                            <span className="hover:text-gray-600 transition-all cursor-pointer">Personel Yönetimi</span>
                            <span>•</span>
                            <span className="text-gray-600 font-medium">Mola Süreleri</span>
                        </nav>
                    </div>
                </div>
            </div>

            {/* List Card */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Mola Süreleri</h2>
                    <button
                        onClick={() => navigate('/isletme/mola-sureleri/yeni')}
                        className="bg-[#2196F3] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={18} /> Yeni Mola Süresi
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest italic w-1/3">Çalışma Saat Aralığı</th>
                                <th className="px-8 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest italic w-1/3">
                                    <div className="flex items-center justify-center gap-1">
                                        Mola Süresi
                                        <HelpCircle size={14} className="text-blue-400" />
                                    </div>
                                </th>
                                <th className="px-8 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest italic w-1/3">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="px-8 py-10 text-center text-gray-400 italic">Yükleniyor...</td>
                                </tr>
                            ) : rules.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-8 py-10 text-center text-gray-400 italic">Henüz mola kuralı tanımlanmamış.</td>
                                </tr>
                            ) : (
                                rules.map((rule) => (
                                    <tr key={rule.id} className="group hover:bg-gray-50/50 transition-all">
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-sm font-bold text-gray-700">
                                                {rule.min_work_hours} - {rule.max_work_hours} Saat
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-sm font-bold text-gray-700">
                                                {rule.break_minutes} Dakika
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/isletme/mola-sureleri/duzenle/${rule.id}`)}
                                                    className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-xl text-blue-500 hover:bg-blue-100 transition-all shadow-sm"
                                                    title="Düzenle"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(rule.id)}
                                                    className="w-10 h-10 flex items-center justify-center bg-red-50 rounded-xl text-red-500 hover:bg-red-100 transition-all shadow-sm"
                                                    title="Sil"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
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

export default BreakRules;
