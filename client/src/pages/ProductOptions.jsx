import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Eye, Edit2, Copy, XCircle, Plus, Search, Filter } from 'lucide-react';

const ProductOptions = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    // ... (rest of code) ...

    useEffect(() => {
        if (user) {
            console.log('Current user:', user);
            fetchGroups();
        }
    }, [user]);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('modifier_groups')
                .select('*')
                .eq('business_id', user.business_id)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching modifier_groups:', error);
            } else {
                console.log('Fetched groups:', data);
                setGroups(data || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        navigate('/isletme/urun-opsiyonlari/yeni');
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu seçim grubunu silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('modifier_groups')
                .update({ is_deleted: true })
                .eq('id', id);

            if (error) throw error;
            fetchGroups();
        } catch (error) {
            console.error('Error deleting group:', error);
            alert('Hata oluştu: ' + error.message);
        }
    };

    const handleCopy = async (group) => {
        if (!confirm(`${group.name} grubunu kopyalamak istiyor musunuz?`)) return;

        try {
            setLoading(true);

            // 1. Create duplicate group
            const { data: newGroup, error: groupError } = await supabase
                .from('modifier_groups')
                .insert([{
                    business_id: user.business_id,
                    name: `${group.name} (Kopya)`,
                    internal_name: group.internal_name,
                    selection_type: group.selection_type,
                    min_selections: group.min_selections,
                    max_selections: group.max_selections
                }])
                .select()
                .single();

            if (groupError) throw groupError;

            // 2. Fetch original options
            const { data: options, error: optionsError } = await supabase
                .from('modifier_options')
                .select('*')
                .eq('group_id', group.id)
                .eq('is_deleted', false);

            if (optionsError) throw optionsError;

            // 3. Duplicate options
            if (options && options.length > 0) {
                const optionsToInsert = options.map(opt => ({
                    business_id: user.business_id,
                    group_id: newGroup.id,
                    name: opt.name,
                    price: opt.price,
                    order_number: opt.order_number,
                    is_default: opt.is_default,
                    is_active: opt.is_active
                }));

                const { error: insertError } = await supabase
                    .from('modifier_options')
                    .insert(optionsToInsert);

                if (insertError) throw insertError;
            }

            fetchGroups();
            alert('Kopyalama başarılı!');

        } catch (error) {
            console.error('Error copying group:', error);
            alert('Kopyalama sırasında hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-bold text-gray-800 text-lg mr-2">Zorunlu Seçim Grupları</span>
                    <span>Pano</span>
                    <span>•</span>
                    <span>POS Ayarları</span>
                    <span>•</span>
                    <span>Zorunlu Seçim Grupları</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleCreateNew}
                        className="bg-blue-100 text-blue-600 hover:bg-blue-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                    >
                        Yeni Zorunlu Seçim Grubu
                    </button>
                    <button className="bg-orange-100 text-orange-600 hover:bg-orange-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                        Arşiv
                    </button>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-semibold text-sm border-b border-gray-200">
                        <tr>
                            <th className="p-4 w-12"></th>
                            <th className="p-4">Gösterim Adı</th>
                            <th className="p-4">Opsiyon Adı</th>
                            <th className="p-4">Seçim Durumu</th>
                            <th className="p-4 w-40 text-center">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {groups.map((group) => (
                            <tr key={group.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="p-4 text-gray-400">
                                    <div className="cursor-move">
                                        {/* Drag handle icon if needed, usually simple dots or cross arrow */}
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" /></svg>
                                    </div>
                                </td>
                                <td className="p-4 font-medium text-gray-800">{group.name}</td>
                                <td className="p-4 text-gray-600">{group.internal_name}</td>
                                <td className="p-4 text-gray-600">{group.selection_type}</td>
                                <td className="p-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => navigate(`/isletme/urun-opsiyonlari/${group.id}`)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
                                            title="Detay Görüntüle / Reçete"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => navigate(`/isletme/urun-opsiyonlari/duzenle/${group.id}`)}
                                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors border border-gray-200"
                                            title="Düzenle"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleCopy(group)}
                                            className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors border border-gray-200"
                                            title="Kopyala"
                                        >
                                            <Copy size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(group.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
                                            title="Sil"
                                        >
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {groups.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-gray-400">
                                    Henüz zorunlu seçim grubu eklenmemiş.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductOptions;
