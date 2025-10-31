
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Student, Payment, Cost } from '../types';

interface ImageAnalyzerProps {
    students: Student[];
    onAddPayment: (payment: Omit<Payment, 'id'>) => void;
    onAddCost: (cost: Omit<Cost, 'id'>) => void;
}

interface AnalysisResult {
    amount: number;
    date: string;
    description: string;
}

// Helper to convert file to base64
const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                resolve('');
            }
        };
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

const AnalyzedTransactionForm: React.FC<{
    result: AnalysisResult;
    students: Student[];
    onSave: (type: 'cobro' | 'gasto', data: Omit<Payment, 'id'> | Omit<Cost, 'id'>) => void;
    onCancel: () => void;
}> = ({ result, students, onSave, onCancel }) => {
    
    const [type, setType] = useState<'cobro' | 'gasto'>('gasto');
    const [formData, setFormData] = useState({
        studentId: '',
        amount: result.amount || '',
        date: result.date || new Date().toISOString().split('T')[0],
        method: 'cash' as Payment['method'],
        description: result.description || '',
        category: 'other' as Cost['category'],
    });

    const handleSave = () => {
        if (type === 'cobro') {
            if (!formData.studentId || !formData.amount) {
                alert('Para un cobro, se requiere alumna/o y monto.');
                return;
            }
            onSave('cobro', { 
                studentId: formData.studentId, 
                amount: Number(formData.amount), 
                date: new Date(formData.date).toISOString(), 
                method: formData.method 
            });
        } else {
            if (!formData.description || !formData.amount) {
                alert('Para un gasto, se requiere descripción y monto.');
                return;
            }
            onSave('gasto', { 
                description: formData.description, 
                amount: Number(formData.amount), 
                date: new Date(formData.date).toISOString(), 
                category: formData.category
            });
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-md mt-8 border-t-4 border-brand-purple">
            <h3 className="text-xl font-bold text-brand-dark mb-4">Crear Transacción desde Análisis</h3>
             <div className="space-y-4">
                <select value={type} onChange={e => setType(e.target.value as 'cobro' | 'gasto')} className="w-full p-2 border rounded mt-1">
                    <option value="gasto">Gasto</option>
                    <option value="cobro">Cobro (Pago de Alumna/o)</option>
                </select>

                {type === 'cobro' && (
                     <select value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} className="mt-1 w-full p-2 border rounded">
                        <option value="">Seleccionar Alumna/o</option>
                        {students.filter(s => s.active).sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                )}
                 {type === 'gasto' && (
                    <input type="text" placeholder="Descripción" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded"/>
                 )}

                 <input type="number" placeholder="Monto" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full p-2 border rounded"/>
                 <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-2 border rounded"/>

                 <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-brand-pink text-white rounded-md hover:bg-pink-700">Guardar Transacción</button>
                 </div>
            </div>
        </div>
    );
};


export const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ students, onAddPayment, onAddCost }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setAnalysisResult(null);
            setError(null);
        }
    };
    
    const handleAnalyze = async () => {
        if (!imageFile) return;

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const imagePart = await fileToGenerativePart(imageFile);
            
            const prompt = "Analiza este recibo o factura. Extrae el importe total, la fecha de la transacción y un concepto o descripción breve. Devuelve el resultado únicamente en formato JSON con las claves 'amount' (número), 'date' (formato AAAA-MM-DD) y 'description' (cadena de texto). Si no encuentras un dato, déjalo como null.";
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, { text: prompt }] },
            });

            const text = response.text;
            try {
                const jsonString = text.trim().replace(/^```json|```$/g, '');
                const result = JSON.parse(jsonString);
                setAnalysisResult(result);
            } catch (jsonError) {
                console.error("Failed to parse JSON from Gemini:", jsonError);
                setError("La IA devolvió un formato inesperado. Inténtalo con otra imagen.");
            }

        } catch (err) {
            console.error(err);
            setError('No se pudo analizar la imagen. Por favor, inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveTransaction = (type: 'cobro' | 'gasto', data: Omit<Payment, 'id'> | Omit<Cost, 'id'>) => {
        if (type === 'cobro') {
            onAddPayment(data as Omit<Payment, 'id'>);
        } else {
            onAddCost(data as Omit<Cost, 'id'>);
        }
        // Reset after saving
        setAnalysisResult(null);
        setImageFile(null);
        setPreviewUrl(null);
        alert('Transacción guardada con éxito.');
    };


    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold text-brand-dark mb-8">Analizar Recibo o Factura</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold text-brand-dark mb-4">1. Sube una Imagen</h2>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input type="file" id="imageUpload" accept="image/*" onChange={handleImageChange} className="hidden" />
                        <label htmlFor="imageUpload" className="cursor-pointer bg-brand-purple text-white px-4 py-2 rounded-lg shadow hover:bg-purple-800 transition-colors">
                            Seleccionar Archivo
                        </label>
                        {previewUrl && <img src={previewUrl} alt="Preview" className="mt-4 max-h-60 mx-auto rounded-lg"/>}
                    </div>
                    <button
                        onClick={handleAnalyze}
                        disabled={!imageFile || isLoading}
                        className="w-full mt-4 px-4 py-3 bg-brand-pink text-white rounded-lg shadow hover:bg-pink-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Analizando...' : '2. Analizar Imagen con IA'}
                    </button>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold text-brand-dark mb-4">3. Resultado del Análisis</h2>
                    {isLoading && (
                         <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-purple"></div>
                        </div>
                    )}
                    {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
                    {!isLoading && !error && !analysisResult && (
                        <p className="text-gray-500 text-center pt-10">El resultado del análisis aparecerá aquí.</p>
                    )}
                    {analysisResult && (
                         <AnalyzedTransactionForm 
                            result={analysisResult}
                            students={students}
                            onSave={handleSaveTransaction}
                            onCancel={() => setAnalysisResult(null)}
                         />
                    )}
                </div>
            </div>
        </div>
    );
};