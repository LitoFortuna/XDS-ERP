import React, { useState, useMemo } from 'react';
import { Student, ClassSession, Discipline, Teacher, Payment } from '../types';
import { CrudList } from './CrudList';
import { XIcon } from './Icons';

interface StudentsProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  classes: ClassSession[];
  disciplines: Discipline[];
  teachers: Teacher[];
  payments: Payment[];
}

const StudentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (student: Student) => void;
    student: Partial<Student> | null;
    classes: ClassSession[];
    disciplines: Discipline[];
    teachers: Teacher[];
}> = ({ isOpen, onClose, onSave, student, classes, disciplines, teachers }) => {
    const [currentStudent, setCurrentStudent] = useState<Partial<Student> | null>(student);

    React.useEffect(() => {
        setCurrentStudent(student);
    }, [student]);

    const enrolledClasses = useMemo(() => {
        if (!currentStudent?.id) return [];
        return classes
            .filter(c => c.studentIds.includes(currentStudent.id!))
            .map(c => {
                const discipline = disciplines.find(d => d.id === c.disciplineId);
                const teacher = teachers.find(t => t.id === c.teacherId);
                return {
                    ...c,
                    disciplineName: discipline?.name || 'Desconocida',
                    teacherName: teacher?.name || 'Sin Asignar'
                };
            })
            .sort((a,b) => new Date(a.startTime).getDay() - new Date(b.startTime).getDay());
    }, [classes, disciplines, teachers, currentStudent]);


    if (!isOpen || !currentStudent) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const isChecked = (e.target as HTMLInputElement).checked;
            setCurrentStudent({ 
                ...currentStudent, 
                [name]: isChecked,
                leaveDate: !isChecked ? new Date().toISOString().split('T')[0] : undefined
            });
        } else if (name === 'customClassesPerWeek' || name === 'customPrice') {
             setCurrentStudent({ ...currentStudent, [name]: value === '' ? undefined : Number(value) });
        } else {
            setCurrentStudent({ ...currentStudent, [name]: value });
        }
    };

    const handleSave = () => {
        if (!currentStudent.name || !currentStudent.email) {
            alert('Nombre y Email son obligatorios.');
            return;
        }

        const finalStudent: Student = {
            id: currentStudent.id || `student-${Date.now()}`,
            name: currentStudent.name,
            email: currentStudent.email,
            phone: currentStudent.phone,
            dob: currentStudent.dob,
            notes: currentStudent.notes,
            active: currentStudent.active === undefined ? true : currentStudent.active,
            planId: currentStudent.planId,
            joinDate: currentStudent.joinDate || new Date().toISOString(),
            leaveDate: currentStudent.leaveDate,
            customPrice: currentStudent.customPrice,
            customClassesPerWeek: currentStudent.customClassesPerWeek
        };
        onSave(finalStudent);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl my-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-brand-dark">{currentStudent.id ? 'Editar Alumna/o' : 'Nueva/o Alumna/o'}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XIcon /></button>
                </div>
                <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
                        <input type="text" name="name" value={currentStudent.name || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" name="email" value={currentStudent.email || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Teléfono (Opcional)</label>
                            <input type="tel" name="phone" value={currentStudent.phone || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
                        </div>
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                        <input type="date" name="dob" value={currentStudent.dob ? currentStudent.dob.split('T')[0] : ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-md border">
                        <p className="text-sm font-semibold text-gray-600 mb-2">Personalización (Opcional)</p>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nº Clases</label>
                                <input 
                                    type="number" 
                                    name="customClassesPerWeek" 
                                    value={currentStudent.customClassesPerWeek ?? ''}
                                    onChange={handleChange}
                                    placeholder="Nº clases (ej: 3)"
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Precio (€)</label>
                                <input 
                                    type="number" 
                                    name="customPrice" 
                                    value={currentStudent.customPrice ?? ''} 
                                    onChange={handleChange}
                                    placeholder="Precio (ej: 85)"
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Notas adicionales</label>
                        <textarea name="notes" rows={3} value={currentStudent.notes || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md"></textarea>
                    </div>

                    {currentStudent.id && (
                        <div className="border-t pt-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Clases Inscritas ({enrolledClasses.length})</h3>
                            {enrolledClasses.length > 0 ? (
                                <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 rounded-md bg-gray-50 p-2 border">
                                    {enrolledClasses.map(c => {
                                        const dayOfWeek = new Date(c.startTime).toLocaleDateString('es-ES', { weekday: 'long' });
                                        const time = `${new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(c.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                        return (
                                            <li key={c.id} className="p-2 bg-white rounded-md shadow-sm text-sm border-l-4 border-brand-pink">
                                                <p className="font-bold text-brand-purple">{c.disciplineName}</p>
                                                <p className="text-gray-600 capitalize">{dayOfWeek}, {time}</p>
                                                <p className="text-xs text-gray-500 italic">Profesor/a: {c.teacherName}</p>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">No está inscrita/o en ninguna clase.</p>
                            )}
                        </div>
                    )}


                    <div className="border-t pt-4">
                        <div className="flex items-center">
                            <input type="checkbox" name="active" id="active" checked={currentStudent.active === undefined ? true : currentStudent.active} onChange={handleChange} className="h-4 w-4 text-brand-purple focus:ring-brand-purple border-gray-300 rounded"/>
                            <label htmlFor="active" className="ml-2 block text-sm text-gray-900">Activa/o</label>
                        </div>
                        {!currentStudent.active && (
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mt-2">Fecha de baja</label>
                                <input type="date" name="leaveDate" value={currentStudent.leaveDate ? currentStudent.leaveDate.split('T')[0] : ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
                            </div>
                        )}
                    </div>

                </div>
                <div className="mt-6 flex justify-end">
                     <button onClick={onClose} type="button" className="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleSave} type="button" className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-purple-800">Guardar</button>
                </div>
            </div>
        </div>
    );
};

const StudentListItem = React.memo<{ student: Student; payments: Payment[]; onClick: (student: Student) => void }>(({ student, payments, onClick }) => {
    const classesToShow = student.customClassesPerWeek;
    const priceToShow = student.customPrice;
    
    let planDisplay: string | number = 'N/A';
    if (classesToShow !== undefined) {
        if (classesToShow === 99) planDisplay = 'Ilimitado';
        else if (classesToShow === 0) planDisplay = 'Sueltas';
        else planDisplay = classesToShow;
    }

    const pendingFor2026 = useMemo(() => {
        if (!student.active) return 0;
        const monthlyFee = student.customPrice ?? 25;
        const annualFee = monthlyFee * 12;
        const paidIn2026 = payments
            .filter(p => p.studentId === student.id && new Date(p.date).getFullYear() === 2026)
            .reduce((sum, p) => sum + p.amount, 0);
        return annualFee - paidIn2026;
    }, [student, payments]);

    return (
        <div onClick={() => onClick(student)} className="p-4 hover:bg-gray-50 cursor-pointer grid grid-cols-10 gap-4 items-center">
            <span className="font-semibold text-brand-dark col-span-2 truncate" title={student.name}>{student.name}</span>
            <span className="text-gray-600 col-span-2 truncate" title={student.email}>{student.email}</span>
            <span className="text-gray-500 text-sm">{new Date(student.joinDate).toLocaleDateString()}</span>
            <span className="text-gray-600 text-center">{planDisplay}</span>
            <span className="text-gray-600 text-center font-mono">{priceToShow?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) ?? '—'}</span>
            <span className={`text-center font-semibold ${pendingFor2026 > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {pendingFor2026.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </span>
            <span className="text-gray-500 text-sm">
                {student.leaveDate ? new Date(student.leaveDate).toLocaleDateString() : '—'}
            </span>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full text-center ${student.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {student.active ? 'Activa/o' : 'Inactiva/o'}
            </span>
        </div>
    );
});


export const Students: React.FC<StudentsProps> = ({ students, onUpdateStudents, classes, disciplines, teachers, payments }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Partial<Student> | null>(null);

    const handleSaveStudent = (student: Student) => {
        const existingIndex = students.findIndex(s => s.id === student.id);
        if (existingIndex > -1) {
            const updated = [...students];
            updated[existingIndex] = student;
            onUpdateStudents(updated);
        } else {
            onUpdateStudents([...students, student]);
        }
    };
    
    const handleOpenModal = (student: Partial<Student> | null = null) => {
        setSelectedStudent(student || { active: true, joinDate: new Date().toISOString() });
        setIsModalOpen(true);
    };

    const ListHeader = () => (
        <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-10 gap-4 items-center text-sm font-semibold text-gray-600">
            <span className="col-span-2">Nombre</span>
            <span className="col-span-2">Email</span>
            <span>Fecha de alta</span>
            <span className="text-center">Clases</span>
            <span className="text-center">Precio</span>
            <span className="text-center">Pendiente (2026)</span>
            <span>Fecha de baja</span>
            <span className="text-center">Estado</span>
        </div>
    );

    return (
        <>
            <CrudList<Student>
                title="Alumnado"
                items={students}
                searchKeys={['name', 'email']}
                onAddItem={() => handleOpenModal()}
                renderHeader={ListHeader}
                renderItem={(student) => (
                    <StudentListItem student={student} payments={payments} onClick={handleOpenModal} />
                )}
            />
            <StudentModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveStudent}
                student={selectedStudent}
                classes={classes}
                disciplines={disciplines}
                teachers={teachers}
            />
        </>
    );
};