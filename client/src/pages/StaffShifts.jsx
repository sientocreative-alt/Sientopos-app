import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Search
} from 'lucide-react';
import { format, startOfWeek, addDays, subWeeks, addWeeks, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';

const StaffShifts = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [staff, setStaff] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const dropdownRef = useRef(null);

    const weekDays = [...Array(7)].map((_, i) => addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i));

    useEffect(() => {
        if (user) {
            fetchStaff();
            fetchShifts();
        }
    }, [user, currentDate]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDownloadMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchStaff = async () => {
        const { data, error } = await supabase
            .from('staff')
            .select('id, first_name, last_name, role')
            .eq('business_id', user.business_id)
            .eq('is_archived', false);
        if (data) setStaff(data);
    };

    const fetchShifts = async () => {
        setLoading(true);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const { data, error } = await supabase
            .from('staff_shifts')
            .select('*')
            .eq('business_id', user.business_id)
            .eq('date', dateStr);

        if (data) setShifts(data);
        setLoading(false);
    };

    const handleDeleteShift = async (id) => {
        const { error } = await supabase.from('staff_shifts').delete().eq('id', id);
        if (error) console.error(error);
        else fetchShifts();
    };

    const getShiftFor = (staffId) => {
        return shifts.find(s => s.staff_id === staffId);
    };

    return (
        <div className="p-4 md:p-6 bg-[#F8F9FC] min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                <div className="flex items-baseline gap-3">
                    <h1 className="text-[20px] font-bold text-gray-800">Mesai Yönetimi</h1>
                    <div className="flex items-center gap-1.5 text-[13px] text-gray-300 font-medium">
                        <span>Pano</span>
                        <span>•</span>
                        <span>Personel Yönetimi</span>
                        <span>•</span>
                        <span className="text-gray-400">Mesai Yönetimi</span>
                    </div>
                </div>
                <div className="flex gap-2 relative" ref={dropdownRef}>
                    <button
                        onClick={() => navigate('/isletme/mesai-saatler/yeni')}
                        className="bg-[#E3F2FD] hover:bg-[#BBDEFB] text-[#1976D2] px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-sm"
                    >
                        Yeni Mesai
                    </button>
                    <button
                        onClick={() => navigate('/isletme/mesai-saatler/toplu-giris')}
                        className="bg-[#F3E5F5] hover:bg-[#E1BEE7] text-[#7B1FA2] px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-sm"
                    >
                        Haftalık Mesai
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                            className="bg-[#2196F3] hover:bg-[#1976D2] text-white px-5 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
                        >
                            İndir <ChevronDown size={16} />
                        </button>
                        {showDownloadMenu && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 py-2 animate-in fade-in slide-in-from-top-2">
                                <button onClick={() => navigate('/isletme/mesai-saatler/rapor-indir')} className="w-full text-left px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">Haftalık Liste İndir</button>
                                <button className="w-full text-left px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">Aylık Liste İndir</button>
                                <button className="w-full text-left px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">Rapor İndir</button>
                                <button className="w-full text-left px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 border-t border-gray-50">Çalışma Saati Rapor İndir</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Date Navigation */}
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 capitalize">
                        {format(currentDate, 'd MMMM EEEE', { locale: tr })}
                    </h2>
                    <p className="text-gray-400 font-bold text-sm">{format(currentDate, 'yyyy')}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentDate(addDays(currentDate, -1))}
                        className="w-10 h-10 flex items-center justify-center bg-[#2196F3] text-white rounded-lg hover:bg-blue-600 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => setCurrentDate(addDays(currentDate, 1))}
                        className="w-10 h-10 flex items-center justify-center bg-[#2196F3] text-white rounded-lg hover:bg-blue-600 transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Shift List Dashboard */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-[1fr_250px_150px_100px] border-b border-gray-50 px-8 py-4 bg-gray-50/30 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    <div>PERSONEL</div>
                    <div className="text-center">GİRİŞ-ÇIKIŞ</div>
                    <div className="text-center">MOLA</div>
                    <div></div>
                </div>
                <div className="divide-y divide-gray-50">
                    {staff.map(member => {
                        const shift = getShiftFor(member.id);
                        return (
                            <div key={member.id} className="grid grid-cols-[1fr_250px_150px_100px] px-8 py-4 items-center hover:bg-gray-50/50 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg font-bold text-gray-400 uppercase italic">
                                        {member.first_name[0]}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-[15px]">{member.first_name} {member.last_name}</div>
                                        <div className="text-xs text-gray-400 font-medium">{member.role || 'Personel'}</div>
                                    </div>
                                </div>
                                <div className="flex justify-center gap-2">
                                    {shift ? (
                                        <>
                                            <div className="bg-[#F8F9FC] border border-gray-100 px-4 py-2 rounded-lg text-sm font-bold text-gray-600 min-w-[75px] text-center">
                                                {shift.start_time.substring(0, 5)}
                                            </div>
                                            <div className="bg-[#F8F9FC] border border-gray-100 px-4 py-2 rounded-lg text-sm font-bold text-gray-600 min-w-[75px] text-center">
                                                {shift.end_time.substring(0, 5)}
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-gray-200 font-bold">—</span>
                                    )}
                                </div>
                                <div className="text-center">
                                    {shift?.break_duration ? (
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-bold text-gray-700 italic">1 sa</span>
                                            <span className="text-[10px] text-gray-300 font-medium">-</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-200 font-bold">—</span>
                                    )}
                                </div>
                                <div className="text-right">
                                    {shift && (
                                        <button
                                            onClick={() => handleDeleteShift(shift.id)}
                                            className="bg-[#FFE4E6] text-[#E11D48] hover:bg-[#FECDD3] px-6 py-2 rounded-lg text-sm font-bold transition-all shadow-sm"
                                        >
                                            Sil
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Scroll to top fab - optional based on design 1 bottom right icon */}
            <button className="fixed bottom-6 right-6 w-10 h-10 bg-blue-100 text-blue-500 rounded-lg flex items-center justify-center shadow-lg hover:bg-blue-200 transition-all opacity-50">
                <ChevronLeft className="rotate-90" size={20} />
            </button>
        </div>
    );
};

export default StaffShifts;
