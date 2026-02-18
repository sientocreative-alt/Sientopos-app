import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Plus, Edit2, Trash2, Archive, X, ChevronDown, Move, Eye, Monitor } from 'lucide-react';
import axios from 'axios';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableRow = ({ area, navigate, openEdit, handleDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: area.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
        position: 'relative',
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={`hover:bg-gray-50/50 transition-colors group border-b border-gray-50 last:border-0 ${isDragging ? 'bg-blue-50 shadow-lg opacity-80' : ''}`}
        >
            <td className="p-4 w-12 text-center touch-none">
                <div
                    {...attributes}
                    {...listeners}
                    className="p-1.5 text-gray-300 group-hover:text-blue-400 cursor-move transition-colors inline-block"
                >
                    <Move size={16} />
                </div>
            </td>
            <td className="p-4">
                <span className="font-semibold text-gray-700 tracking-tight">{area.name}</span>
            </td>
            <td className="p-4 text-right px-6">
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => navigate(`/isletme/oturma-alanlari/${area.id}`)}
                        className="p-2 text-gray-500 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all shadow-sm border border-gray-100/50"
                        title="Detay"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        onClick={() => navigate(`/isletme/oturma-alanlari/${area.id}/yerlesim`)}
                        className="p-2 text-gray-500 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all shadow-sm border border-gray-100/50"
                        title="Masa Yerleşimi"
                    >
                        <Monitor size={16} />
                    </button>
                    <button
                        onClick={() => openEdit(area)}
                        className="p-2 text-gray-500 bg-gray-50 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-all shadow-sm border border-gray-100/50"
                        title="Düzenle"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(area.id)}
                        className="p-2 text-gray-500 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all shadow-sm border border-gray-100/50"
                        title="Sil"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

const SeatingAreas = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' | 'add' | 'edit'

    // Form State
    const [formData, setFormData] = useState({
        name: ''
    });
    const [editingArea, setEditingArea] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (user && user.business_id) {
            fetchAreas();
        }
    }, [user]);

    const fetchAreas = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('seating_areas')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAreas(data || []);
        } catch (error) {
            console.error('Error fetching areas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setAreas((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update sort_order in database
                const updates = newItems.map((item, index) => ({
                    id: item.id,
                    sort_order: index,
                    updated_at: new Date()
                }));

                // Optimistic update locally
                updateSortOrders(updates);

                return newItems;
            });
        }
    };



    const updateSortOrders = async (updates) => {
        try {
            // Use server endpoint to bypass RLS
            await axios.put('http://localhost:5000/api/seating/reorder', { updates });
        } catch (error) {
            console.error('Error updating sort order:', error);
            alert('Sıralama sunucuya kaydedilemedi. Lütfen sunucunun (port 5000) çalıştığından emin olun.');
            fetchAreas();
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (view === 'add') {
                const { error } = await supabase
                    .from('seating_areas')
                    .insert([{
                        name: formData.name,
                        business_id: user.business_id,
                        sort_order: areas.length // Add to end
                    }]);
                if (error) throw error;
            } else if (view === 'edit') {
                const { error } = await supabase
                    .from('seating_areas')
                    .update({ name: formData.name })
                    .eq('id', editingArea.id);
                if (error) throw error;
            }

            setFormData({ name: '' });
            setEditingArea(null);
            setView('list');
            fetchAreas();
        } catch (error) {
            console.error('Error saving area:', error);
            alert('Hata: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu oturma alanını arşive göndermek istediğinize emin misiniz?')) {
            try {
                const { error } = await supabase
                    .from('seating_areas')
                    .update({ is_deleted: true, deleted_at: new Date() })
                    .eq('id', id);
                if (error) throw error;
                fetchAreas();
            } catch (error) {
                console.error('Error deleting area:', error);
            }
        }
    };

    const openEdit = (area) => {
        setEditingArea(area);
        setFormData({ name: area.name });
        setView('edit');
    };

    if (view === 'add' || view === 'edit') {
        return (
            <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                        {view === 'add' ? 'Yeni' : 'Düzenle'}
                    </h1>
                    <div className="text-xs text-gray-400 mt-1 flex gap-1 items-center">
                        <span>Pano</span>
                        <span className="text-[10px]">•</span>
                        <span>POS Ayarları</span>
                        <span className="text-[10px]">•</span>
                        <span>Bölümler / Masalar</span>
                        <span className="text-[10px]">•</span>
                        <span>{view === 'add' ? 'Yeni' : 'Düzenle'}</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50">
                        <h2 className="text-lg font-bold text-gray-800">Bölüm {view === 'add' ? 'Ekle' : 'Düzenle'}</h2>
                    </div>
                    <form onSubmit={handleSave} className="p-8 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                                * Oturma Alanı Adı
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Oturma Alanı Adı"
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-6">
                            <button
                                type="button"
                                onClick={() => { setView('list'); setFormData({ name: '' }); }}
                                className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition shadow-sm"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-2.5 rounded-lg text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 transition shadow-sm shadow-blue-100 disabled:opacity-50"
                            >
                                {loading ? 'Kaydediliyor...' : (view === 'add' ? 'Bölüm Ekle' : 'Güncelle')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">Bölümler / Masalar</h1>
                    <div className="text-xs text-gray-400 mt-1 flex gap-1 items-center">
                        <span>Pano</span>
                        <span className="text-[10px]">•</span>
                        <span>POS Ayarları</span>
                        <span className="text-[10px]">•</span>
                        <span>Bölümler / Masalar</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setView('add')}
                        className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-100 transition flex items-center gap-2 border border-blue-100"
                    >
                        Yeni Bölüm
                    </button>
                    <button className="bg-orange-50 text-orange-600 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-orange-100 transition flex items-center gap-2 border border-orange-100">
                        Arşiv
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 w-12"></th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Oturma Alanı Adı</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right px-8">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="p-12 text-center text-gray-400 italic">Yükleniyor...</td>
                                </tr>
                            ) : areas.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="p-12 text-center text-gray-400 italic">Henüz bir oturma alanı eklenmemiş.</td>
                                </tr>
                            ) : (
                                <SortableContext
                                    items={areas.map(a => a.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {areas.map((area) => (
                                        <SortableRow
                                            key={area.id}
                                            area={area}
                                            navigate={navigate}
                                            openEdit={openEdit}
                                            handleDelete={handleDelete}
                                        />
                                    ))}
                                </SortableContext>
                            )}
                        </tbody>
                    </table>
                </DndContext>
            </div>
        </div>
    );
};

export default SeatingAreas;
