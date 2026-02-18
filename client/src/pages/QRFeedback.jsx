import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const QRFeedback = () => {
    const { user } = useAuth();
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchFeedbacks();
        }
    }, [user]);

    const fetchFeedbacks = async () => {
        console.log('fetchFeedbacks called, user:', user);
        if (!user?.business_id) {
            console.warn('No business_id found for user');
            return;
        }
        setLoading(true);
        try {
            const url = `http://${window.location.hostname}:5000/isletme/qr/feedback/${user.business_id}`;
            console.log('Fetching from URL:', url);
            const response = await fetch(url);
            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Result:', result);

            if (result.success) {
                setFeedbacks(result.data || []);
            } else {
                console.error('API Error:', result.error);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFeedback = async (id) => {
        if (!window.confirm('Bu geri bildirimi silmek istediğinize emin misiniz?')) return;

        try {
            const response = await fetch(`http://${window.location.hostname}:5000/isletme/qr/feedback/${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success) {
                setFeedbacks(prev => prev.filter(f => f.id !== id));
            } else {
                alert('Silme işlemi başarısız: ' + result.error);
            }
        } catch (error) {
            console.error('Delete fetch error:', error);
            alert('Bir hata oluştu. Lütfen tekrar deneyin.');
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">Menü Geri Bildirimleri</h1>
                <div className="text-xs text-gray-400 mt-1">
                    Pano • Geri Bildirimler
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col overflow-hidden">
                <div className="p-8">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : feedbacks.length === 0 ? (
                        <div className="text-center py-20">
                            <h3 className="text-xl font-medium text-gray-700 mb-6">Geri Bildirim Bulunamadı!</h3>
                            <div className="w-64 h-64 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <img src="https://cdni.iconscout.com/illustration/premium/thumb/search-result-not-found-2130361-1800925.png" alt="Not Found" className="w-48 opacity-50 mix-blend-multiply" />
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                                        <th className="py-3 px-4">Ad Soyad</th>
                                        <th className="py-3 px-4">İletişim</th>
                                        <th className="py-3 px-4">Konu</th>
                                        <th className="py-3 px-4">Mesaj</th>
                                        <th className="py-3 px-4">Tarih</th>
                                        <th className="py-3 px-4 text-right">Aksiyonlar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feedbacks.map(feedback => (
                                        <tr key={feedback.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-4 font-medium text-gray-800">{feedback.full_name}</td>
                                            <td className="py-4 px-4 text-sm text-gray-600">
                                                <div>{feedback.phone}</div>
                                                <div className="text-xs text-gray-400">{feedback.email}</div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600">
                                                    {feedback.subject}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-gray-600 max-w-xs break-words">
                                                {feedback.message}
                                            </td>
                                            <td className="py-4 px-4 text-sm text-gray-500">
                                                {new Date(feedback.created_at).toLocaleDateString('tr-TR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteFeedback(feedback.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Sil"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRFeedback;
