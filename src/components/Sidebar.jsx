import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, LogOut, Stethoscope } from 'lucide-react';

const MODULES_CONFIG = [
  { id: 'page1', path: '/page1', label: 'Salud General', icon: Stethoscope },
  { id: 'page2', path: '/page2', label: 'Salud Mental', icon: Stethoscope },
  { id: 'page3', path: '/page3', label: 'Ausentismos', icon: Stethoscope },
  { id: 'page4', path: '/page4', label: 'Osteomuscular', icon: Stethoscope },
  // { id: 'page5', path: '/page5', label: 'Módulo 5', icon: Stethoscope },
  // { id: 'page6', path: '/page6', label: 'Módulo 6', icon: Stethoscope },
  // { id: 'page7', path: '/page7', label: 'Módulo 7', icon: Stethoscope }
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className={`bg-gray-800 text-white transition-all duration-300 flex flex-col ${isCollapsed ? 'w-20' : 'w-64'} h-screen sticky top-0`}>
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && <span className="text-xl truncate"></span>}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 hover:bg-gray-700 rounded">
          <Menu size={24} />
        </button>
      </div>

      {user && (
        <div className="p-4 border-b border-gray-700 flex flex-col items-center">
          {user.foto && (
            <img 
              src={user.foto} 
              alt={user.nombre} 
              className={`${isCollapsed ? 'w-10 h-10' : 'w-16 h-16'} rounded-full object-cover mb-2 transition-all`}
              onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
            />
          )}
          {!isCollapsed && (
            <div className="text-center overflow-hidden">
              <p className="text-sm break-words w-full">{user.nombre}</p>
              <p className="text-xs break-words w-full">{user.cargo}</p>
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 p-4 overflow-y-auto">
        {MODULES_CONFIG.map((item) => {
          const Icon = item.icon;
          // Validamos si el usuario tiene este id en sus módulos permitidos
          const hasAccess = user?.allowedModules?.includes(item.id);

          return hasAccess ? (
            // Si TIENE ACCESO, renderizamos el NavLink funcional
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 p-3 rounded transition-colors ${
                  isActive ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`
              }
            >
              <Icon size={24} className="min-w-6" />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          ) : (
            // Si NO TIENE ACCESO, renderizamos un div deshabilitado visualmente
            <div
              key={item.id}
              title="No tienes permisos para este módulo"
              className="flex items-center gap-4 p-3 rounded text-gray-500 bg-gray-800 opacity-60 cursor-not-allowed"
            >
              <Icon size={24} className="min-w-6" />
              {!isCollapsed && <span>{item.label} (En desarrollo)</span>}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button onClick={logout} className="flex items-center gap-4 w-full p-3 hover:bg-red-600 rounded transition-colors text-left">
          <LogOut size={24} className="min-w-6" />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
}