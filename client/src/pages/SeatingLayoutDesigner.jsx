import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import * as Lucide from 'lucide-react';

// Safe Icon Component to prevent crashes
const SafeIcon = ({ name, size = 18, className = "" }) => {
    const Icon = Lucide[name];
    if (!Icon) return <span className="text-[8px] font-black text-gray-400 uppercase">{name}</span>;
    return <Icon size={size} className={className} />;
};

// Grid Dimensions
const GRID_COLS = 20;
const GRID_ROWS = 14;

const TOOLBAR_ITEMS = [
    { id: 'Table', icon: 'Table', label: 'Masa', action: 'table' },
    { id: 'WalkH', icon: 'Equal', label: 'Yürüme (Yatay)' },
    { id: 'WalkV', icon: 'Pause', label: 'Yürüme (Dikey)' },
    { id: 'Umbrella', icon: 'Umbrella', label: 'Şemsiye' },
    { id: 'Kasa', icon: 'Store', label: 'Kasa' },
    { id: 'Stairs', icon: 'Stairs', label: 'Merdiven' },
    { id: 'Pool', icon: 'Waves', label: 'Havuz' },
    { id: 'Somine', icon: 'Flame', label: 'Şömine & Isıtıcı' },
    { id: 'Door', icon: 'DoorOpen', label: 'Kapı' },
    { id: 'Depo', icon: 'Package', label: 'Depo' },
    { id: 'Kolon', icon: 'RectangleVertical', label: 'Kolon' },
    { id: 'WC', icon: 'Accessibility', label: 'WC' },
];

const SeatingLayoutDesigner = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [area, setArea] = useState(null);
    const [tables, setTables] = useState([]);
    const [layout, setLayout] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [selectedToolId, setSelectedToolId] = useState(null);
    const [showPicker, setShowPicker] = useState(null);

    useEffect(() => {
        const init = async () => {
            try {
                if (!user || !id) return;

                const { data: areaData, error: areaErr } = await supabase
                    .from('seating_areas')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (areaErr) throw areaErr;
                setArea(areaData);

                let initialLayout = areaData.layout_data;
                if (!initialLayout || typeof initialLayout !== 'object') {
                    initialLayout = {};
                }
                setLayout(initialLayout);

                const { data: tableData, error: tableErr } = await supabase
                    .from('tables')
                    .select('*')
                    .eq('seating_area_id', id)
                    .is('is_deleted', false);

                if (tableErr) throw tableErr;
                setTables(tableData || []);

            } catch (err) {
                console.error("Layout Designer Init Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [user, id]);

    const handleCellClick = (row, col) => {
        const key = `${row}-${col}`;

        if (!selectedToolId) {
            if (layout[key]) {
                const next = { ...layout };
                delete next[key];
                setLayout(next);
            }
            return;
        }

        const tool = TOOLBAR_ITEMS.find(t => t.id === selectedToolId);

        if (tool.id === 'Table') {
            setShowPicker({ row, col });
        } else {
            setLayout(prev => ({
                ...prev,
                [key]: { type: 'object', icon: tool.icon, toolId: tool.id }
            }));
        }
    };

    const placeTable = (table) => {
        if (!showPicker) return;
        const key = `${showPicker.row}-${showPicker.col}`;

        const next = { ...layout };
        // Clean existing
        Object.keys(next).forEach(k => {
            if (next[k]?.tableId === table.id) delete next[k];
        });

        next[key] = {
            type: 'table',
            tableId: table.id,
            tableName: table.name
        };

        setLayout(next);
        setShowPicker(null);
    };

    const saveLayout = async () => {
        setSaving(true);
        try {
            const { error: saveErr } = await supabase
                .from('seating_areas')
                .update({ layout_data: layout })
                .eq('id', id);
            if (saveErr) throw saveErr;
            alert('Tasarım başarıyla kaydedildi!');
        } catch (err) {
            alert('Hata: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (error) {
        return (
            <div className="p-20 bg-gray-900 text-white min-h-screen font-sans">
                <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-3xl border border-red-500/30">
                    <h1 className="text-red-500 font-black text-2xl mb-2">SİSTEM HATASI</h1>
                    <p className="text-gray-400 mb-8 font-medium">{error}</p>
                    <button onClick={() => window.location.reload()} className="w-full py-4 bg-orange-600 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-500 transition-all">TEKRAR DENE</button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">Yükleniyor</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#F1F5F9] overflow-hidden text-black font-sans selection:bg-orange-500/30">
            {/* Minimalist Professional Toolbar */}
            <div className="shrink-0 h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white z-50 shadow-sm">
                <div className="flex items-center gap-4 text-left">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl text-gray-400 hover:text-black transition-all">
                        <SafeIcon name="ArrowLeft" size={20} />
                    </button>
                    <div>
                        <h1 className="text-sm font-black tracking-tight text-black uppercase">{area?.name}</h1>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-teal-500"></span>
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Kroki Tasarımcısı</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
                        {TOOLBAR_ITEMS.map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => setSelectedToolId(selectedToolId === tool.id ? null : tool.id)}
                                className={`w-10 h-10 flex flex-col items-center justify-center rounded-xl transition-all duration-300 relative group ${selectedToolId === tool.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/20' : 'text-gray-900 hover:text-black hover:bg-gray-200'}`}
                            >
                                <SafeIcon name={tool.icon} size={18} />
                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[8px] font-black uppercase px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-800 z-[100] pointer-events-none">
                                    {tool.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={saveLayout}
                        disabled={saving}
                        className="bg-teal-600 hover:bg-teal-500 text-white px-8 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-teal-950/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        <SafeIcon name="Save" size={14} />
                        {saving ? "..." : "Kaydet"}
                    </button>
                </div>
            </div>

            {/* Design Grid */}
            <div className="flex-1 overflow-auto p-8 flex items-start justify-center bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:32px_32px]">
                <div
                    className="grid bg-[#F8FAFC] border border-gray-300 shadow-xl rounded-sm"
                    style={{
                        gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                        width: '100%',
                        maxWidth: '1200px',
                        minWidth: '800px'
                    }}
                >
                    {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, i) => {
                        const row = Math.floor(i / GRID_COLS);
                        const col = i % GRID_COLS;
                        const key = `${row}-${col}`;
                        const item = layout[key];

                        return (
                            <div
                                key={key}
                                onClick={() => handleCellClick(row, col)}
                                className={`group border-[0.5px] border-black/10 flex items-center justify-center relative cursor-crosshair hover:bg-black/5 transition-all duration-150 aspect-square ${item?.type === 'table' ? 'bg-orange-500/[0.03]' : ''}`}
                            >
                                {item ? (
                                    <div className={`flex flex-col items-center gap-1.5 ${item.type === 'table' ? 'text-orange-500' : 'text-black'} animate-in zoom-in duration-200`}>
                                        <SafeIcon name={item.type === 'table' ? 'Table' : (item.icon)} size={item.type === 'table' ? 24 : 18} className={item.type === 'table' ? 'drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]' : ''} />
                                        {item.type === 'table' && (
                                            <span className="text-[7px] font-black uppercase opacity-90 truncate w-[45px] text-center tracking-tighter">
                                                {item.tableName}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-gray-900 font-bold opacity-0 group-hover:opacity-100 transition-opacity">+</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Table Selector Overlay */}
            {showPicker && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white border border-gray-200 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div className="text-left">
                                <h3 className="text-lg font-black uppercase tracking-tighter text-black">Masa Yerleştir</h3>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Hücre {showPicker.row + 1}:{showPicker.col + 1}</p>
                            </div>
                            <button onClick={() => setShowPicker(null)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><SafeIcon name="X" /></button>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
                            {tables.length === 0 ? (
                                <div className="col-span-2 py-16 text-center">
                                    <p className="text-gray-600 font-black uppercase tracking-widest text-[10px]">MASA LİSTESİ BOŞ</p>
                                    <Link to={`/isletme/oturma-alanlari/${id}`} className="inline-block mt-4 text-orange-500 text-[10px] font-black underline uppercase">MASA EKLE</Link>
                                </div>
                            ) : (
                                tables.map(table => {
                                    const assigned = Object.values(layout).some(v => v?.tableId === table.id);
                                    return (
                                        <button
                                            key={table.id}
                                            disabled={assigned}
                                            onClick={() => placeTable(table)}
                                            className={`p-5 rounded-2xl border text-left transition-all relative ${assigned ? 'bg-gray-50 border-gray-100 opacity-40 filter grayscale cursor-not-allowed' : 'bg-white border-gray-200 hover:border-orange-500/50 hover:bg-orange-50/10 hover:shadow-md'}`}
                                        >
                                            <span className="text-xs font-black uppercase tracking-tight block truncate text-black">{table.name}</span>
                                            <span className={`text-[8px] font-black uppercase mt-1 block ${assigned ? 'text-gray-400' : 'text-teal-600'}`}>
                                                {assigned ? 'YERLEŞİK' : 'BOŞTA'}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                        <div className="p-6 flex justify-end">
                            <button onClick={() => setShowPicker(null)} className="text-[10px] font-black text-gray-400 uppercase px-8 py-3 bg-gray-50 rounded-xl hover:text-black transition-colors border border-gray-100">VAZGEÇ</button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #333; }
            `}} />
        </div>
    );
};

export default SeatingLayoutDesigner;
