import React, { useState, useMemo } from 'react';
import { ClassSession, Teacher, Discipline, Student } from '../types';
import { CrudList } from './CrudList';
import { ClassModal } from './ClassModal';
import { DISCIPLINES as ALL_DISCIPLINES } from '../constants';

interface ClassesProps {
  classes: ClassSession[];
  teachers: Teacher[];
  disciplines: Discipline[];
  students: Student[];
  onSaveClass: (session: ClassSession) => void;
  onDeleteClass: (sessionId: string) => void;
}

type AugmentedClass = ClassSession & { disciplineName: string, teacherName: string };

const ClassListItem = React.memo<{ session: AugmentedClass; onClick: (session: AugmentedClass) => void }>(({ session, onClick }) => {
    const occupancy = `${session.studentIds.length}/${session.capacity}`;
    const dayOfWeek = new Date(session.startTime).toLocaleDateString('es-ES', { weekday: 'long' });
    const time = `${new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
    return (
        <div onClick={() => onClick(session)} className="p-4 hover:bg-gray-50 cursor-pointer grid grid-cols-6 gap-4 items-center">
            <span className="font-semibold text-brand-dark col-span-2">{session.disciplineName}</span>
            <span className="text-gray-600">{session.teacherName}</span>
            <span className="text-gray-500 text-sm">{time}</span>
            <span className="text-gray-600 text-center">{occupancy}</span>
            <span className="text-gray-600 text-center capitalize">{dayOfWeek}</span>
        </div>
    );
});


export const Classes: React.FC<ClassesProps> = ({ classes, teachers, disciplines, students, onSaveClass, onDeleteClass }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<Partial<ClassSession> | null>(null);

    const handleOpenModal = (session: Partial<ClassSession> | null = null) => {
        setSelectedSession(session || { studentIds: [] });
        setIsModalOpen(true);
    };

    const ListHeader = () => (
        <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-6 gap-4 items-center text-sm font-semibold text-gray-600">
            <span className="col-span-2">Clase</span>
            <span>Profesor/a</span>
            <span>Horario</span>
            <span className="text-center">Ocupación</span>
            <span className="text-center">Día</span>
        </div>
    );

    const augmentedClasses = useMemo<AugmentedClass[]>(() => classes.map(c => {
        const discipline = disciplines.find(d => d.id === c.disciplineId) || { name: 'Desconocido' };
        const teacher = teachers.find(t => t.id === c.teacherId) || { name: 'Sin Asignar' };
        return {
            ...c,
            disciplineName: discipline.name,
            teacherName: teacher.name,
        };
    }).sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()), [classes, disciplines, teachers]);

    return (
        <>
            <CrudList<AugmentedClass>
                title="Gestión de Clases"
                items={augmentedClasses}
                searchKeys={['disciplineName', 'teacherName']}
                onAddItem={() => handleOpenModal()}
                renderHeader={ListHeader}
                renderItem={(session) => (
                   <ClassListItem session={session} onClick={handleOpenModal} />
                )}
            />
            <ClassModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={onSaveClass}
                onDelete={onDeleteClass}
                session={selectedSession}
                allClasses={classes}
                teachers={teachers}
                disciplines={disciplines.length > 0 ? disciplines : ALL_DISCIPLINES}
                students={students}
            />
        </>
    );
};
