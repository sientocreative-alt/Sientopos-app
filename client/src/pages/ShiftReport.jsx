import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { format, startOfWeek, addDays, subWeeks, addWeeks } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Printer, Download, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ShiftReport = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [staff, setStaff] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);

    const weekDays = [...Array(7)].map((_, i) => addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i));

    useEffect(() => {
        if (user) {
            fetchStaff();
            fetchShifts();
        }
    }, [user, currentDate]);

    const fetchStaff = async () => {
        const { data } = await supabase
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

        const { data } = await supabase
            .from('staff_shifts')
            .select('*')
            .eq('business_id', user.business_id)
            .gte('date', start)
            .lte('date', end);

        if (data) setShifts(data);
        setLoading(false);
    };

    const getShiftFor = (staffId, date) => {
        return shifts.find(s => s.staff_id === staffId && s.date === format(date, 'yyyy-MM-dd'));
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-4 md:p-8 bg-[#F8F9FC] min-h-screen print:bg-white print:p-0">
            {/* Controls - Hidden on Print */}
            <div className="flex justify-between items-center mb-8 print:hidden">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                    >
                        <X size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Rapor Önizleme</h1>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-100 px-2 py-1 mr-4">
                        <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400"><ChevronLeft size={20} /></button>
                        <span className="px-4 font-bold text-gray-700 text-sm">{format(weekDays[0], 'd MMM', { locale: tr })} - {format(weekDays[6], 'd MMM', { locale: tr })}</span>
                        <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400"><ChevronRight size={20} /></button>
                    </div>
                    <button
                        onClick={handlePrint}
                        className="bg-[#2196F3] text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Printer size={18} /> Yazdır / PDF
                    </button>
                </div>
            </div>

            {/* Report Content - Image 5 Styling */}
            <div className="print-container">
                <div className="bg-white p-8 md:p-12 shadow-xl border border-gray-100 rounded-[32px] max-w-[1200px] mx-auto print:shadow-none print:border-none print:p-0 report-card">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border-2 border-black text-sm">
                            <thead>
                                <tr className="bg-[#00E5FF]">
                                    <th className="border-2 border-black px-4 py-3 text-left font-black text-black w-[200px]">Haftalık Çalışma Programı</th>
                                    {weekDays.map(day => (
                                        <th key={day.toISOString()} className="border-2 border-black px-2 py-3 text-center font-black text-black">
                                            {format(day, 'dd/MM/yyyy')}
                                        </th>
                                    ))}
                                </tr>
                                <tr className="bg-[#00E5FF]">
                                    <th className="border-2 border-black px-4 py-3 text-left font-black text-black">Personel</th>
                                    {weekDays.map(day => (
                                        <th key={day.toISOString()} className="border-2 border-black px-2 py-3 text-center font-black text-black capitalize">
                                            {format(day, 'EEEE', { locale: tr })}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {staff.map(member => (
                                    <tr key={member.id}>
                                        <td className="border-2 border-black px-4 py-3 bg-[#E0E0E0] font-black text-black">
                                            {member.first_name} {member.last_name}
                                        </td>
                                        {weekDays.map(day => {
                                            const shift = getShiftFor(member.id, day);
                                            return (
                                                <td
                                                    key={day.toISOString()}
                                                    className={`border-2 border-black px-2 py-3 text-center font-black text-[12px] min-w-[120px] ${shift ? 'bg-[#C8E6C9] text-black' : 'bg-[#FFCDD2]'}`}
                                                >
                                                    {shift ? `${shift.start_time.substring(0, 5)} - ${shift.end_time.substring(0, 5)}` : ''}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-8 flex justify-between items-end print:mt-12">
                        <div className="text-gray-400 text-xs font-bold italic">SientoPOS | Mesai Yönetim Sistemi</div>
                        <div className="text-right">
                            <div className="text-xs font-bold text-gray-500 mb-1">Onaylayan</div>
                            <div className="w-40 h-px bg-gray-300"></div>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 0.5cm; size: landscape; }
                    
                    /* Force hiding sidebar AND its parent div in App layout */
                    nav, aside, header, .sidebar, [class*="Sidebar"], .print\\:hidden { 
                        display: none !important; 
                        visibility: hidden !important;
                        width: 0 !important;
                        height: 0 !important;
                    }

                    body { 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important;
                        background-color: white !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    /* Hide ALL direct body children first */
                    body > * { display: none !important; }

                    /* White-list only the report and its parents to avoid layout breakage */
                    body > #root, 
                    body > #root > div, 
                    body > #root > div > div,
                    body > #root > div > div > div, 
                    main,
                    .print-container { 
                        display: block !important; 
                        margin: 0 !important; 
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        position: static !important;
                    }

                    /* Important: Reset the margin-left from DashboardLayout */
                    div.flex-1.ml-64 {
                        margin-left: 0 !important;
                        padding-left: 0 !important;
                    }
                    
                    .flex-1 { margin-left: 0 !important; }

                    /* Explicitly hide sidebar, header and controls */
                    nav, aside, header, .print\\:hidden, .sidebar, [class*="Sidebar"] { 
                        display: none !important; 
                    }

                    /* Remove layout offsets */
                    [class*="ml-64"], [class*="ml-"], [class*="pl-"] {
                        margin-left: 0 !important;
                        padding-left: 0 !important;
                    }

                    /* Report card reset */
                    .report-card {
                        border: none !important;
                        box-shadow: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        border-radius: 0 !important;
                        width: 100% !important;
                    }

                    table { 
                        width: 100% !important; 
                        border-collapse: collapse !important; 
                        table-layout: auto !important;
                    }
                    th, td { 
                        border: 2px solid black !important; 
                        word-break: break-all !important;
                    }
                    .bg-[#00E5FF] { background-color: #00E5FF !important; }
                    .bg-[#E0E0E0] { background-color: #E0E0E0 !important; }
                    .bg-[#C8E6C9] { background-color: #C8E6C9 !important; }
                    .bg-[#FFCDD2] { background-color: #FFCDD2 !important; }
                }
            `}} />
        </div>
    );
};

export default ShiftReport;
