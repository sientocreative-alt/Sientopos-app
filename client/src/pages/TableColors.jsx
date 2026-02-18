import { useState, useEffect } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const TableColors = () => {
    const { user } = useAuth();
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingColor, setEditingColor] = useState(null);
    const [formData, setFormData] = useState({
        color_hex: '#e2e8f0',
        start_minute: 0
    });

    const presetColors = [
        '#e2e8f0', '#edf2f7', '#e5e7eb', '#d1d5db', '#9ca3af', '#fecaca', '#fed7aa', '#fef08a',
        '#fef9c3', '#ecfccb', '#dcfce7', '#bbf7d0', '#99f6e4', '#a5f3fc', '#bae6fd', '#dbeafe',
        '#e0e7ff', '#ede9fe', '#f5f3ff', '#fae8ff', '#fce7f3', '#ffe4e6'
    ];

    const fetchColors = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('table_colors')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('start_minute', { ascending: true });

            if (error) throw error;
            setColors(data || []);
        } catch (error) {
            console.error('Error fetching table colors:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchColors();
    }, [user]);

    const handleOpenModal = (color = null) => {
        if (color) {
            setEditingColor(color);
            setFormData({
                color_hex: color.color_hex,
                start_minute: color.start_minute
            });
        } else {
            setEditingColor(null);
            setFormData({
                color_hex: '#e2e8f0',
                start_minute: 0
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            if (editingColor) {
                const { error } = await supabase
                    .from('table_colors')
                    .update({
                        color_hex: formData.color_hex,
                        start_minute: parseInt(formData.start_minute)
                    })
                    .eq('id', editingColor.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('table_colors')
                    .insert([{
                        business_id: user.business_id,
                        color_hex: formData.color_hex,
                        start_minute: parseInt(formData.start_minute)
                    }]);
                if (error) throw error;
            }
            setIsModalOpen(false);
            fetchColors();
        } catch (error) {
            console.error('Error saving table color:', error);
            alert('Hata: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu renk kuralını silmek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase
                .from('table_colors')
                .update({ is_deleted: true })
                .eq('id', id);
            if (error) throw error;
            fetchColors();
        } catch (error) {
            console.error('Error deleting table color:', error);
            alert('Silme işlemi başarısız oldu.');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-bold text-gray-900 text-lg">Masa Renkleri</span>
                    <span>Pano</span>
                    <span>•</span>
                    <span>POS Ayarları</span>
                    <span>•</span>
                    <span>Masa Renkleri</span>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                >
                    Yeni Masa Rengi
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                    <h2 className="text-lg font-bold text-gray-800">Masa Rengi Listesi</h2>
                    <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">{colors.length}</span>
                </div>

                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 text-gray-600 text-sm">
                            <th className="py-4 px-12 font-medium text-center">Renk</th>
                            <th className="py-4 px-12 font-medium text-center">Başlangıç Dakikası</th>
                            <th className="py-4 px-12 font-medium text-center">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-center">
                        {loading && colors.length === 0 ? (
                            <tr><td colSpan="3" className="py-8 text-gray-500">Yükleniyor...</td></tr>
                        ) : colors.length === 0 ? (
                            <tr><td colSpan="3" className="py-8 text-gray-400">Herhangi bir veri mevcut değil</td></tr>
                        ) : (
                            colors.map((color) => (
                                <tr key={color.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-12">
                                        <div
                                            className="w-48 h-8 rounded mx-auto border border-gray-100"
                                            style={{ backgroundColor: color.color_hex }}
                                        />
                                    </td>
                                    <td className="py-4 px-12 text-gray-700 font-medium">{color.start_minute}</td>
                                    <td className="py-4 px-12">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => handleOpenModal(color)}
                                                className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(color.id)}
                                                className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingColor ? 'Masa Rengi Düzenle' : 'Masa Rengi Ekle'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8">
                            {/* Color Selection */}
                            <div className="grid grid-cols-8 gap-3 mb-8">
                                {presetColors.map((color) => (
                                    <label key={color} className="relative group cursor-pointer">
                                        <input
                                            type="radio"
                                            name="color_hex"
                                            className="hidden"
                                            checked={formData.color_hex === color}
                                            onChange={() => setFormData({ ...formData, color_hex: color })}
                                        />
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center ${formData.color_hex === color ? 'bg-white' : 'bg-transparent'}`}>
                                                {formData.color_hex === color && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                            </div>
                                            <div
                                                className="w-12 h-8 rounded border border-gray-100"
                                                style={{ backgroundColor: color }}
                                            />
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {/* Start Minute */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Dakikası</label>
                                <input
                                    type="number"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                                    value={formData.start_minute}
                                    onChange={e => setFormData({ ...formData, start_minute: e.target.value })}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-bold hover:bg-teal-600 transition-colors shadow-lg shadow-teal-200 disabled:opacity-50"
                                >
                                    {loading ? 'Yükleniyor...' : (editingColor ? 'Güncelle' : 'Masa Rengi Ekle')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableColors;
