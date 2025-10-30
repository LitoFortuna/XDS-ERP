import React, { useEffect, useRef } from 'react';
import { Student, ClassSession, Payment, Cost } from '../types';
import { UsersIcon, CalendarIcon, CurrencyDollarIcon } from './Icons';
import { DISCIPLINES } from '../constants';

interface DashboardProps {
    students: Student[];
    classes: ClassSession[];
    payments: Payment[];
    costs: Cost[];
}

const KPICard: React.FC<{ title: string; value: string | number; icon: React.ReactElement; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center transition-transform transform hover:scale-105">
        <div className={`p-4 rounded-full ${color}`}>
            {icon}
        </div>
        <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const TopClassItem = React.memo(({ classInfo }: { classInfo: ClassSession & { disciplineName: string } }) => {
    const occupancy = classInfo.capacity > 0 ? (classInfo.studentIds.length / classInfo.capacity) * 100 : 0;
    return (
        <li className="mb-4 p-3 rounded-lg hover:bg-gray-50">
            <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">{classInfo.disciplineName}</span>
                <span className="text-sm text-gray-500">{classInfo.studentIds.length} / {classInfo.capacity}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div className="bg-brand-pink h-2.5 rounded-full" style={{ width: `${occupancy}%` }}></div>
            </div>
        </li>
    );
});


export const Dashboard: React.FC<DashboardProps> = ({ students, classes, payments, costs }) => {
    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstance = useRef<any>(null);

    const activeStudents = students.filter(s => s.active).length;

    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    const monthlyIncome = payments
        .filter(p => new Date(p.date).getMonth() === thisMonth && new Date(p.date).getFullYear() === thisYear)
        .reduce((sum, p) => sum + p.amount, 0);

    const totalCapacity = classes.reduce((sum, c) => sum + c.capacity, 0);
    const totalEnrolled = classes.reduce((sum, c) => sum + c.studentIds.length, 0);
    const avgOccupancy = totalCapacity > 0 ? ((totalEnrolled / totalCapacity) * 100).toFixed(0) : 0;

    const topClasses = [...classes]
        .map(c => ({
            ...c,
            disciplineName: DISCIPLINES.find(d => d.id === c.disciplineId)?.name || 'Clase Desconocida'
        }))
        .sort((a, b) => (b.studentIds.length / b.capacity) - (a.studentIds.length / a.capacity))
        .slice(0, 5);
        
    const recentTransactions = [
        ...payments.map(p => ({ ...p, type: 'payment' as const })),
        ...costs.map(c => ({ ...c, type: 'cost' as const }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    
    const pendingFor2026 = students
        .filter(s => s.active)
        .reduce((total, student) => {
            const monthlyFee = student.customPrice ?? 25;
            const annualFee = monthlyFee * 12;
            const paidIn2026 = payments
                .filter(p => p.studentId === student.id && new Date(p.date).getFullYear() === 2026)
                .reduce((sum, p) => sum + p.amount, 0);
            return total + (annualFee - paidIn2026);
        }, 0);

    useEffect(() => {
        if (!chartRef.current) return;

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const currentYear = new Date().getFullYear();
        const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthlyIncomeData = new Array(12).fill(0);
        const monthlyCostsData = new Array(12).fill(0);

        payments.forEach(p => {
            const paymentDate = new Date(p.date);
            if (paymentDate.getFullYear() === currentYear) {
                const month = paymentDate.getMonth(); // 0-11
                monthlyIncomeData[month] += p.amount;
            }
        });

        costs.forEach(c => {
            const costDate = new Date(c.date);
            if (costDate.getFullYear() === currentYear) {
                const month = costDate.getMonth(); // 0-11
                monthlyCostsData[month] += c.amount;
            }
        });

        chartInstance.current = new (window as any).Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthLabels,
                datasets: [
                    {
                        label: 'Ingresos',
                        data: monthlyIncomeData,
                        backgroundColor: '#6D28D9', // brand-purple
                        borderColor: '#5B21B6',
                        borderWidth: 1
                    },
                    {
                        label: 'Costes',
                        data: monthlyCostsData,
                        backgroundColor: '#EC4899', // brand-pink
                        borderColor: '#DB2777',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value: string | number) {
                                if (typeof value === 'number') {
                                    return value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
                                }
                                return value;
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context: any) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [payments, costs]);

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold text-brand-dark mb-8">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <KPICard title="Alumnas/os Activas/os" value={activeStudents} icon={<UsersIcon className="text-white"/>} color="bg-blue-500" />
                <KPICard title="Ingresos del Mes" value={`${monthlyIncome.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`} icon={<CurrencyDollarIcon className="text-white"/>} color="bg-green-500" />
                <KPICard title="Cobros Pendientes (2026)" value={`${pendingFor2026.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`} icon={<CurrencyDollarIcon className="text-white"/>} color="bg-red-500" />
                <KPICard title="Ocupación Media" value={`${avgOccupancy}%`} icon={<CalendarIcon className="text-white"/>} color="bg-yellow-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold text-brand-dark mb-4">Top Clases por Ocupación</h2>
                    <ul>
                        {topClasses.map(c => <TopClassItem key={c.id} classInfo={c} />)}
                    </ul>
                </div>
                
                 <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold text-brand-dark mb-4">Últimos Movimientos</h2>
                    {recentTransactions.length > 0 ? (
                        <ul className="space-y-3">
                            {recentTransactions.map(tx => {
                                const isPayment = tx.type === 'payment';
                                const student = isPayment ? students.find(s => s.id === (tx as Payment).studentId) : null;
                                return (
                                    <li key={`${tx.type}-${tx.id}`} className="p-2 bg-gray-50 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className={`font-semibold text-sm ${isPayment ? 'text-green-800' : 'text-red-800'}`}>
                                                {isPayment ? `Cobro de ${student?.name || 'N/A'}` : (tx as Cost).description}
                                            </p>
                                            <p className="text-xs text-gray-600">{new Date(tx.date).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`font-bold ${isPayment ? 'text-green-700' : 'text-red-700'}`}>
                                            {isPayment ? '+' : '-'} {tx.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>
                    ) : (
                        <p className="text-gray-500">No hay transacciones recientes.</p>
                    )}
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                     <h2 className="text-2xl font-bold text-brand-dark mb-4">Resumen Financiero Anual ({new Date().getFullYear()})</h2>
                     <div className="relative h-96">
                        <canvas ref={chartRef}></canvas>
                    </div>
                </div>
            </div>
        </div>
    );
}