import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Move, X, Layers } from 'lucide-react';

const SeatingAreaDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [area, setArea] = useState(null);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Form States
    const [newTableName, setNewTableName] = useState('');
    const [editingTable, setEditingTable] = useState(null);

    // Bulk States
    const [bulkPrefix, setBulkPrefix] = useState('Masa');
    const [bulkCount, setBulkCount] = useState(5);
    const [bulkStart, setBulkStart] = useState(1);

    useEffect(() => {
        if (user && id) {
            fetchArea();
            fetchTables();
        }
    }, [user, id]);

    const fetchArea = async () => {
        const { data } = await supabase
            .from('seating_areas')
            .select('*')
            .eq('id', id)
            .single();
        if (data) setArea(data);
    };

    const fetchTables = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tables')
                .select('*')
                .eq('seating_area_id', id)
                .is('is_deleted', false)
                .order('name', { ascending: true });

            if (error) throw error;
            setTables(data || []);
        } catch (error) {
            console.error('Error fetching tables:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTable = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('tables')
                .insert([{
                    name: newTableName,
                    seating_area_id: id,
                    business_id: user.business_id
                }]);
            if (error) throw error;
            setIsAddModalOpen(false);
            setNewTableName('');
            fetchTables();
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    };

    const handleBulkAdd = async (e) => {
        e.preventDefault();
        try {
            const newTables = [];
            for (let i = 0; i < bulkCount; i++) {
                const num = parseInt(bulkStart) + i;
                newTables.push({
                    name: `${bulkPrefix} ${num}`,
                    seating_area_id: id,
                    business_id: user.business_id
                });
            }
            const { error } = await supabase.from('tables').insert(newTables);
            if (error) throw error;
            setIsBulkModalOpen(false);
            fetchTables();
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    };

    const handleUpdateTable = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('tables')
                .update({ name: newTableName })
                .eq('id', editingTable.id);
            if (error) throw error;
            setIsEditModalOpen(false);
            setEditingTable(null);
            setNewTableName('');
            fetchTables();
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    };

    const handleDeleteTable = async (tableId) => {
        if (window.confirm('Bu masayı arşive göndermek istediğinize emin misiniz?')) {
            try {
                const { error } = await supabase
                    .from('tables')
                    .update({ is_deleted: true })
                    .eq('id', tableId);
                if (error) throw error;
                fetchTables();
            } catch (error) {
                console.error('Error deleting table:', error);
            }
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">Masalar</h1>
                    <div className="text-xs text-gray-400 mt-1 flex gap-1 items-center">
                        <span>Pano</span>
                        <span className="text-[10px]">•</span>
                        <Link to="/isletme/oturma-alanlari" className="hover:text-blue-500 transition-colors">
                            {area?.name || 'Yükleniyor...'}
                        </Link>
                        <span className="text-[10px]">•</span>
                        <span>Masalar</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-100 transition flex items-center gap-2 border border-blue-100"
                    >
                        Yeni Masa
                    </button>
                    <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-100 transition flex items-center gap-2 border border-blue-100"
                    >
                        <Layers size={16} />
                        Toplu Yeni Masa
                    </button>
                    <button className="bg-orange-50 text-orange-600 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-orange-100 transition flex items-center gap-2 border border-orange-100">
                        Arşiv
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 w-12 text-center"></th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Masa Adı</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right px-8">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan="3" className="p-12 text-center text-gray-400 italic">Yükleniyor...</td></tr>
                        ) : tables.length === 0 ? (
                            <tr><td colSpan="3" className="p-12 text-center text-gray-400 italic">Henüz bir masa eklenmemiş.</td></tr>
                        ) : (
                            tables.map((table) => (
                                <tr key={table.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-4 text-center">
                                        <div className="text-gray-300 group-hover:text-blue-400 cursor-move transition-colors">
                                            <Move size={16} />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-semibold text-gray-700">{table.name}</span>
                                    </td>
                                    <td className="p-4 text-right px-6 space-x-2">
                                        <button
                                            onClick={() => {
                                                setEditingTable(table);
                                                setNewTableName(table.name);
                                                setIsEditModalOpen(true);
                                            }}
                                            className="p-2 text-gray-500 bg-gray-50 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-all shadow-sm border border-gray-100/50"
                                            title="Düzenle"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTable(table.id)}
                                            className="p-2 text-gray-500 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all shadow-sm border border-gray-100/50"
                                            title="Sil"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Single Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold">Yeni Masa Ekle</h3>
                            <button onClick={() => setIsAddModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <form onSubmit={handleAddTable} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Masa Adı</label>
                                <input
                                    type="text"
                                    required
                                    value={newTableName}
                                    onChange={(e) => setNewTableName(e.target.value)}
                                    placeholder="Örn: Masa 1"
                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-bold transition">İptal</button>
                                <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-bold transition">Ekle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Add Modal */}
            {isBulkModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold">Toplu Masa Ekle</h3>
                            <button onClick={() => setIsBulkModalOpen(false)}><X size={20} className="text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleBulkAdd} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Masa Ön-adı</label>
                                    <input type="text" value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Masa Adedi</label>
                                    <input type="number" value={bulkCount} onChange={(e) => setBulkCount(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Başlangıç Numarası</label>
                                <input type="number" value={bulkStart} onChange={(e) => setBulkStart(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm w-1/2" />
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <p className="text-xs text-blue-800 leading-relaxed font-medium">
                                    Oluşturulacak masalar: <span className="font-bold underline">{bulkPrefix} {bulkStart}</span>'dan <span className="font-bold underline">{bulkPrefix} {parseInt(bulkStart) + parseInt(bulkCount) - 1}</span>'e kadar.
                                </p>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsBulkModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-bold transition">İptal</button>
                                <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-bold transition shadow-sm shadow-blue-100">Oluştur</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold">Masayı Düzenle</h3>
                            <button onClick={() => setIsEditModalOpen(false)}><X size={20} className="text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleUpdateTable} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Masa Adı</label>
                                <input
                                    type="text"
                                    required
                                    value={newTableName}
                                    onChange={(e) => setNewTableName(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-bold transition">İptal</button>
                                <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-bold transition">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeatingAreaDetail;
