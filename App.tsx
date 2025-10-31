
import React, { useState, useEffect } from 'react';
import { Page, Student, Teacher, ClassSession, Payment, Cost, Plan, Discipline } from './types';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Schedule } from './components/Schedule';
import { Students } from './components/Students';
import { Teachers } from './components/Teachers';
import { Finances } from './components/Finances';
import { Classes } from './components/Classes';
import { ImageAnalyzer } from './components/ImageAnalyzer';
import { DISCIPLINES, PLANS, INITIAL_STUDENTS, INITIAL_SCHEDULE, INITIAL_TEACHERS } from './constants';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';


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

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const fetchAndSeed = async <T extends {id: string}>(collectionName: string, initialData: T[]): Promise<T[]> => {
                    const collRef = collection(db, collectionName);
                    const snapshot = await getDocs(collRef);
                    
                    if (snapshot.empty && initialData.length > 0) {
                        console.log(`Seeding ${collectionName}...`);
                        const batch = writeBatch(db);
                        initialData.forEach(item => {
                            // Use the item's own ID when creating the document reference to preserve relationships
                            const docRef = doc(db, collectionName, item.id);
                            batch.set(docRef, item);
                        });
                        await batch.commit();
                        return initialData; // Return the data that was just seeded
                    }
                    
                    // If collection is not empty, map the data from Firestore
                    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];
                };

                const [studentsData, teachersData, classesData, paymentsData, costsData, disciplinesData] = await Promise.all([
                    fetchAndSeed('students', INITIAL_STUDENTS),
                    fetchAndSeed('teachers', INITIAL_TEACHERS),
                    fetchAndSeed('classes', INITIAL_SCHEDULE),
                    fetchAndSeed('payments', []),
                    fetchAndSeed('costs', []),
                    fetchAndSeed('disciplines', DISCIPLINES),
                ]);

                setStudents(studentsData);
                setTeachers(teachersData);
                setClasses(classesData);
                setPayments(paymentsData);
                setCosts(costsData);
                setDisciplines(disciplinesData);

            } catch (error) {
                console.error("Error fetching data from Firebase:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- CRUD Handlers ---

    const handleSaveStudent = async (student: Student) => {
        const isNew = !student.id || student.id.startsWith('new-');
        if (isNew) {
            const { id, ...studentData } = student;
            const docRef = await addDoc(collection(db, 'students'), studentData);
            setStudents(prev => [...prev, { ...student, id: docRef.id }]);
        } else {
            await setDoc(doc(db, 'students', student.id), student);
            setStudents(prev => prev.map(s => s.id === student.id ? student : s));
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
            const studentData = { ...student }; // Create a clean object
            batch.set(studentRef, studentData);
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
        if (isNew) {
            const { id, ...teacherData } = teacher;
            const docRef = await addDoc(collection(db, 'teachers'), teacherData);
            setTeachers(prev => [...prev, { ...teacher, id: docRef.id }]);
        } else {
            await setDoc(doc(db, 'teachers', teacher.id), teacher);
            setTeachers(prev => prev.map(t => t.id === teacher.id ? teacher : t));
        }
    };

    const handleSaveClass = async (classSession: ClassSession) => {
        const isNew = !classSession.id || classSession.id.startsWith('cs-');
        if (isNew) {
            const { id, ...classData } = classSession;
            const docRef = await addDoc(collection(db, 'classes'), classData);
            setClasses(prev => [...prev, { ...classSession, id: docRef.id }]);
        } else {
            await setDoc(doc(db, 'classes', classSession.id), classSession);
            setClasses(prev => prev.map(c => c.id === classSession.id ? classSession : c));
        }
    };

    const handleDeleteClass = async (classId: string) => {
        await deleteDoc(doc(db, 'classes', classId));
        setClasses(prev => prev.filter(c => c.id !== classId));
    };

    const handleAddPayment = async (paymentData: Omit<Payment, 'id'>) => {
        const docRef = await addDoc(collection(db, 'payments'), paymentData);
        setPayments(prev => [...prev, { ...paymentData, id: docRef.id }]);
    };
    
    const handleAddCost = async (costData: Omit<Cost, 'id'>) => {
        const docRef = await addDoc(collection(db, 'costs'), costData);
        setCosts(prev => [...prev, { ...costData, id: docRef.id }]);
    };
    
    const handleDeleteTransaction = async (id: string, type: 'cobro' | 'gasto') => {
        if (type === 'cobro') {
            await deleteDoc(doc(db, 'payments', id));
            setPayments(prev => prev.filter(p => p.id !== id));
        } else {
            await deleteDoc(doc(db, 'costs', id));
            setCosts(prev => prev.filter(c => c.id !== id));
        }
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
                return <Dashboard students={students} classes={classes} payments={payments} costs={costs} />;
            case 'schedule':
                return <Schedule classes={classes} teachers={teachers} students={students} onSaveClass={handleSaveClass} onDeleteClass={handleDeleteClass} />;
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
            case 'imageAnalyzer':
                 return <ImageAnalyzer 
                            students={students} 
                            onAddPayment={handleAddPayment}
                            onAddCost={handleAddCost}
                        />;
            default:
                return <Dashboard students={students} classes={classes} payments={payments} costs={costs} />;
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
                {renderPage()}
            </main>
        </div>
    );
};

export default App;