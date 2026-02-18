import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Archive, Trash2, RotateCcw } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const OperationAuditSurveys = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('active');

    useEffect(() => {
        if (user) {
            fetchSurveys();
        }
    }, [user, statusFilter]);

    const fetchSurveys = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('operation_audit_surveys')
                .select('*')
                .eq('business_id', user.business_id)
                .eq('status', statusFilter)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSurveys(data || []);
        } catch (error) {
            console.error('Error fetching surveys:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleArchiveSurvey = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'active' ? 'archived' : 'active';
            const { error } = await supabase
                .from('operation_audit_surveys')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            fetchSurveys();
        } catch (error) {
            console.error('Error updating survey status:', error);
            alert('İşlem sırasında bir hata oluştu');
        }
    };

    const handleDeleteSurvey = async (id) => {
        if (!confirm('Bu anketi silmek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase
                .from('operation_audit_surveys')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchSurveys();
        } catch (error) {
            console.error('Error deleting survey:', error);
            alert('Silme işlemi sırasında bir hata oluştu');
        }
    };

    return (
        <div className="p-6 bg-[#F8F9FC] min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-800">Operasyon Denetim Anketi</h1>
                    <nav className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="hover:text-gray-600 transition-all cursor-pointer">Pano</span>
                        <span>•</span>
                        <span className="text-gray-600 font-medium">Operasyon Denetim Anketi</span>
                    </nav>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/isletme/operasyon-anketi/yeni')}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2"
                    >
                        Yeni Operasyon Denetim Anketi
                    </button>
                    <button
                        onClick={() => setStatusFilter(statusFilter === 'active' ? 'archived' : 'active')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${statusFilter === 'active'
                                ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            }`}
                    >
                        {statusFilter === 'active' ? 'Arşiv' : 'Aktif Anketler'}
                    </button>
                </div>
            </div>

            {/* List Card */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        Yükleniyor...
                    </div>
                ) : surveys.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        Tabloda herhangi bir veri mevcut değil
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-white border-b border-gray-100">
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 w-2/3">Tarih</th>
                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {surveys.map((survey) => (
                                <tr key={survey.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-all">
                                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                                        {new Date(survey.created_at).toLocaleString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 text-gray-800">
                                            <button
                                                onClick={() => navigate(`/isletme/operasyon-anketi/${survey.id}`)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Görüntüle"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleArchiveSurvey(survey.id, survey.status)}
                                                className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
                                                title={survey.status === 'active' ? 'Arşivle' : 'Geri Yükle'}
                                            >
                                                {survey.status === 'active' ? <Archive size={18} /> : <RotateCcw size={18} />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSurvey(survey.id)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Sil"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default OperationAuditSurveys;
