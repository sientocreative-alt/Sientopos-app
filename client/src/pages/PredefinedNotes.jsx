import { useState, useEffect } from 'react';
import { Pencil, Trash2, X, Archive } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const PredefinedNotes = () => {
    const { user } = useAuth();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [formData, setFormData] = useState({
        note: ''
    });

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('predefined_notes')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotes(data || []);
        } catch (error) {
            console.error('Error fetching predefined notes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchNotes();
    }, [user]);

    const handleOpenModal = (note = null) => {
        if (note) {
            setEditingNote(note);
            setFormData({ note: note.note });
        } else {
            setEditingNote(null);
            setFormData({ note: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.note.trim()) {
            alert('Lütfen bir not giriniz.');
            return;
        }

        try {
            setLoading(true);
            if (editingNote) {
                const { error } = await supabase
                    .from('predefined_notes')
                    .update({ note: formData.note })
                    .eq('id', editingNote.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('predefined_notes')
                    .insert([{
                        business_id: user.business_id,
                        note: formData.note
                    }]);
                if (error) throw error;
            }
            setIsModalOpen(false);
            fetchNotes();
        } catch (error) {
            console.error('Error saving predefined note:', error);
            alert('Hata: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu notu silmek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase
                .from('predefined_notes')
                .update({ is_deleted: true })
                .eq('id', id);
            if (error) throw error;
            fetchNotes();
        } catch (error) {
            console.error('Error deleting predefined note:', error);
            alert('Silme işlemi başarısız oldu.');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-bold text-gray-900 text-lg">Ön Tanımlı Notlar</span>
                    <span>Pano</span>
                    <span>•</span>
                    <span>POS Ayarları</span>
                    <span>•</span>
                    <span>Ön Tanımlı Notlar</span>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                    >
                        Yeni Ön Tanımlı Not
                    </button>
                    <button className="px-4 py-2 bg-orange-50 text-orange-600 rounded-lg font-medium hover:bg-orange-100 transition-colors flex items-center gap-2">
                        Arşiv
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                    <h2 className="text-lg font-bold text-gray-800">Ön Tanımlı Not Listesi</h2>
                    <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">{notes.length}</span>
                </div>

                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 text-gray-600 text-sm">
                            <th className="py-4 px-6 font-medium">Not</th>
                            <th className="py-4 px-6 font-medium text-center">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading && notes.length === 0 ? (
                            <tr><td colSpan="2" className="py-8 text-center text-gray-500">Yükleniyor...</td></tr>
                        ) : notes.length === 0 ? (
                            <tr><td colSpan="2" className="py-8 text-center text-gray-400">Tabloda herhangi bir veri mevcut değil</td></tr>
                        ) : (
                            notes.map((note) => (
                                <tr key={note.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-6 text-gray-700 font-medium">{note.note}</td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => handleOpenModal(note)}
                                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(note.id)}
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingNote ? 'Ön Tanımlı Not Düzenle' : 'Ön Tanımlı Not Ekle'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <span className="text-red-500 mr-1">*</span>Not
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                                    value={formData.note}
                                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                                    placeholder="Not içeriğini giriniz..."
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-100"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-bold hover:bg-teal-600 transition-colors shadow-lg shadow-teal-100 disabled:opacity-50"
                                >
                                    {loading ? 'Yükleniyor...' : (editingNote ? 'Güncelle' : 'Ön Tanımlı Not Ekle')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PredefinedNotes;
