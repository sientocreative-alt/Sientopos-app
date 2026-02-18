import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Check, X } from 'lucide-react';

const NewBreakRule = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        min_work_hours: '',
        max_work_hours: '',
        break_minutes: '',
        max_break_count: '0'
    });

    useEffect(() => {
        if (id && user) {
            fetchRule();
        }
    }, [id, user]);

    const fetchRule = async () => {
        const { data, error } = await supabase
            .from('staff_break_rules')
            .select('*')
            .eq('id', id)
            .single();

        if (data) {
            setFormData({
                min_work_hours: data.min_work_hours.toString(),
                max_work_hours: data.max_work_hours.toString(),
                break_minutes: data.break_minutes.toString(),
                max_break_count: (data.max_break_count || 0).toString()
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            business_id: user.business_id,
            min_work_hours: parseFloat(formData.min_work_hours),
            max_work_hours: parseFloat(formData.max_work_hours),
            break_minutes: parseInt(formData.break_minutes),
            max_break_count: parseInt(formData.max_break_count) || 0
        };

        let result;
        if (id) {
            result = await supabase
                .from('staff_break_rules')
                .update(payload)
                .eq('id', id);
        } else {
            result = await supabase
                .from('staff_break_rules')
                .insert([payload]);
        }

        if (!result.error) {
            navigate('/isletme/mola-sureleri');
        } else {
            alert('Hata: ' + result.error.message);
        }
        setLoading(false);
    };

    return (
        <div className="p-6 bg-[#F8F9FC] min-h-screen">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-800">{id ? 'Düzenle' : 'Yeni'}</h1>
                        <nav className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="hover:text-gray-600 transition-all cursor-pointer">Pano</span>
                            <span>•</span>
                            <span className="hover:text-gray-600 transition-all cursor-pointer">Personel Yönetimi</span>
                            <span>•</span>
                            <span className="hover:text-gray-600 transition-all cursor-pointer" onClick={() => navigate('/isletme/mola-sureleri')}>Mola Süreleri</span>
                            <span>•</span>
                            <span className="text-gray-600 font-medium">{id ? 'Düzenle' : 'Yeni'}</span>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden max-w-[1200px]">
                <div className="p-6 border-b border-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">Mola Süresi Ekle</h2>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                        {/* Min Hours */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">Çalışma Saati (Alt Sınır)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={formData.min_work_hours}
                                    onChange={(e) => setFormData({ ...formData, min_work_hours: e.target.value })}
                                    placeholder="Saat"
                                    className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium text-gray-600"
                                />
                            </div>
                        </div>

                        {/* Max Hours */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">Çalışma Saati (Üst Sınır)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={formData.max_work_hours}
                                    onChange={(e) => setFormData({ ...formData, max_work_hours: e.target.value })}
                                    placeholder="Saat"
                                    className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium text-gray-600"
                                />
                            </div>
                        </div>

                        {/* Break Minutes */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">Mola Süresi</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    value={formData.break_minutes}
                                    onChange={(e) => setFormData({ ...formData, break_minutes: e.target.value })}
                                    placeholder="Dakika"
                                    className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium text-gray-600"
                                />
                            </div>
                        </div>

                        {/* Max Break Count */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">Çıkabileceği Mola Sayısı</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    value={formData.max_break_count}
                                    onChange={(e) => setFormData({ ...formData, max_break_count: e.target.value })}
                                    placeholder="0"
                                    className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium text-gray-600"
                                />
                                <p className="mt-3 text-[11px] leading-relaxed text-gray-400 font-medium">
                                    Mola süresi dışında mola adeti ile de sınırlandırmak istiyorsanız sayı girebilirsiniz. Sınırlamak istemiyorsanız 0 olarak bırakabilirsiniz.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50/50 flex justify-end items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/isletme/mola-sureleri')}
                        className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#2196F3] text-white px-8 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Kaydediliyor...' : id ? 'Mola Süresini Güncelle' : 'Mola Süresi Ekle'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewBreakRule;
