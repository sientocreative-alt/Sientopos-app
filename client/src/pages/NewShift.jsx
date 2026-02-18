import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

const NewShift = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        staff_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '18:00'
    });

    useEffect(() => {
        if (user) {
            fetchStaff();
        }
    }, [user]);

    const fetchStaff = async () => {
        const { data, error } = await supabase
            .from('staff')
            .select('id, first_name, last_name')
            .eq('business_id', user.business_id)
            .eq('is_archived', false);
        if (data) setStaff(data);
    };

    const calculateHours = (start, end) => {
        const [sH, sM] = start.split(':').map(Number);
        const [eH, eM] = end.split(':').map(Number);
        let diffInMinutes = (eH * 60 + eM) - (sH * 60 + sM);
        if (diffInMinutes < 0) diffInMinutes += 24 * 60;
        return (diffInMinutes / 60).toFixed(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.staff_id) return alert('Lütfen personel seçiniz.');

        setLoading(true);
        try {
            const hours = calculateHours(formData.start_time, formData.end_time);
            const { error } = await supabase
                .from('staff_shifts')
                .upsert({
                    business_id: user.business_id,
                    staff_id: formData.staff_id,
                    date: formData.date,
                    start_time: formData.start_time,
                    end_time: formData.end_time,
                    total_hours: hours
                }, { onConflict: 'staff_id, date' });

            if (error) throw error;
            navigate('/isletme/mesai-yonetimi');
        } catch (error) {
            console.error('Error saving shift:', error);
            alert('Mesai kaydedilemedi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 bg-[#F8F9FC] min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Yeni</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                        <span>Pano</span>
                        <span>•</span>
                        <span>Mesai Saatleri</span>
                        <span>•</span>
                        <span className="text-gray-600 font-medium">Yeni</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Mesai Ekle</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 max-w-[800px]">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 ml-1">Personel</label>
                        <div className="relative">
                            <select
                                value={formData.staff_id}
                                onChange={e => setFormData({ ...formData, staff_id: e.target.value })}
                                className="w-full bg-white border border-gray-200 text-gray-700 text-base rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/10 appearance-none font-medium transition-all"
                            >
                                <option value="">Seçiniz</option>
                                {staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-5 text-gray-400 pointer-events-none" size={20} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 ml-1">Gün</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            className="w-full bg-white border border-gray-200 text-gray-700 text-base rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/10 font-medium transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 ml-1">.* Başlangıç</label>
                            <input
                                type="time"
                                value={formData.start_time}
                                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                className="w-full bg-white border border-gray-200 text-gray-700 text-base rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/10 font-medium transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 ml-1">.* Bitiş</label>
                            <input
                                type="time"
                                value={formData.end_time}
                                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                className="w-full bg-white border border-gray-200 text-gray-700 text-base rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/10 font-medium transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-8 border-t border-gray-50">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-10 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all shadow-sm"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-10 py-4 bg-[#2196F3] text-white rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                        >
                            {loading ? 'Kaydediliyor...' : 'Mesai Ekle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewShift;
