import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const HappyHourList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [happyHours, setHappyHours] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.business_id) {
            fetchHappyHours();
        }
    }, [user]);

    const fetchHappyHours = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('happy_hours')
                .select('*')
                .eq('business_id', user.business_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setHappyHours(data || []);
        } catch (error) {
            console.error('Error fetching happy hours:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu Happy Hour kaydını silmek istediğinize emin misiniz?')) {
            try {
                const { error } = await supabase
                    .from('happy_hours')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                fetchHappyHours();
            } catch (error) {
                console.error("Error deleting happy hour:", error);
                alert("Silme işlemi başarısız.");
            }
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">Happy Hour</h1>
                    <div className="text-xs text-gray-400 mt-1">
                        Pano • Mobil Uygulama • Happy Hour
                    </div>
                </div>
                <button
                    onClick={() => navigate('/isletme/happy-hour/yeni')}
                    className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-200 transition flex items-center gap-2"
                >
                    Yeni Happy Hour
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Başlık</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Başlama Tarihi</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Bitiş Tarihi</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Şube</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-400">Yükleniyor...</td></tr>
                        ) : happyHours.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-400">Tabloda herhangi bir veri mevcut değil</td></tr>
                        ) : (
                            happyHours.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 text-sm font-semibold text-gray-700">{item.title}</td>
                                    <td className="p-4 text-sm text-gray-600">{item.start_date}</td>
                                    <td className="p-4 text-sm text-gray-600">{item.end_date}</td>
                                    <td className="p-4 text-sm text-gray-600">{item.branch_name || '-'}</td>
                                    <td className="p-4 flex justify-center gap-2">
                                        <button
                                            onClick={() => navigate(`/isletme/happy-hour/duzenle/${item.id}`)}
                                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                                            title="Düzenle"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                            title="Sil"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HappyHourList;
