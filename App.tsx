
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
                    // FIX: Use v8 namespaced API for Firestore
                    const collRef = db.collection(collectionName);
                    const snapshot = await collRef.get();
                    
                    if (snapshot.empty && initialData.length > 0) {
                        console.log(`Seeding ${collectionName}...`);
                        // FIX: Use v8 namespaced API for Firestore
                        const batch = db.batch();
                        initialData.forEach(item => {
                            // FIX: Use v8 namespaced API for Firestore
                            const docRef = db.collection(collectionName).doc(item.id);
                             // Exclude id from the document data to prevent duplication and ensure consistency.
                            const { id, ...itemData } = item;
                            batch.set(docRef, itemData);
                        });
                        await batch.commit();
                        return initialData;
                    }
                    
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
        // Create a clean object without the 'id' field for saving.
        const { id, ...studentData } = student;

        if (isNew) {
            // FIX: Use v8 namespaced API for Firestore
            const docRef = await db.collection('students').add(studentData);
            setStudents(prev => [...prev, { ...student, id: docRef.id }]);
        } else {
            // FIX: Use v8 namespaced API for Firestore
            await db.collection('students').doc(id).set(studentData);
            setStudents(prev => prev.map(s => s.id === student.id ? student : s));
        }
    };

    const handleSyncStudents = async () => {
        if (!confirm(`¿Estás segura/o? Esta acción sobrescribirá todos los datos del alumnado en la base de datos con los datos actuales de la aplicación. Esta acción no se puede deshacer.`)) {
            return;
        }

        console.log("Starting student sync...");
        setIsLoading(true);
        // FIX: Use v8 namespaced API for Firestore
        const batch = db.batch();
        students.forEach(student => {
            // FIX: Use v8 namespaced API for Firestore
            const studentRef = db.collection('students').doc(student.id);
            const { id, ...studentData } = student; // Create a clean object without the id field
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
        const { id, ...teacherData } = teacher;

        if (isNew) {
            // FIX: Use v8 namespaced API for Firestore
            const docRef = await db.collection('teachers').add(teacherData);
            setTeachers(prev => [...prev, { ...teacher, id: docRef.id }]);
        } else {
            // FIX: Use v8 namespaced API for Firestore
            await db.collection('teachers').doc(id).set(teacherData);
            setTeachers(prev => prev.map(t => t.id === teacher.id ? teacher : t));
        }
    };

    const handleSaveClass = async (classSession: ClassSession) => {
        // Determine if this is a new class. The modal assigns a temporary ID starting with 'cs-'.
        const isNew = !classSession.id || classSession.id.startsWith('cs-');
        
        // Separate the ID from the actual data to be stored in Firestore.
        // The document ID itself serves as the identifier, so we don't store it in the document's fields.
        const { id, ...classData } = classSession;

        try {
            if (isNew) {
                // If it's a new class, add it to the 'classes' collection.
                // Firestore will generate a unique ID for the new document.
                const docRef = await db.collection('classes').add(classData);
                // Update the local application state, replacing the temporary ID with the new permanent one from Firestore.
                setClasses(prev => [...prev, { ...classSession, id: docRef.id }]);
            } else {
                // If it's an existing class, update the document with the matching ID.
                await db.collection('classes').doc(id).set(classData);
                // Update the local application state by replacing the old version of the class with the new one.
                setClasses(prev => prev.map(c => c.id === id ? classSession : c));
            }
        } catch (error) {
            console.error("Error saving class:", error);
            alert("No se pudo guardar la clase. Por favor, inténtalo de nuevo.");
        }
    };

    const handleDeleteClass = async (classId: string) => {
        // FIX: Use v8 namespaced API for Firestore
        await db.collection('classes').doc(classId).delete();
        setClasses(prev => prev.filter(c => c.id !== classId));
    };

    const handleAddPayment = async (paymentData: Omit<Payment, 'id'>) => {
        // FIX: Use v8 namespaced API for Firestore
        const docRef = await db.collection('payments').add(paymentData);
        setPayments(prev => [...prev, { ...paymentData, id: docRef.id }]);
    };
    
    const handleAddCost = async (costData: Omit<Cost, 'id'>) => {
        // FIX: Use v8 namespaced API for Firestore
        const docRef = await db.collection('costs').add(costData);
        setCosts(prev => [...prev, { ...costData, id: docRef.id }]);
    };
    
    const handleDeleteTransaction = async (id: string, type: 'cobro' | 'gasto') => {
        const collectionName = type === 'cobro' ? 'payments' : 'costs';
        // FIX: Use v8 namespaced API for Firestore
        await db.collection(collectionName).doc(id).delete();
        if (type === 'cobro') {
            setPayments(prev => prev.filter(p => p.id !== id));
        } else {
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
            case 'imageAnalyzer':
                 return <ImageAnalyzer 
                            students={students} 
                            onAddPayment={handleAddPayment}
                            onAddCost={handleAddCost}
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
                {renderPage()}
            </main>
        </div>
    );
};

export default App;
