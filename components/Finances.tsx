import React, { useState, useMemo } from 'react';
import { Payment, Cost, Student } from '../types';
import { CrudList } from './CrudList';
import { XIcon } from './Icons';

// --- New Transaction Modal ---
type TransactionType = 'cobro' | 'gasto';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddPayment: (payment: Omit<Payment, 'id'>) => void;
    onAddCost: (cost: Omit<Cost, 'id'>) => void;
    students: Student[];
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onAddPayment, onAddCost, students }) => {
    const [type, setType] = useState<TransactionType>('cobro');
    const [studentId, setStudentId] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState<Payment['method']>('cash');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<Cost['category']>('other');
    
    const paymentMethods: Payment['method'][] = ['cash', 'transfer', 'pos'];
    const costCategories: Cost['category'][] = ['teacher', 'rent', 'supplies', 'marketing', 'other'];

    if (!isOpen) return null;

    const handleSave = () => {
        if (type === 'cobro') {
            if (!studentId || amount === '' || !date || !method) {
                alert('Para un cobro, se requiere alumna/o, monto, fecha y método.');
                return;
            }
            onAddPayment({ studentId, amount: Number(amount), date: new Date(date).toISOString(), method });
        } else { // gasto
            if (!description || amount === '' || !date || !category) {
                alert('Para un gasto, se requiere descripción, monto, fecha y categoría.');
                return;
            }
            onAddCost({ description, amount: Number(amount), date: new Date(date).toISOString(), category });
        }
        onClose();
        // Reset state for next time
        setStudentId('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setDescription('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-brand-dark">Nueva Transacción</h2>
                    <button onClick={onClose}><XIcon /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo de Transacción</label>
                        <select value={type} onChange={e => setType(e.target.value as TransactionType)} className="w-full p-2 border rounded mt-1">
                            <option value="cobro">Cobro (Pago de Alumna/o)</option>
                            <option value="gasto">Gasto</option>
                        </select>
                    </div>
                    
                    {type === 'cobro' ? (
                        <>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Alumna/o</label>
                                <select value={studentId} onChange={e => setStudentId(e.target.value)} className="mt-1 w-full p-2 border rounded">
                                    <option value="">Seleccionar Alumna/o</option>
                                    {students.filter(s => s.active).sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                             <input type="number" step="0.01" placeholder="Monto (€)" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2 border rounded"/>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded"/>
                            <select value={method} onChange={e => setMethod(e.target.value as Payment['method'])} className="w-full p-2 border rounded">
                                {paymentMethods.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                            </select>
                        </>
                    ) : (
                        <>
                            <input type="text" placeholder="Descripción del gasto" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded" />
                            <select value={category} onChange={e => setCategory(e.target.value as Cost['category'])} className="w-full p-2 border rounded">
                                {costCategories.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
                            </select>
                            <input type="number" step="0.01" placeholder="Monto (€)" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2 border rounded"/>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded"/>
                        </>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                     <button onClick={onClose} type="button" className="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-purple-800">Guardar</button>
                </div>
            </div>
        </div>
    );
}

// --- Main Finances Component ---

type Transaction = {
    id: string;
    type: 'cobro' | 'gasto';
    date: string;
    amount: number;
    concept: string;
    details: string;
};

const TransactionListItem = React.memo<{ transaction: Transaction, onDelete: (id: string, type: 'cobro' | 'gasto') => void }>(({ transaction: tx, onDelete }) => {
    return (
        <div className="p-4 grid grid-cols-5 gap-4 items-center group">
            <div className="col-span-2 flex items-center">
                <div className={`w-2 h-8 rounded-full mr-4 ${tx.type === 'cobro' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                    <p className="font-semibold text-brand-dark">{tx.concept}</p>
                    <p className="text-xs text-gray-500 capitalize">{tx.details}</p>
                </div>
            </div>
            <span className="text-gray-600">{new Date(tx.date).toLocaleDateString()}</span>
            <span className={`font-mono text-right font-semibold ${tx.type === 'cobro' ? 'text-green-600' : 'text-red-600'}`}>
                {tx.type === 'cobro' ? '+' : '-'} {tx.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </span>
            <div className="text-right">
                 <button 
                    onClick={() => onDelete(tx.id, tx.type)} 
                    className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Eliminar transacción"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
});

export const Finances: React.FC<{
    payments: Payment[], 
    costs: Cost[],
    students: Student[],
    onAddPayment: (payment: Omit<Payment, 'id'>) => void,
    onAddCost: (cost: Omit<Cost, 'id'>) => void,
    onDeleteTransaction: (id: string, type: 'cobro' | 'gasto') => void,
}> = ({ payments, costs, students, onAddPayment, onAddCost, onDeleteTransaction }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const allTransactions: Transaction[] = useMemo(() => {
        const mappedPayments: Transaction[] = payments.map(p => ({
            id: p.id,
            type: 'cobro' as const,
            date: p.date,
            amount: p.amount,
            concept: students.find(s => s.id === p.studentId)?.name || 'N/A',
            details: `Cobro - ${p.method}`,
        }));
        const mappedCosts: Transaction[] = costs.map(c => ({
            id: c.id,
            type: 'gasto' as const,
            date: c.date,
            amount: c.amount,
            concept: c.description,
            details: `Gasto - ${c.category}`,
        }));
        return [...mappedPayments, ...mappedCosts].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [payments, costs, students]);


    const ListHeader = () => (
        <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-5 gap-4 items-center text-sm font-semibold text-gray-600">
            <span className="col-span-2">Concepto</span>
            <span>Fecha</span>
            <span className="text-right">Monto</span>
            <span className="text-right">Acciones</span>
        </div>
    );

    return (
        <>
            <CrudList<Transaction>
                title="Movimientos Financieros"
                items={allTransactions}
                searchKeys={['concept']}
                onAddItem={() => setIsModalOpen(true)}
                renderHeader={ListHeader}
                renderItem={(tx) => <TransactionListItem transaction={tx} onDelete={onDeleteTransaction} />}
            />
            <TransactionModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddPayment={onAddPayment}
                onAddCost={onAddCost}
                students={students}
            />
        </>
    );
}
