// src/App.jsx
import { useState } from 'react';
import TemplateManager from './components/TemplateManager';
import { Settings, FileText, Database } from 'lucide-react';
import Formato71Exporter from './components/Formato71Exporter';
import ActivosDashboard from './components/ActivosDashboard';
import RegistroActivos from './components/RegistroActivos';
import MovimientosActivos from './components/MovimientosActivos';
import DepreciacionView from './components/DepreciacionView';
import GestionCategorias from './components/GestionCategorias';
import ReportesSunat from './components/ReportesSunat';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra de navegación */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex space-x-8">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    currentView === 'dashboard'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Database className="h-5 w-5 mr-2" />
                  Dashboard
                </button>

                <button
                  onClick={() => setCurrentView('registro')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    currentView === 'registro'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Registro de Activos
                </button>

                <button
                  onClick={() => setCurrentView('movimientos')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    currentView === 'movimientos'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Movimientos
                </button>

                <button
                  onClick={() => setCurrentView('depreciacion')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    currentView === 'depreciacion'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Depreciación
                </button>

                <button
                  onClick={() => setCurrentView('categorias')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    currentView === 'categorias'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Categorías
                </button>

                <button
                  onClick={() => setCurrentView('reportes')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    currentView === 'reportes'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Reportes SUNAT
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="py-8">
        {currentView === 'dashboard' && <ActivosDashboard />}
        {currentView === 'registro' && <RegistroActivos />}
        {currentView === 'movimientos' && <MovimientosActivos />}
        {currentView === 'depreciacion' && <DepreciacionView />}
        {currentView === 'categorias' && <GestionCategorias />}
        {currentView === 'reportes' && <ReportesSunat />}
      </div>
    </div>
  );
}

export default App;