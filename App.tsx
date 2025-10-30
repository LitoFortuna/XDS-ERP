
import React, { useState } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
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

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Data Management using our custom hook for persistence
    const [students, setStudents] = useLocalStorage<Student[]>('xds_students', INITIAL_STUDENTS);
    const [teachers, setTeachers] = useLocalStorage<Teacher[]>('xds_teachers', INITIAL_TEACHERS);
    const [classes, setClasses] = useLocalStorage<ClassSession[]>('xds_classes', INITIAL_SCHEDULE);
    const [payments, setPayments] = useLocalStorage<Payment[]>('xds_payments', []);
    const [costs, setCosts] = useLocalStorage<Cost[]>('xds_costs', []);
    const [disciplines, setDisciplines] = useLocalStorage<Discipline[]>('xds_disciplines', DISCIPLINES);


    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard students={students} classes={classes} payments={payments} costs={costs} />;
            case 'schedule':
                return <Schedule classes={classes} teachers={teachers} students={students} onUpdateClasses={setClasses} />;
            case 'classes':
                return <Classes classes={classes} teachers={teachers} disciplines={disciplines} students={students} onUpdateClasses={setClasses} />;
            case 'students':
                return <Students students={students} onUpdateStudents={setStudents} classes={classes} disciplines={disciplines} teachers={teachers} payments={payments} />;
            case 'teachers':
                return <Teachers teachers={teachers} onUpdateTeachers={setTeachers} classes={classes} disciplines={disciplines} />;
            case 'finances':
                return <Finances 
                            payments={payments} 
                            costs={costs} 
                            students={students}
                            onUpdatePayments={setPayments}
                            onUpdateCosts={setCosts}
                        />;
            case 'imageAnalyzer':
                 return <ImageAnalyzer 
                            students={students} 
                            onUpdatePayments={setPayments} 
                            onUpdateCosts={setCosts} 
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
