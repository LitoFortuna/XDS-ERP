
import React, { useState, useEffect } from 'react';
import { Page, Student, Teacher, ClassSession, Payment, Cost, Plan, Discipline, Notification } from './types';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Schedule } from './components/Schedule';
import { Students } from './components/Students';
import { Teachers } from './components/Teachers';
import { Finances } from './components/Finances';
import { Classes } from './components/Classes';
import { Notifications } from './components/Notifications';
import { DISCIPLINES, PLANS, INITIAL_STUDENTS, INITIAL_SCHEDULE, INITIAL_TEACHERS } from './constants';
import { db } from './firebase';
import { 
    collection, 
    onSnapshot, 
    query, 
    limit, 
    getDocs, 
    writeBatch, 
    doc, 
    addDoc,
    setDoc,
    deleteDoc,
} from 'firebase/firestore';


const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Data Management using React state, synced with Firebase
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [classes, setClasses] = useState<ClassSession[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [costs, setCosts] = useState<Cost[]>([]);
    const [disciplines, setDisciplines] = useState<Discipline[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    const [dismissedNotifications, setDismissedNotifications] = useState<string[]>(() => {
        const saved = localStorage.getItem('dismissedNotifications');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        const collections: { name: keyof typeof initialDataMap; setData: (data: any) => void }[] = [
            { name: 'students', setData: setStudents },
            { name: 'teachers', setData: setTeachers },
            { name: 'classes', setData: setClasses },
            { name: 'payments', setData: setPayments },
            { name: 'costs', setData: setCosts },
            { name: 'disciplines', setData: setDisciplines },
        ];

        const initialDataMap = {
            students: INITIAL_STUDENTS,
            teachers: INITIAL_TEACHERS,
            classes: INITIAL_SCHEDULE,
            payments: [],
            costs: [],
            disciplines: DISCIPLINES,
        };

        const unsubscribes = collections.map(({ name, setData }) => {
            const collRef = collection(db, name);

            // First, check if collection is empty to seed data
            const q = query(collRef, limit(1));
            getDocs(q).then(snapshot => {
                if (snapshot.empty && initialDataMap[name].length > 0) {
                    console.log(`Seeding ${name}...`);
                    const batch = writeBatch(db);
                    const initialData = initialDataMap[name];
                    initialData.forEach((item: any) => {
                        const docRef = doc(db, name, item.id);
                        const { id, ...itemData } = item;
                        batch.set(docRef, itemData);
                    });
                    batch.commit().catch(err => console.error(`Failed to seed ${name}:`, err));
                }
            }).catch(err => console.error(`Error checking ${name} for seeding:`, err));

            // Then, set up the real-time listener
            const unsubscribe = onSnapshot(
                collRef,
                snapshot => {
                    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any[];
                    setData(data);
                    setIsLoading(false); // Stop loading after first successful fetch for any collection
                },
                error => {
                    console.error(`Error fetching ${name}:`, error);
                    // If rules are wrong, this error will fire, preventing infinite load.
                    setIsLoading(false);
                }
            );
            return unsubscribe;
        });

        // Cleanup function to unsubscribe from all listeners when the component unmounts
        return () => unsubscribes.forEach(unsub => unsub());
    }, []);

    // --- Notification Logic ---
    useEffect(() => {
        if (isLoading || disciplines.length === 0) return;

        const findConflicts = (allClasses: ClassSession[]): Notification[] => {
            const conflicts: Notification[] = [];
            const sortedClasses = [...allClasses].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
            for (let i = 0; i < sortedClasses.length; i++) {
                for (let j = i + 1; j < sortedClasses.length; j++) {
                    const classA = sortedClasses[i];
                    const classB = sortedClasses[j];
                    const startA = new Date(classA.startTime);
                    const endA = new Date(classA.endTime);
                    const startB = new Date(classB.startTime);
                    const endB = new Date(classB.endTime);

                    if (startA < endB && startB < endA) {
                        const disciplineA = disciplines.find(d => d.id === classA.disciplineId)?.name || 'Clase desconocida';
                        const disciplineB = disciplines.find(d => d.id === classB.disciplineId)?.name || 'Clase desconocida';
                        conflicts.push({
                            id: `conflict-${classA.id}-${classB.id}`,
                            message: `Conflicto de horario: '${disciplineA}' se solapa con '${disciplineB}'.`,
                            type: 'error',
                        });
                    }
                }
            }
            return conflicts;
        };

        const findLowEnrollment = (allClasses: ClassSession[]): Notification[] => {
            const LOW_ENROLLMENT_THRESHOLD = 3;
            return allClasses
                .filter(c => c.studentIds.length > 0 && c.studentIds.length <= LOW_ENROLLMENT_THRESHOLD)
                .map(c => {
                    const discipline = disciplines.find(d => d.id === c.disciplineId)?.name || 'Clase desconocida';
                    const day = new Date(c.startTime).toLocaleDateString('es-ES', { weekday: 'long' });
                    return {
                        id: `low-enrollment-${c.id}`,
                        message: `Baja inscripción: La clase '${discipline}' del ${day} tiene solo ${c.studentIds.length} alumna/o(s).`,
                        type: 'warning',
                    };
                });
        };

        const allGeneratedNotifications = [...findConflicts(classes), ...findLowEnrollment(classes)];
        const newNotifications = allGeneratedNotifications.filter(n => !dismissedNotifications.includes(n.id));
        setNotifications(newNotifications);

    }, [classes, disciplines, isLoading, dismissedNotifications]);


    const handleDismissNotification = (id: string) => {
        const newDismissed = [...dismissedNotifications, id];
        setDismissedNotifications(newDismissed);
        localStorage.setItem('dismissedNotifications', JSON.stringify(newDismissed));
    };

    // --- CRUD Handlers ---

    const handleSaveStudent = async (student: Student) => {
        const isNew = !student.id || student.id.startsWith('new-');
        // Create a clean object without the 'id' field for saving.
        const { id, ...studentData } = student;

        if (isNew) {
            // Firestore will generate ID, onSnapshot will update state
            await addDoc(collection(db, 'students'), studentData);
        } else {
            await setDoc(doc(db, 'students', id), studentData, { merge: true });
        }
    };

    const handleSyncStudents = async () => {
        if (!confirm(`¿Estás segura/o? Esta acción sobrescribirá todos los datos del alumnado en la base de datos con los datos actuales de la aplicación. Esta acción no se puede deshacer.`)) {
            return;
        }

        console.log("Starting student sync...");
        setIsLoading(true);
        const batch = writeBatch(db);
        students.forEach(student => {
            const studentRef = doc(db, 'students', student.id);
            const { id, ...studentData } = student;
            batch.set(studentRef, studentData, { merge: true });
        });

        try {
            await batch.commit();
            alert(`${students.length} registros de alumnado sincronizados con éxito.`);
        } catch (error) {
            console.error("Error syncing students:", error);
            alert("Ocurrió un error al sincronizar los datos del alumnado.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveTeacher = async (teacher: Teacher) => {
        const isNew = !teacher.id || teacher.id.startsWith('new-');
        const { id, ...teacherData } = teacher;

        if (isNew) {
            await addDoc(collection(db, 'teachers'), teacherData);
        } else {
            await setDoc(doc(db, 'teachers', id), teacherData, { merge: true });
        }
    };

    const handleSaveClass = async (classSession: ClassSession) => {
        const isNew = !classSession.id || classSession.id.startsWith('cs-');
        const { id, ...classData } = classSession;

        try {
            if (isNew) {
                await addDoc(collection(db, 'classes'), classData);
            } else {
                await setDoc(doc(db, 'classes', id), classData, { merge: true });
            }
        } catch (error) {
            console.error("Error saving class:", error);
            alert("No se pudo guardar la clase. Por favor, inténtalo de nuevo.");
        }
    };

    const handleDeleteClass = async (classId: string) => {
        await deleteDoc(doc(db, 'classes', classId));
    };

    const handleAddPayment = async (paymentData: Omit<Payment, 'id'>) => {
        await addDoc(collection(db, 'payments'), paymentData);
    };
    
    const handleAddCost = async (costData: Omit<Cost, 'id'>) => {
        await addDoc(collection(db, 'costs'), costData);
    };
    
    const handleDeleteTransaction = async (id: string, type: 'cobro' | 'gasto') => {
        const collectionName = type === 'cobro' ? 'payments' : 'costs';
        await deleteDoc(doc(db, collectionName, id));
    };


    const renderPage = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-purple"></div>
                </div>
            )
        }
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard students={students} classes={classes} payments={payments} costs={costs} disciplines={disciplines} />;
            case 'schedule':
                return <Schedule classes={classes} teachers={teachers} students={students} disciplines={disciplines} onSaveClass={handleSaveClass} onDeleteClass={handleDeleteClass} />;
            case 'classes':
                return <Classes classes={classes} teachers={teachers} disciplines={disciplines} students={students} onSaveClass={handleSaveClass} onDeleteClass={handleDeleteClass} />;
            case 'students':
                return <Students students={students} onSaveStudent={handleSaveStudent} classes={classes} disciplines={disciplines} teachers={teachers} payments={payments} onSyncStudents={handleSyncStudents} />;
            case 'teachers':
                return <Teachers teachers={teachers} onSaveTeacher={handleSaveTeacher} classes={classes} disciplines={disciplines} />;
            case 'finances':
                return <Finances 
                            payments={payments} 
                            costs={costs} 
                            students={students}
                            onAddPayment={handleAddPayment}
                            onAddCost={handleAddCost}
                            onDeleteTransaction={handleDeleteTransaction}
                        />;
            default:
                return <Dashboard students={students} classes={classes} payments={payments} costs={costs} disciplines={disciplines} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar 
                currentPage={currentPage} 
                setPage={setCurrentPage}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
            />
            <main className={`flex-1 overflow-y-auto bg-brand-light transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
                <Notifications notifications={notifications} onDismiss={handleDismissNotification} />
                {renderPage()}
            </main>
        </div>
    );
};

export default App;