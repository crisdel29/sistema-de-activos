// src/components/Navbar.jsx
import React from 'react';
import { Settings, FileText, Database, PieChart } from 'lucide-react';

const Navbar = ({ currentView, setCurrentView }) => {
  const navItems = [
    { id: 'dashboard', icon: PieChart, label: 'Dashboard' },
    { id: 'registro', icon: Database, label: 'Registro de Activos' },
    { id: 'movimientos', icon: Settings, label: 'Movimientos' },
    { id: 'depreciacion', icon: Settings, label: 'Depreciación' },
    { id: 'categorias', icon: Settings, label: 'Categorías' },
    { id: 'reportes', icon: FileText, label: 'Reportes SUNAT' }
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex space-x-8">
              {navItems.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setCurrentView(id)}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                    ${currentView === id
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;