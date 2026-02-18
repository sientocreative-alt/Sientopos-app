import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const NewAttendanceRecord = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [staff, setStaff] = useState([]);

    const [formData, setFormData] = useState({
        staff_id: '',
        check_in_date: '',
        check_in_time: ''
    });

    useEffect(() => {
        if (user) {
            fetchStaff();
        }
    }, [user]);

    const fetchStaff = async () => {
        const { data } = await supabase
            .from('staff')
            .select('id, first_name, last_name')
            .eq('business_id', user.business_id)
            .eq('is_archived', false)
            .order('first_name');

        if (data) setStaff(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Combine date and time into a timestamp
        const checkInTimestamp = `${formData.check_in_date}T${formData.check_in_time}:00`;

        const payload = {
            business_id: user.business_id,
            staff_id: formData.staff_id,
            check_in: checkInTimestamp,
            check_out: null,
            total_minutes: null
        };

        const { error } = await supabase
            .from('staff_attendance')
            .insert([payload]);

        if (!error) {
            navigate('/isletme/personel-saat');
        } else {
            alert('Hata: ' + error.message);
        }
        setLoading(false);
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
                            <span className="hover:text-gray-600 transition-all cursor-pointer" onClick={() => navigate('/isletme/personel-saat')}>Personel Takip</span>
                            <span>•</span>
                            <span className="text-gray-600 font-medium">Yeni</span>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden max-w-[1200px]">
                <div className="p-6 border-b border-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">Kayıt Ekle</h2>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        {/* Staff Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">
                                <span className="text-red-500">*</span> Personel
                            </label>
                            <select
                                required
                                value={formData.staff_id}
                                onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                                className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium text-gray-600"
                            >
                                <option value="">Seçiniz</option>
                                {staff.map(member => (
                                    <option key={member.id} value={member.id}>
                                        {member.first_name} {member.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date/Time */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">
                                <span className="text-red-500">*</span> Tarih / Saat
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="date"
                                    required
                                    value={formData.check_in_date}
                                    onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                                    className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium text-gray-600"
                                />
                                <input
                                    type="time"
                                    required
                                    value={formData.check_in_time}
                                    onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                                    className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium text-gray-600"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50/50 flex justify-end items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/isletme/personel-saat')}
                        className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#2196F3] text-white px-8 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Kaydediliyor...' : 'Kayıt Ekle'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewAttendanceRecord;
