import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Smartphone, Monitor, Tablet } from 'lucide-react';

const Devices = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchDevices();
        }
    }, [user]);

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('devices')
                .select('*')
                .eq('business_id', user.business_id)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDevices(data || []);
        } catch (error) {
            console.error('Error fetching devices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu cihazı silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('devices')
                .update({ is_deleted: true })
                .eq('id', id);

            if (error) throw error;
            fetchDevices();
        } catch (error) {
            console.error('Error deleting device:', error);
            alert('Silme işlemi başarısız oldu.');
        }
    };

    if (loading) return <div className="p-6">Yükleniyor...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <h1 className="text-2xl font-bold text-gray-800">Tanımlı Cihazlar</h1>
                    <span>Pano</span>
                    <span>•</span>
                    <span>POS Ayarları</span>
                    <span>•</span>
                    <span>Tanımlı Cihazlar</span>
                </div>
                <button
                    onClick={() => navigate('/isletme/cihazlar/yeni')}
                    className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                >
                    Yeni Tanımlı Cihaz
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Cihaz Adı</th>
                                <th className="p-4 font-semibold text-gray-600">Platform</th>
                                <th className="p-4 font-semibold text-gray-600">Terminal Türü</th>
                                <th className="p-4 font-semibold text-gray-600">Cihaz ID'si</th>
                                <th className="p-4 font-semibold text-gray-600 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {devices.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        Henüz tanımlı cihaz bulunmamaktadır.
                                    </td>
                                </tr>
                            ) : (
                                devices.map((device) => (
                                    <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-800">{device.name}</td>
                                        <td className="p-4 text-gray-600">{device.platform}</td>
                                        <td className="p-4 text-gray-600">{device.terminal_type}</td>
                                        <td className="p-4 text-gray-500 font-mono text-sm">{device.device_id}</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDelete(device.id)}
                                                className="p-2 text-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
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
        </div>
    );
};

export default Devices;
