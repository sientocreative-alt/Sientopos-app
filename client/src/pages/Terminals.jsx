import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Pencil, Archive } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const Terminals = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [terminals, setTerminals] = useState([]);
    const [printers, setPrinters] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTerminals = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('terminals')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch printers to display names
            const { data: printerData } = await supabase
                .from('printers')
                .select('id, name')
                .eq('business_id', user.business_id)
                .is('is_deleted', false);

            setPrinters(printerData || []);
            setTerminals(data || []);
        } catch (error) {
            console.error('Error fetching terminals:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchTerminals();
    }, [user]);

    const handleDelete = async (id) => {
        if (!window.confirm('Bu terminali silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('terminals')
                .update({ is_deleted: true })
                .eq('id', id);

            if (error) throw error;
            fetchTerminals();
        } catch (error) {
            console.error('Error deleting terminal:', error);
            alert('Silme işlemi başarısız oldu.');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-bold text-gray-900 text-lg">Terminaller</span>
                    <span>Pano</span>
                    <span>•</span>
                    <span>POS Ayarları</span>
                    <span>•</span>
                    <span>Terminaller</span>
                </div>
                <div className="flex gap-3">
                    <button
                        className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                        onClick={() => navigate('/isletme/terminaller/yeni')}
                    >
                        Yeni Terminal
                    </button>
                    <button className="px-4 py-2 bg-orange-100 text-orange-600 rounded-lg font-medium hover:bg-orange-200 transition-colors">
                        Arşiv
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white border-b border-gray-50 text-gray-600 text-sm">
                            <th className="py-4 px-6 font-medium border-r border-gray-50">Terminal Adı</th>
                            <th className="py-4 px-6 font-medium border-r border-gray-50">E-Posta</th>
                            <th className="py-4 px-6 font-medium border-r border-gray-50">Varsayılan Yazıcı</th>
                            <th className="py-4 px-6 font-medium text-center">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan="3" className="py-8 text-center text-gray-500">Yükleniyor...</td>
                            </tr>
                        ) : terminals.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="py-8 text-center text-gray-400">
                                    Tabloda herhangi bir veri mevcut değil
                                </td>
                            </tr>
                        ) : (
                            terminals.map((terminal) => (
                                <tr key={terminal.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="py-4 px-6 font-medium text-gray-900 border-r border-gray-50">{terminal.name}</td>
                                    <td className="py-4 px-6 text-gray-600 border-r border-gray-50">{terminal.email}</td>
                                    <td className="py-4 px-6 text-gray-600 border-r border-gray-50">
                                        {printers.find(p => p.id === terminal.default_printer_id)?.name || '-'}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(terminal.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

export default Terminals;
