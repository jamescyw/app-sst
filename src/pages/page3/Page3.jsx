import { useState, useEffect, useMemo } from 'react';
import Chart0 from './charts/Chart0';
import Chart1 from './charts/Chart1'; // Importamos la nueva gráfica

export default function PageUnificada() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados KPIs y Paginación
  const [totalEmpleados, setTotalEmpleados] = useState(0);
  const [totalLicencias, setTotalLicencias] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados Gráficas y Años
  const [availableYears, setAvailableYears] = useState([]);
  const [anio1, setAnio1] = useState('');
  const [anio2, setAnio2] = useState('');

  // 1. CARGA DE DATOS
  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const url = 'https://apialohav2.crepesywaffles.com/buk-licences/analytics';
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        const result = await response.json();
        
        if (result.ok && result.data) {
          const empleadosData = result.data;
          
          setRawData(empleadosData);
          setTotalEmpleados(result.total_empleados || 0);
          setTotalLicencias(result.total_licencias || 0);
          
          const yearsSet = new Set();
          empleadosData.forEach(emp => {
            if (emp.licencias && emp.licencias.length > 0) {
              emp.licencias.forEach(lic => {
                if (lic.start_date) {
                  const year = lic.start_date.substring(0, 4);
                  yearsSet.add(year);
                }
              });
            }
          });
          
          const yearsArray = Array.from(yearsSet).sort((a, b) => b - a);
          setAvailableYears(yearsArray);
          
          if (yearsArray.length >= 2) {
            setAnio2(yearsArray[0].toString());
            setAnio1(yearsArray[1].toString());
          } else if (yearsArray.length === 1) {
            setAnio1(yearsArray[0].toString());
            setAnio2(yearsArray[0].toString());
          }
        }
      } catch (error) {
        console.error("Error cargando analíticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, []);

  // 2. PROCESAMIENTO DE DATOS
  
  // A. Tabla de empleados
  const filteredData = useMemo(() => {
    return rawData.filter(emp => 
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(emp.document_number).includes(searchTerm)
    );
  }, [rawData, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  // B. Gráfica de Diagnósticos (Chart0)
  const datosDiagnosticos = useMemo(() => {
    if (!rawData.length || !anio1 || !anio2) return [];
    const conteo = {};

    rawData.forEach(emp => {
      if (emp.licencias && emp.licencias.length > 0) {
        emp.licencias.forEach(lic => {
          if (lic.start_date && lic.codigo_incapacidad_colombia) {
            const year = lic.start_date.substring(0, 4);
            
            if (year === anio1 || year === anio2) {
              const cod = lic.codigo_incapacidad_colombia;
              const desc = lic.descripcion_codigo_incapacidad_colombia || 'Sin descripción';
              const nombreDiagnostico = `${cod} - ${desc}`;

              if (!conteo[nombreDiagnostico]) {
                conteo[nombreDiagnostico] = { diagnostico: nombreDiagnostico, casosAnio1: 0, casosAnio2: 0 };
              }

              if (year === anio1) conteo[nombreDiagnostico].casosAnio1 += 1;
              if (year === anio2) conteo[nombreDiagnostico].casosAnio2 += 1;
            }
          }
        });
      }
    });

    return Object.values(conteo);
  }, [rawData, anio1, anio2]);

  // C. Gráfica de Cargos (Chart1)
  const datosCargos = useMemo(() => {
    if (!rawData.length || !anio1 || !anio2) return [];
    const conteo = {};

    rawData.forEach(emp => {
      const nombreCargo = emp.cargo || 'Sin Cargo';

      if (emp.licencias && emp.licencias.length > 0) {
        emp.licencias.forEach(lic => {
          if (lic.start_date) {
            const year = lic.start_date.substring(0, 4);
            
            if (year === anio1 || year === anio2) {
              if (!conteo[nombreCargo]) {
                conteo[nombreCargo] = { cargo: nombreCargo, casosAnio1: 0, casosAnio2: 0 };
              }

              if (year === anio1) conteo[nombreCargo].casosAnio1 += 1;
              if (year === anio2) conteo[nombreCargo].casosAnio2 += 1;
            }
          }
        });
      }
    });

    return Object.values(conteo);
  }, [rawData, anio1, anio2]);

  // Funciones Modal
  const openModal = (employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-xl">Cargando plataforma unificada...</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      
      {/* TÍTULO Y SELECTORES */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800">Panel General de Ausentismos</h1>
        
        <div className="flex space-x-4">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 font-semibold mb-1">Año 1 (Base)</label>
            <select 
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={anio1} 
              onChange={(e) => setAnio1(e.target.value)}
            >
              {availableYears.map(year => (
                <option key={`a1-${year}`} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 font-semibold mb-1">Año 2 (Comparación)</label>
            <select 
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={anio2} 
              onChange={(e) => setAnio2(e.target.value)}
            >
              {availableYears.map(year => (
                <option key={`a2-${year}`} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 flex flex-col justify-center">
          <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Empleados</span>
          <span className="text-3xl font-bold text-gray-800">{totalEmpleados}</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500 flex flex-col justify-center">
          <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Ausentismos</span>
          <span className="text-3xl font-bold text-gray-800">{totalLicencias}</span>
        </div>
      </div>

      {/* GRÁFICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart0 
          data={datosDiagnosticos} 
          labelAnio1={anio1} 
          labelAnio2={anio2} 
        />
        <Chart1 
          data={datosCargos} 
          labelAnio1={anio1} 
          labelAnio2={anio2} 
        />
      </div>

      {/* TABLA DE EMPLEADOS */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Directorio de Colaboradores</h2>
        
        <div>
          <input 
            type="text" 
            placeholder="Buscar por nombre o documento..." 
            className="p-2 border border-gray-300 rounded w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="overflow-x-auto rounded-lg">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-gray-100 text-gray-700 border-b">
                <th className="p-3">Perfil</th>
                <th className="p-3">Colaborador</th>
                <th className="p-3">Documento</th>
                <th className="p-3">Cargo</th>
                <th className="p-3">Área</th>
                <th className="p-3 text-center">Total Licencias</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? currentData.map((row) => {
                const cantidadLicencias = row.licencias ? row.licencias.length : 0;
                return (
                  <tr key={row.employee_id} className="hover:bg-gray-50 border-b transition-colors text-sm">
                    <td className="p-3">
                      {row.picture_url ? (
                        <img src={row.picture_url} alt={row.full_name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                          {row.full_name.charAt(0)}
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-medium text-gray-900">{row.full_name}</td>
                    <td className="p-3 text-gray-600">{row.document_number}</td>
                    <td className="p-3 text-gray-600">{row.cargo}</td>
                    <td className="p-3 text-gray-600">{row.area}</td>
                    <td className="p-3 text-center">
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold">
                        {cantidadLicencias}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => openModal(row)}
                        disabled={cantidadLicencias === 0}
                        className={`text-sm px-3 py-1 rounded transition-colors ${
                          cantidadLicencias > 0 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-gray-500">No se encontraron colaboradores.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-sm text-gray-600">
            Total empleados: {filteredData.length} | Mostrando página {currentPage} de {totalPages || 1}
          </span>
          <div className="space-x-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="px-4 py-2 border bg-white rounded text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Anterior
            </button>
            <button 
              disabled={currentPage >= totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-4 py-2 border bg-white rounded text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* MODAL (Se mantiene igual) */}
      {isModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <div className="flex items-center space-x-3">
                {selectedEmployee.picture_url && (
                  <img src={selectedEmployee.picture_url} alt="profile" className="w-12 h-12 rounded-full object-cover" />
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Ausentismos: {selectedEmployee.full_name}</h3>
                  <p className="text-sm text-gray-500">{selectedEmployee.cargo} - {selectedEmployee.area}</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 font-bold text-2xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="p-3 border-b text-sm">Inicio</th>
                    <th className="p-3 border-b text-sm">Fin</th>
                    <th className="p-3 border-b text-sm">Días</th>
                    <th className="p-3 border-b text-sm">Tipo de Incapacidad</th>
                    <th className="p-3 border-b text-sm">Diagnóstico (CIE-10)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEmployee.licencias.map((lic) => (
                    <tr key={lic.buk_licence_id} className="hover:bg-gray-50 border-b text-sm">
                      <td className="p-3 text-gray-800">{lic.start_date}</td>
                      <td className="p-3 text-gray-800">{lic.end_date}</td>
                      <td className="p-3 text-center font-semibold">{lic.days_count}</td>
                      <td className="p-3 text-gray-600">
                        <span className="block font-medium">{lic.licence_type}</span>
                        <span className="text-xs text-gray-400">({lic.licence_format})</span>
                      </td>
                      <td className="p-3 text-gray-600">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold mr-2">
                          {lic.codigo_incapacidad_colombia}
                        </span>
                        <span className="text-xs">{lic.descripcion_codigo_incapacidad_colombia}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}