import React, { useState, useEffect } from 'react';
import { ClassSession, Teacher, Discipline, Student } from '../types';
import { XIcon } from './Icons';

interface ClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (session: ClassSession) => void;
    onDelete?: (sessionId: string) => void;
    session: Partial<ClassSession> | null;
    allClasses: ClassSession[];
    teachers: Teacher[];
    disciplines: Discipline[];
    students: Student[];
}

const DAY_TO_DATE_MAP: { [key: string]: string } = {
  '1': '2025-09-01', // Monday
  '2': '2025-09-02', // Tuesday
  '3': '2025-09-03', // Wednesday
  '4': '2025-09-04', // Thursday
  '5': '2025-09-05', // Friday
};

export const ClassModal: React.FC<ClassModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    session,
    allClasses,
    teachers,
    disciplines,
    students
}) => {
    const [currentSession, setCurrentSession] = useState<Partial<ClassSession>>({});
    const [dayOfWeek, setDayOfWeek] = useState('1');
    const [startTimeStr, setStartTimeStr] = useState('');
    const [endTimeStr, setEndTimeStr] = useState('');
    const [error, setError] = useState<string>('');
    const [studentSearch, setStudentSearch] = useState('');

    useEffect(() => {
        if (session) {
            setCurrentSession(session);
            if (session.startTime) {
                const startDate = new Date(session.startTime);
                const day = startDate.getDay(); // Sunday: 0, Monday: 1
                setDayOfWeek(String(day));
                setStartTimeStr(startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
            } else {
                setDayOfWeek('1'); // Default to Monday
                setStartTimeStr('');
            }
            if (session.endTime) {
                const endDate = new Date(session.endTime);
                setEndTimeStr(endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
            } else {
                setEndTimeStr('');
            }
        }
        setError('');
        setStudentSearch('');
    }, [session]);

    if (!isOpen || !session) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setCurrentSession({ ...currentSession, [e.target.name]: e.target.value });
    };

    const handleStudentToggle = (studentId: string) => {
        const currentIds = currentSession.studentIds || [];
        const isEnrolled = currentIds.includes(studentId);
        const capacity = Number(currentSession.capacity) || 0;
        let newIds: string[];
    
        if (isEnrolled) {
            newIds = currentIds.filter(id => id !== studentId);
        } else {
            if (currentIds.length >= capacity) {
                return; // Capacity reached, do nothing.
            }
            newIds = [...currentIds, studentId];
        }
        setCurrentSession({ ...currentSession, studentIds: newIds });
    };

    const handleSave = () => {
        setError('');
        if (!currentSession.disciplineId || !dayOfWeek || !startTimeStr || !endTimeStr || !currentSession.capacity) {
            setError('Por favor, rellena todos los campos obligatorios.');
            return;
        }

        const classDate = DAY_TO_DATE_MAP[dayOfWeek];

        if (!classDate) {
            setError('Por favor, selecciona un día de la semana válido.');
            return;
        }

        const newStartTime = new Date(`${classDate}T${startTimeStr}`);
        const newEndTime = new Date(`${classDate}T${endTimeStr}`);

        if (isNaN(newStartTime.getTime()) || isNaN(newEndTime.getTime())) {
            setError('La fecha o las horas introducidas no son válidas.');
            return;
        }

        if (newStartTime >= newEndTime) {
            setError('La hora de fin debe ser posterior a la hora de inicio.');
            return;
        }

        const classStartHour = newStartTime.getHours() + newStartTime.getMinutes() / 60;
        const classEndHour = newEndTime.getHours() + newEndTime.getMinutes() / 60;

        const forbiddenRanges = [
            { start: 7, end: 8, message: 'La franja de 07:00 a 08:00 no está disponible.' },
            { start: 12, end: 15, message: 'La franja de 12:00 a 15:00 no está disponible.' }
        ];

        for (const range of forbiddenRanges) {
            if (classStartHour < range.end && classEndHour > range.start) {
                setError(range.message);
                return;
            }
        }

        const hasOverlap = allClasses.some(c => {
            if (c.id === currentSession.id) return false;
            const existingStart = new Date(c.startTime);
            const existingEnd = new Date(c.endTime);
            return (newStartTime < existingEnd && newEndTime > existingStart);
        });

        if (hasOverlap) {
            setError("Conflicto de horario. La clase se solapa con otra existente.");
            return;
        }

        const finalSession: ClassSession = {
            id: currentSession.id || `cs-${Date.now()}`,
            disciplineId: currentSession.disciplineId,
            startTime: newStartTime.toISOString(),
            endTime: newEndTime.toISOString(),
            capacity: Number(currentSession.capacity),
            studentIds: currentSession.studentIds || [],
            teacherId: currentSession.teacherId || undefined,
        };
        onSave(finalSession);
        onClose();
    };

    const isCapacityReached = (currentSession.studentIds?.length || 0) >= (Number(currentSession.capacity) || 0);

    const filteredStudents = students
        .filter(s => s.active && s.name.toLowerCase().includes(studentSearch.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg my-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-brand-dark">{currentSession.id ? 'Editar Clase' : 'Nueva Clase'}</h2>
                    <button onClick={onClose}><XIcon /></button>
                </div>
                {error && <p className="text-red-500 bg-red-100 p-2 rounded-md mb-4">{error}</p>}
                <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Disciplina</label>
                        <select name="disciplineId" value={currentSession.disciplineId || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                            <option value="">Selecciona una disciplina</option>
                            {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Profesor/a</label>
                        <select name="teacherId" value={currentSession.teacherId || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                            <option value="">Sin asignar</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Día de la semana</label>
                        <select name="dayOfWeek" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                            <option value="1">Lunes</option>
                            <option value="2">Martes</option>
                            <option value="3">Miércoles</option>
                            <option value="4">Jueves</option>
                            <option value="5">Viernes</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Hora de Inicio</label>
                            <input type="time" name="startTime" value={startTimeStr} onChange={(e) => setStartTimeStr(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Hora de Fin</label>
                            <input type="time" name="endTime" value={endTimeStr} onChange={(e) => setEndTimeStr(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Capacidad</label>
                        <input type="number" name="capacity" value={currentSession.capacity || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                    </div>

                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700">Alumnas/os Inscritas/os</label>
                        <div className="mt-1 p-3 border border-gray-300 rounded-md bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                                <input
                                    type="text"
                                    placeholder="Buscar alumna/o..."
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    className="w-2/3 p-2 border border-gray-300 rounded-md text-sm"
                                />
                                <span className={`text-sm font-semibold ${isCapacityReached ? 'text-red-600' : 'text-gray-600'}`}>
                                    {currentSession.studentIds?.length || 0} / {currentSession.capacity || 0}
                                </span>
                            </div>
                            <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                                {filteredStudents.map(student => {
                                    const isEnrolled = currentSession.studentIds?.includes(student.id);
                                    return (
                                        <div key={student.id} className="flex items-center p-1 rounded hover:bg-gray-200">
                                            <input
                                                type="checkbox"
                                                id={`student-${student.id}`}
                                                checked={isEnrolled || false}
                                                onChange={() => handleStudentToggle(student.id)}
                                                disabled={!isEnrolled && isCapacityReached}
                                                className="h-4 w-4 text-brand-purple focus:ring-brand-purple border-gray-300 rounded disabled:opacity-50 cursor-pointer"
                                            />
                                            <label htmlFor={`student-${student.id}`} className="ml-3 text-sm text-gray-800 cursor-pointer flex-1">{student.name}</label>
                                        </div>
                                    );
                                })}
                                {filteredStudents.length === 0 && (
                                    <p className="text-center text-sm text-gray-500 py-4">No se encontraron alumnas/os.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-between">
                    <div>
                        {currentSession.id && onDelete && (
                            <button onClick={() => { if (confirm('¿Estás segura/o de que quieres eliminar esta clase? Esta acción no se puede deshacer.')) { onDelete(currentSession.id!); onClose(); }}} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                                Eliminar
                            </button>
                        )}
                    </div>
                     <div className="flex justify-end">
                        <button onClick={onClose} type="button" className="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-purple-800">
                            Guardar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};