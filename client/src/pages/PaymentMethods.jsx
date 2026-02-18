import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Printer, Calculator, Archive, Move, Pencil, XCircle } from 'lucide-react';

const PaymentMethods = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [methods, setMethods] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchPaymentMethods();
        }
    }, [user]);

    const fetchPaymentMethods = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('payment_methods')
                .select('*')
                .eq('business_id', user.business_id)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMethods(data || []);
        } catch (error) {
            console.error('Error fetching payment methods:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu ödeme yöntemini silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('payment_methods')
                .update({ is_deleted: true })
                .eq('id', id);

            if (error) throw error;
            fetchPaymentMethods();
        } catch (error) {
            console.error('Error deleting method:', error);
        }
    };

    if (loading) return <div className="p-6">Yükleniyor...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <h1 className="text-2xl font-bold text-gray-800">Ödeme Yöntemleri</h1>
                    <span>Pano</span>
                    <span>•</span>
                    <span>POS Ayarları</span>
                    <span>•</span>
                    <span>Ödeme Yöntemleri</span>
                </div>
                <button
                    onClick={() => navigate('/isletme/odeme-yontemleri/yeni')}
                    className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                >
                    Yeni Ödeme Yöntemi
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {methods.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Henüz ödeme yöntemi eklenmemiş.
                        </div>
                    ) : (
                        methods.map((method) => (
                            <div key={method.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    {/* Move Icon (Visual) */}
                                    <div className="text-gray-300 cursor-move">
                                        <Move size={18} />
                                    </div>
                                    <span className="font-medium text-gray-800">{method.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Edit Button */}
                                    <button
                                        onClick={() => navigate(`/isletme/odeme-yontemleri/duzenle/${method.id}`)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Düzenle"
                                    >
                                        <Pencil size={18} />
                                    </button>

                                    {/* Delete/Passive Button styled as X in circle */}
                                    <button
                                        onClick={() => handleDelete(method.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Pasif Et / Sil"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentMethods;
