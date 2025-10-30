import React, { useState } from 'react';
import { ClassSession, Teacher, Student, Discipline } from '../types';
import { WEEKDAYS, DISCIPLINES } from '../constants';
import { PlusIcon } from './Icons';
import { ClassModal } from './ClassModal';

interface ScheduleProps {
  classes: ClassSession[];
  teachers: Teacher[];
  students: Student[];
  onUpdateClasses: (classes: ClassSession[]) => void;
}

const ClassCard = React.memo<{ classInfo: ClassSession; teacherName?: string; onClick: () => void }>(({ classInfo, teacherName, onClick }) => {
    const discipline = DISCIPLINES.find(d => d.id === classInfo.disciplineId);
    const occupancy = classInfo.capacity > 0 ? (classInfo.studentIds.length / classInfo.capacity) * 100 : 0;
    const occupancyColor = occupancy > 85 ? 'bg-red-500' : occupancy > 60 ? 'bg-yellow-500' : 'bg-green-500';

    return (
        <div 
            onClick={onClick} 
            className="bg-brand-purple text-white p-1.5 rounded-lg cursor-pointer shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col justify-between overflow-hidden"
        >
            <div className="flex-grow flex flex-col justify-center text-center">
                <h4 className="font-bold text-xs leading-tight whitespace-normal break-words">{discipline?.name}</h4>
                {teacherName && <p className="text-[11px] text-purple-200 italic truncate">{teacherName}</p>}
            </div>
            <div className="flex-shrink-0 mt-1">
                <div className="flex justify-between items-center text-[11px]">
                    <p>{new Date(classInfo.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(classInfo.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <span className="font-semibold">{classInfo.studentIds.length}/{classInfo.capacity}</span>
                </div>
                <div className="w-full bg-purple-300 rounded-full h-1.5 mt-1">
                    <div className={`${occupancyColor} h-1.5 rounded-full`} style={{ width: `${occupancy}%` }}></div>
                </div>
            </div>
        </div>
    );
});

export const Schedule: React.FC<ScheduleProps> = ({ classes, teachers, students, onUpdateClasses }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<Partial<ClassSession> | null>(null);

    const handleSaveClass = (session: ClassSession) => {
        const existingIndex = classes.findIndex(c => c.id === session.id);
        if (existingIndex > -1) {
            const updatedClasses = [...classes];
            updatedClasses[existingIndex] = session;
            onUpdateClasses(updatedClasses);
        } else {
            onUpdateClasses([...classes, session]);
        }
    };
    
    const handleDeleteClass = (sessionId: string) => {
        onUpdateClasses(classes.filter(c => c.id !== sessionId));
    };

    const handleOpenModal = (session: Partial<ClassSession> | null = null) => {
        setSelectedSession(session || {});
        setIsModalOpen(true);
    };

    const timeSlots = Array.from({ length: 15 }, (_, i) => `${i + 7}:00`).filter(time => time !== '7:00' && time !== '12:00' && time !== '13:00' && time !== '14:00');

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 px-4 py-4 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-brand-dark">Horario Semanal</h1>
                <button onClick={() => handleOpenModal()} className="flex items-center px-4 py-2 bg-brand-pink text-white rounded-lg shadow hover:bg-pink-600 transition-colors">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nueva Clase
                </button>
            </div>
            <div className="flex-grow flex flex-col overflow-hidden">
                <div className="grid grid-cols-6 grid-rows-1 flex-shrink-0">
                    <div className="col-start-2 col-span-5 grid grid-cols-5">
                        {WEEKDAYS.map(day => <div key={day} className="text-center font-bold text-brand-dark p-2 border-b-2 border-gray-200">{day}</div>)}
                    </div>
                </div>
                <div className="flex-grow grid grid-cols-6 overflow-y-auto">
                    <div className="text-right text-sm text-gray-500 pr-2">
                        {timeSlots.map(time => (
                            <div key={time} style={{height: '80px'}} className="relative -top-2 flex items-start justify-end pt-1">{time}</div>
                        ))}
                    </div>
                    <div className="col-span-5 grid grid-cols-5 border-l border-gray-200 relative">
                        {timeSlots.slice(0,-1).map((time, idx) => (
                            <div key={idx} className="col-span-5 grid grid-cols-5 h-[80px] border-b border-gray-200">
                               {Array.from({length: 5}).map((_, i) => <div key={i} className="border-r border-gray-200 h-full"></div>)}
                            </div>
                        ))}

                        {classes
                            .filter(c => {
                                const day = new Date(c.startTime).getDay();
                                const startHour = new Date(c.startTime).getHours();
                                return day !== 0 && day !== 6 && startHour >= 8; // Filter out weekends and classes before 8am
                            })
                            .map(c => {
                            const start = new Date(c.startTime);
                            const end = new Date(c.endTime);
                            const dayIndex = (start.getDay() + 6) % 7; // Monday is 0
                            const startHour = start.getHours();
                            const startMinutes = start.getMinutes();
                            const durationMinutes = (end.getTime() - start.getTime()) / 60000;
                            
                            const hourOffset = startHour >= 15 ? 3 : 0; // Gap for 12, 13, 14h
                            const top = (startHour - 8 - hourOffset + startMinutes / 60) * 80;
                            const height = durationMinutes / 60 * 80;
                            const teacher = teachers.find(t => t.id === c.teacherId);

                            return (
                                <div key={c.id} className="absolute w-full" style={{
                                    top: `${top}px`,
                                    height: `${height}px`,
                                    left: `${(dayIndex / 5) * 100}%`,
                                    width: `${(1 / 5) * 100}%`,
                                    padding: '0 4px',
                                }}>
                                    <ClassCard classInfo={c} teacherName={teacher?.name} onClick={() => handleOpenModal(c)}/>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
             <ClassModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveClass}
                onDelete={handleDeleteClass}
                session={selectedSession}
                allClasses={classes}
                teachers={teachers}
                disciplines={DISCIPLINES}
                students={students}
            />
        </div>
    );
};