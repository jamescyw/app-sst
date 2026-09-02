import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, LogOut, Stethoscope, ChevronDown, ChevronRight } from 'lucide-react';

const MODULES_CONFIG = [
  { id: 'page1', path: '/page1', label: 'Salud General', icon: Stethoscope },
  { id: 'page2', path: '/page2', label: 'Salud Mental', icon: Stethoscope },
  { id: 'page3', label: 'Ausentismos', icon: Stethoscope,
    subItems: [
      { id: 'colaboradores', path: '/page3/colaboradores', label: 'Colaboradores' },
      { id: 'diagnosticos', path: '/page3/diagnosticos', label: 'Diagnósticos' },
      { id: 'cargos', path: '/page3/cargos', label: 'Cargos' },
      { id: 'tipos', path: '/page3/tipos', label: 'Tipos' },
      { id: 'areas', path: '/page3/areas', label: 'Áreas' },
      { id: 'edades', path: '/page3/edades', label: 'Edades' },
      { id: 'antiguedad', path: '/page3/antiguedad', label: 'Antigüedad' },
      { id: 'dias-perdidos', path: '/page3/dias-perdidos', label: 'Días perdidos' },
      { id: 'dias-mes', path: '/page3/dias-mes', label: 'Días por mes' },
    ]
  },
  { id: 'page4', path: '/page4', label: 'Osteomuscular', icon: Stethoscope },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({ page3: true });
  const { user, logout } = useAuth();
  const location = useLocation();

  const toggleMenu = (id) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
    if (isCollapsed) setIsCollapsed(false);
  };

  return (
    <div className={`bg-[#503629] text-white transition-all duration-300 flex flex-col ${isCollapsed ? 'w-20' : 'w-64'} h-screen sticky top-0 shadow-xl`}>
      
      {/* Header del Sidebar */}
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        {!isCollapsed && <span className="text-xl font-bold tracking-wide truncate">SG-SST</span>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Perfil del Usuario */}
      {user && (
        <div className="p-4 flex flex-col items-center border-b border-white/10">
          {user.foto && (
            <img 
              src={user.foto} 
              alt={user.nombre} 
              className={`${isCollapsed ? 'w-10 h-10' : 'w-16 h-16'} rounded-full object-cover mb-3 transition-all`}
              onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
            />
          )}
          {!isCollapsed && (
            <div className="text-center overflow-hidden w-full">
              <p className="text-sm font-semibold truncate w-full">{user.nombre}</p>
              <p className="text-xs text-white/70 truncate w-full mt-1">{user.cargo}</p>
            </div>
          )}
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
        {MODULES_CONFIG.map((item) => {
          const Icon = item.icon;
          const hasAccess = user?.allowedModules?.includes(item.id);
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isOpen = openMenus[item.id];
          
          // Verificamos si alguna ruta hija coincide con la ruta actual para iluminar el padre de blanco
          const isParentActive = hasSubItems && item.subItems.some(sub => location.pathname.includes(sub.path));

          return hasAccess ? (
            <div key={item.id} className="flex flex-col gap-1">
              {hasSubItems ? (
                // Botón Desplegable
                <button
                  onClick={() => toggleMenu(item.id)}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                    isParentActive || isOpen 
                      ? 'bg-white text-[#503629] font-bold shadow-md' // Mismo estilo Activo
                      : 'text-white hover:bg-white/10' // Mismo estilo Inactivo
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon size={22} className="min-w-[22px]" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsed && (
                    isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />
                  )}
                </button>
              ) : (
                // NavLink Original para módulos sin subítems
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-4 p-3 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-white text-[#503629] font-bold shadow-md' 
                        : 'text-white hover:bg-white/10' 
                    }`
                  }
                >
                  <Icon size={22} className="min-w-[22px]" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              )}

              {/* Menú de Subítems (Visible solo si está abierto y no colapsado) */}
              {hasSubItems && isOpen && !isCollapsed && (
                <div className="ml-10 mt-1 flex flex-col gap-1.5">
                  {item.subItems.map((subItem) => (
                    <NavLink
                      key={subItem.id}
                      to={subItem.path}
                      className={({ isActive }) =>
                        `p-1 rounded-lg transition-all duration-200 text-md ${
                          isActive
                            ? 'bg-white/20 text-white font-bold' // Estilo activo del subítem parecido a tu imagen
                            : 'text-white/80 hover:bg-white/10'
                        }`
                      }
                    >
                      {subItem.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              key={item.id}
              title="No tienes permisos para este módulo"
              className="flex items-center gap-4 p-3 rounded-lg text-white/40 bg-black/10 cursor-not-allowed"
            >
              <Icon size={22} className="min-w-[22px]" />
              {!isCollapsed && <span className="truncate">{item.label} (Bloqueado)</span>}
            </div>
          );
        })}
      </nav>

      {/* Footer / Cerrar Sesión */}
      <div className="p-4 border-t border-white/10">
        <button 
          onClick={logout} 
          className="flex items-center gap-4 w-full p-3 hover:bg-red-500/90 hover:text-white rounded-lg transition-colors text-left text-white/90"
        >
          <LogOut size={22} className="min-w-[22px]" />
          {!isCollapsed && <span className="font-medium">Cerrar Sesión</span>}
        </button>
      </div>
      
    </div>
  );
}