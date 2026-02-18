import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react';
import { format, startOfWeek, addDays, subWeeks, addWeeks, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';

const BulkShiftEntry = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [staff, setStaff] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCell, setEditingCell] = useState(null); // { staffId, date }
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef(null);

    const weekDays = [...Array(7)].map((_, i) => addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i));

    useEffect(() => {
        if (user) {
            fetchStaff();
            fetchShifts();
        }
    }, [user, currentDate]);

    // Ensure focus when editing starts
    useEffect(() => {
        if (editingCell && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingCell]);

    const fetchStaff = async () => {
        const { data, error } = await supabase
            .from('staff')
            .select('id, first_name, last_name')
            .eq('business_id', user.business_id)
            .eq('is_archived', false);
        if (data) setStaff(data);
    };

    const fetchShifts = async () => {
        setLoading(true);
        const start = format(weekDays[0], 'yyyy-MM-dd');
        const end = format(weekDays[6], 'yyyy-MM-dd');

        const { data, error } = await supabase
            .from('staff_shifts')
            .select('*')
            .eq('business_id', user.business_id)
            .gte('date', start)
            .lte('date', end);

        if (data) setShifts(data);
        setLoading(false);
    };

    const calculateHours = (start, end) => {
        const [sH, sM] = start.split(':').map(Number);
        const [eH, eM] = end.split(':').map(Number);
        let diffInMinutes = (eH * 60 + eM) - (sH * 60 + sM);
        if (diffInMinutes < 0) diffInMinutes += 24 * 60;
        return (diffInMinutes / 60).toFixed(1);
    };

    const handleStartEditing = (staffId, date, currentShift) => {
        setEditingCell({ staffId, date });
        setEditValue(currentShift ? `${currentShift.start_time.substring(0, 2)}${currentShift.end_time.substring(0, 2)}` : '');
    };

    const handleSaveShift = async () => {
        if (!editingCell) return;
        const { staffId, date } = editingCell;
        const input = editValue;

        try {
            let start = '', end = '';
            const val = input.replace(/[:\s]/g, '');

            if (val.includes('-')) {
                const parts = val.split('-');
                start = parts[0].padStart(2, '0').padEnd(4, '0');
                end = parts[1].padStart(2, '0').padEnd(4, '0');
            } else if (val.length === 3) {
                start = val.substring(0, 1).padStart(2, '0') + '00';
                end = val.substring(1).padStart(2, '0') + '00';
            } else if (val.length === 4) {
                start = val.substring(0, 2).padEnd(4, '0');
                end = val.substring(2).padEnd(4, '0');
            } else if (val.length === 8) {
                start = val.substring(0, 4);
                end = val.substring(4, 8);
            } else if (val === '') {
                // Ignore empty save unless deleting? No, delete has its own button.
                setEditingCell(null);
                return;
            } else {
                setEditingCell(null);
                return;
            }

            const startStr = `${start.substring(0, 2)}:${start.substring(2, 4) || '00'}`;
            const endStr = `${end.substring(0, 2)}:${end.substring(2, 4) || '00'}`;
            const hours = calculateHours(startStr, endStr);

            const { error } = await supabase
                .from('staff_shifts')
                .upsert({
                    business_id: user.business_id,
                    staff_id: staffId,
                    date: format(date, 'yyyy-MM-dd'),
                    start_time: startStr,
                    end_time: endStr,
                    total_hours: hours
                }, { onConflict: 'staff_id, date' });

            if (error) throw error;
            fetchShifts();
        } catch (error) {
            console.error('Error saving shift:', error);
        }
        setEditingCell(null);
        setEditValue('');
    };

    const handleDeleteShift = async (id) => {
        const { error } = await supabase.from('staff_shifts').delete().eq('id', id);
        if (error) console.error(error);
        else fetchShifts();
    };

    const getShiftFor = (staffId, date) => {
        return shifts.find(s => s.staff_id === staffId && s.date === format(date, 'yyyy-MM-dd'));
    };

    const getStaffTotalHours = (staffId) => {
        const staffShifts = shifts.filter(s => s.staff_id === staffId);
        return staffShifts.reduce((acc, curr) => acc + Number(curr.total_hours), 0).toFixed(0);
    };

    const getDailyTotalHours = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dailyShifts = shifts.filter(s => s.date === dateStr);
        return dailyShifts.reduce((acc, curr) => acc + Number(curr.total_hours), 0).toFixed(0);
    };

    const getWeeklyGrandTotal = () => {
        return shifts.reduce((acc, curr) => acc + Number(curr.total_hours), 0).toFixed(0);
    };

    return (
        <div className="p-2 md:p-4 bg-[#F8F9FC] min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 px-2">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/isletme/mesai-yonetimi')}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-all"
                    >
                        <X size={20} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-800">Toplu Mesai Girişi</h1>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-100 px-2 py-1">
                        <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400"><ChevronLeft size={18} /></button>
                        <span className="px-3 font-bold text-gray-700 text-xs">
                            {format(weekDays[0], 'd MMM', { locale: tr })} - {format(weekDays[6], 'd MMM', { locale: tr })}
                        </span>
                        <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400"><ChevronRight size={18} /></button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse table-fixed min-w-[1000px]">
                        <thead>
                            <tr className="bg-[#E1BEE7]/10">
                                <th className="border-b border-r border-gray-100 px-3 py-4 text-xs font-bold text-gray-600 w-[160px] text-left">Personel</th>
                                {weekDays.map(day => (
                                    <th key={day.toISOString()} className="border-b border-r border-gray-100 px-2 py-4 text-center">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{format(day, 'EEEE', { locale: tr })}</div>
                                        <div className="text-[13px] font-black text-gray-800 italic">{format(day, 'dd.MM')}</div>
                                    </th>
                                ))}
                                <th className="border-b border-gray-100 px-3 py-4 text-xs font-bold text-gray-600 w-[80px]">Toplam</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {staff.map(member => (
                                <tr key={member.id} className="group hover:bg-gray-50/30 transition-all">
                                    <td className="border-r border-gray-100 px-3 py-3 text-sm font-bold text-gray-700 truncate bg-gray-50/50">
                                        {member.first_name} {member.last_name}
                                    </td>
                                    {weekDays.map(day => {
                                        const shift = getShiftFor(member.id, day);
                                        const isEditing = editingCell?.staffId === member.id && isSameDay(editingCell?.date, day);
                                        return (
                                            <td
                                                key={day.toISOString()}
                                                className={`border-r border-gray-100 p-0 h-16 relative transition-all cursor-pointer text-center ${shift ? 'bg-green-50/30' : ''}`}
                                                onClick={() => !isEditing && handleStartEditing(member.id, day, shift)}
                                            >
                                                {isEditing ? (
                                                    <div className="px-1 py-1 h-full flex items-center justify-center relative z-10">
                                                        <input
                                                            ref={inputRef}
                                                            type="text"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            placeholder="0918"
                                                            onBlur={handleSaveShift}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveShift()}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            autoComplete="off"
                                                            className="w-full h-10 bg-white border-2 border-blue-500 rounded-lg text-base font-black text-center text-gray-900 focus:outline-none shadow-xl relative z-20"
                                                        />
                                                    </div>
                                                ) : shift ? (
                                                    <div className="flex flex-col items-center justify-center h-full">
                                                        <span className="text-[13px] font-black text-gray-700 tracking-tighter">
                                                            {shift.start_time.substring(0, 5)}-{shift.end_time.substring(0, 5)}
                                                        </span>
                                                        <div className="text-[9px] font-bold text-gray-400 italic">
                                                            {Math.round(shift.total_hours)} sa
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteShift(shift.id); }}
                                                            className="absolute top-1 right-1 w-5 h-5 rounded bg-red-50 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-200 font-bold text-lg">-</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="px-2 py-3 text-center bg-purple-50/30">
                                        <div className="font-black text-purple-700 text-sm">
                                            {getStaffTotalHours(member.id)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {/* Totals Row */}
                            <tr className="bg-gray-100/50">
                                <td className="border-r border-gray-100 px-3 py-3 text-[11px] font-black text-gray-400 uppercase italic">Günlük Toplam</td>
                                {weekDays.map(day => (
                                    <td key={day.toISOString()} className="border-r border-gray-100 px-2 py-3 text-center">
                                        <div className="font-black text-gray-700 text-sm">
                                            {getDailyTotalHours(day)} <span className="text-[10px] text-gray-400">sa</span>
                                        </div>
                                    </td>
                                ))}
                                <td className="px-2 py-3 text-center bg-purple-100/30">
                                    <div className="font-black text-purple-800 text-sm">
                                        {getWeeklyGrandTotal()}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Tips */}
            <div className="mt-4 px-2 flex gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">
                <span>İpucu: Sadece sayı girin (Örn: 918 → 09:00-18:00)</span>
                <span>•</span>
                <span>Enter tuşu ile kaydedin</span>
            </div>
        </div>
    );
};

export default BulkShiftEntry;
