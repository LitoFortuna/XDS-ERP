import React, { useState, useMemo } from 'react';
import { Teacher, ClassSession, Discipline } from '../types';
import { CrudList } from './CrudList';
import { XIcon } from './Icons';

interface TeachersProps {
  teachers: Teacher[];
  onSaveTeacher: (teacher: Teacher) => void;
  classes: ClassSession[];
  disciplines: Discipline[];
}

const TeacherModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (teacher: Teacher) => void; 
    teacher: Partial<Teacher> | null;
    classes: ClassSession[];
    disciplines: Discipline[];
}> = ({ isOpen, onClose, onSave, teacher, classes, disciplines }) => {
    const [currentTeacher, setCurrentTeacher] = useState<Partial<Teacher> | null>(teacher);

    React.useEffect(() => {
        setCurrentTeacher(teacher);
    }, [teacher]);

    const assignedClasses = useMemo(() => {
        if (!currentTeacher?.id) return [];
        return classes
            .filter(c => c.teacherId === currentTeacher.id)
            .map(c => {
                const discipline = disciplines.find(d => d.id === c.disciplineId);
                return {
                    ...c,
                    disciplineName: discipline?.name || 'Desconocida',
                };
            })
            .sort((a,b) => new Date(a.startTime).getDay() - new Date(b.startTime).getDay());
    }, [classes, disciplines, currentTeacher]);

    if (!isOpen || !currentTeacher) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentTeacher({ ...currentTeacher, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        if (!currentTeacher.name) {
            alert('El nombre es obligatorio.');
            return;
        }

        const finalTeacher: Teacher = {
            id: currentTeacher.id || `new-${Date.now()}`,
            name: currentTeacher.name,
            contact: currentTeacher.contact || '',
        };
        onSave(finalTeacher);
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-brand-dark">{currentTeacher.id ? 'Editar Profesor/a' : 'Nuevo/a Profesor/a'}</h2>
                    <button onClick={onClose}><XIcon /></button>
                </div>
                <div className="space-y-4">
                    <input type="text" name="name" placeholder="Nombre completo" value={currentTeacher.name || ''} onChange={handleChange} className="w-full p-2 border rounded"/>
                    <input type="text" name="contact" placeholder="Email o Teléfono" value={currentTeacher.contact || ''} onChange={handleChange} className="w-full p-2 border rounded"/>
                </div>

                {currentTeacher.id && (
                    <div className="border-t pt-4 mt-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Clases Asignadas ({assignedClasses.length})</h3>
                        {assignedClasses.length > 0 ? (
                            <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 rounded-md bg-gray-50 p-2 border">
                                {assignedClasses.map(c => {
                                    const dayOfWeek = new Date(c.startTime).toLocaleDateString('es-ES', { weekday: 'long' });
                                    const time = `${new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(c.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                    return (
                                        <li key={c.id} className="p-2 bg-white rounded-md shadow-sm text-sm border-l-4 border-brand-purple">
                                            <p className="font-bold text-brand-dark">{c.disciplineName}</p>
                                            <p className="text-gray-600 capitalize">{dayOfWeek}, {time}</p>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">No tiene clases asignadas.</p>
                        )}
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} type="button" className="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-purple-800">Guardar</button>
                </div>
            </div>
        </div>
    );
};

const TeacherListItem = React.memo<{ teacher: Teacher, assignedClassesCount: number, onClick: (teacher: Teacher) => void }>(({ teacher, assignedClassesCount, onClick }) => {
    return (
        <div onClick={() => onClick(teacher)} className="p-4 hover:bg-gray-50 cursor-pointer grid grid-cols-3 gap-4 items-center">
            <span className="font-semibold text-brand-dark col-span-1">{teacher.name}</span>
            <span className="text-gray-600 col-span-1">{teacher.contact}</span>
            <span className="text-gray-600 col-span-1 text-center">{assignedClassesCount}</span>
        </div>
    );
});

export const Teachers: React.FC<TeachersProps> = ({ teachers, onSaveTeacher, classes, disciplines }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Partial<Teacher> | null>(null);
    
    const handleOpenModal = (teacher: Partial<Teacher> | null = null) => {
        setSelectedTeacher(teacher || {});
        setIsModalOpen(true);
    };

    const ListHeader = () => (
        <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-3 gap-4 items-center text-sm font-semibold text-gray-600">
            <span className="col-span-1">Nombre</span>
            <span className="col-span-1">Contacto</span>
            <span className="col-span-1 text-center">Clases Asignadas</span>
        </div>
    );
    
    const teacherClassCounts = useMemo(() => {
        const counts = new Map<string, number>();
        classes.forEach(c => {
            if (c.teacherId) {
                counts.set(c.teacherId, (counts.get(c.teacherId) || 0) + 1);
            }
        });
        return counts;
    }, [classes]);

    return (
        <>
            <CrudList<Teacher>
                title="Profesorado"
                items={teachers}
                searchKeys={['name', 'contact']}
                onAddItem={() => handleOpenModal()}
                renderHeader={ListHeader}
                renderItem={(teacher) => (
                    <TeacherListItem 
                        teacher={teacher}
                        assignedClassesCount={teacherClassCounts.get(teacher.id) || 0}
                        onClick={handleOpenModal}
                    />
                )}
            />
            <TeacherModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={onSaveTeacher}
                teacher={selectedTeacher}
                classes={classes}
                disciplines={disciplines}
            />
        </>
    );
};
