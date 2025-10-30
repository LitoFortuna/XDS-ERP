import React from 'react';
import { PlusIcon } from './Icons';

interface CrudListProps<T> {
  title: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  onAddItem: () => void;
  searchKeys: (keyof T)[];
}

export function CrudList<T extends { id: string }>({ title, items, renderItem, renderHeader, onAddItem, searchKeys }: CrudListProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    return searchKeys.some(key => {
        const value = item[key];
        if (typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
    });
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-brand-dark">{title}</h1>
        <button onClick={onAddItem} className="flex items-center px-4 py-2 bg-brand-pink text-white rounded-lg shadow hover:bg-pink-600 transition-colors">
          <PlusIcon className="w-5 h-5 mr-2" />
          Añadir
        </button>
      </div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
        />
      </div>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {renderHeader && renderHeader()}
        <ul className="divide-y divide-gray-200">
            {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                    <li key={item.id}>{renderItem(item)}</li>
                ))
            ) : (
                <li className="p-4 text-center text-gray-500">No se encontraron resultados.</li>
            )}
        </ul>
      </div>
    </div>
  );
}