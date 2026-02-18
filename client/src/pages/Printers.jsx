import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Check, Pencil } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const Printers = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [printers, setPrinters] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPrinters = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('printers')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPrinters(data || []);
        } catch (error) {
            console.error('Error fetching printers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchPrinters();
    }, [user]);

    const handleSetAccountPrinter = async (id) => {
        try {
            // First, set all printers to false for account printer
            await supabase
                .from('printers')
                .update({ is_account_printer: false })
                .eq('business_id', user.business_id);

            // Then set the selected one to true
            const { error } = await supabase
                .from('printers')
                .update({ is_account_printer: true })
                .eq('id', id);

            if (error) throw error;
            fetchPrinters();
        } catch (error) {
            console.error('Error setting account printer:', error);
            alert('İşlem başarısız.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu yazıcıyı silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('printers')
                .update({ is_deleted: true })
                .eq('id', id);

            if (error) throw error;
            fetchPrinters();
        } catch (error) {
            console.error('Error deleting printer:', error);
            alert('Silme işlemi başarısız oldu.');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-bold text-gray-900 text-lg">Yazıcılar</span>
                    <span>Pano</span>
                    <span>•</span>
                    <span>POS Ayarları</span>
                    <span>•</span>
                    <span>Yazıcılar</span>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-medium hover:bg-blue-200 transition-colors" onClick={() => navigate('/isletme/yazicilar/yeni')}>
                        Yeni Yazıcı
                    </button>
                    <button className="px-4 py-2 bg-orange-100 text-orange-600 rounded-lg font-medium hover:bg-orange-200 transition-colors">
                        Arşiv
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm">
                            <th className="py-4 px-6 font-medium w-16"></th>
                            <th className="py-4 px-6 font-medium">Yazıcı Adı</th>
                            <th className="py-4 px-6 font-medium">Yazıcı Tipi</th>
                            <th className="py-4 px-6 font-medium">Bağlantı Türü</th>
                            <th className="py-4 px-6 font-medium">Hesap Yazıcısı Mı?</th>
                            <th className="py-4 px-6 font-medium text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="py-8 text-center text-gray-500">Yükleniyor...</td>
                            </tr>
                        ) : printers.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="py-8 text-center text-gray-500">Henüz tanımlı yazıcı bulunmamaktadır.</td>
                            </tr>
                        ) : (
                            printers.map((printer) => (
                                <tr key={printer.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="py-4 px-6 w-16">
                                        {/* Icon or placeholder */}
                                    </td>
                                    <td className="py-4 px-6 font-medium text-gray-900">{printer.name}</td>
                                    <td className="py-4 px-6 text-gray-600">{printer.printer_type}</td>
                                    <td className="py-4 px-6 text-gray-600">{printer.connection_type}</td>
                                    <td className="py-4 px-6 text-gray-600 pl-12">
                                        {printer.is_account_printer && (
                                            <Check className="text-gray-400" size={20} />
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {!printer.is_account_printer && (
                                                <button
                                                    onClick={() => handleSetAccountPrinter(printer.id)}
                                                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Hesap Yazıcısı Yap"
                                                >
                                                    <Check size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => navigate(`/isletme/yazicilar/duzenle/${printer.id}`)}
                                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Düzenle"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(printer.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 size={18} />
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
    );
};

export default Printers;
