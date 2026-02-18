import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const StaffRoles = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchRoles();
        }
    }, [user]);

    const fetchRoles = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('staff_roles')
            .select('*')
            .eq('business_id', user.business_id)
            .order('role_name', { ascending: true });

        if (data) setRoles(data);
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu rolü silmek istediğinize emin misiniz?')) {
            const { error } = await supabase
                .from('staff_roles')
                .delete()
                .eq('id', id);

            if (!error) {
                fetchRoles();
            }
        }
    };

    return (
        <div className="p-6 bg-[#F8F9FC] min-h-screen">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-800">Personel Rolleri</h1>
                        <nav className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="hover:text-gray-600 transition-all cursor-pointer">Pano</span>
                            <span>•</span>
                            <span className="hover:text-gray-600 transition-all cursor-pointer">Personel Yönetimi</span>
                            <span>•</span>
                            <span className="text-gray-600 font-medium">Personel Rolleri</span>
                        </nav>
                    </div>
                    <button
                        onClick={() => navigate('/isletme/personel-rolleri/yeni')}
                        className="bg-[#2196F3] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={18} /> Yeni Personel Rolü
                    </button>
                </div>
            </div>

            {/* Roles Table */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-gray-400 italic">
                        Yükleniyor...
                    </div>
                ) : roles.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 italic">
                        Henüz rol tanımlanmamış.
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Görevi</th>
                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map((role) => (
                                <tr key={role.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-all">
                                    <td className="px-6 py-4 text-sm text-gray-700">{role.role_name}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => navigate(`/isletme/personel-rolleri/duzenle/${role.id}`)}
                                                className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-lg text-blue-500 hover:bg-blue-100 transition-all"
                                                title="Düzenle"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(role.id)}
                                                className="w-9 h-9 flex items-center justify-center bg-red-50 rounded-lg text-red-500 hover:bg-red-100 transition-all"
                                                title="Sil"
                                            >
                                                <Trash2 size={16} />
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

export default StaffRoles;
