import { useState, useEffect, useMemo } from 'react';
import Chart0 from './charts/Chart0'; // Diagnósticos
import Chart1 from './charts/Chart1'; // Cargos
import Chart2 from './charts/Chart2'; // Tipos
import Chart3 from './charts/Chart3'; // Áreas
import Chart4 from './charts/Chart4'; // Edades
import Chart5 from './charts/Chart5'; // Antigüedad

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

  // ==========================================
  // 2. PROCESAMIENTO DE DATOS
  // ==========================================
  
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

  // Chart0: Diagnósticos
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
              const nombre = `${cod} - ${desc}`;
              if (!conteo[nombre]) conteo[nombre] = { diagnostico: nombre, casosAnio1: 0, casosAnio2: 0 };
              if (year === anio1) conteo[nombre].casosAnio1 += 1;
              if (year === anio2) conteo[nombre].casosAnio2 += 1;
            }
          }
        });
      }
    });
    return Object.values(conteo);
  }, [rawData, anio1, anio2]);

  // Chart1: Cargos
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
              if (!conteo[nombreCargo]) conteo[nombreCargo] = { cargo: nombreCargo, casosAnio1: 0, casosAnio2: 0 };
              if (year === anio1) conteo[nombreCargo].casosAnio1 += 1;
              if (year === anio2) conteo[nombreCargo].casosAnio2 += 1;
            }
          }
        });
      }
    });
    return Object.values(conteo);
  }, [rawData, anio1, anio2]);

  // Chart2: Tipos
  const datosTipos = useMemo(() => {
    if (!rawData.length || !anio1 || !anio2) return [];
    const conteo = {};
    rawData.forEach(emp => {
      if (emp.licencias && emp.licencias.length > 0) {
        emp.licencias.forEach(lic => {
          if (lic.start_date && lic.licence_type) {
            const year = lic.start_date.substring(0, 4);
            if (year === anio1 || year === anio2) {
              const tipo = lic.licence_type;
              if (!conteo[tipo]) conteo[tipo] = { tipo: tipo, casosAnio1: 0, casosAnio2: 0 };
              if (year === anio1) conteo[tipo].casosAnio1 += 1;
              if (year === anio2) conteo[tipo].casosAnio2 += 1;
            }
          }
        });
      }
    });
    return Object.values(conteo);
  }, [rawData, anio1, anio2]);

  // Chart3: Áreas
  const datosAreas = useMemo(() => {
    if (!rawData.length || !anio1 || !anio2) return [];
    const conteo = {};
    rawData.forEach(emp => {
      const nombreArea = emp.area || 'Sin Área';
      if (emp.licencias && emp.licencias.length > 0) {
        emp.licencias.forEach(lic => {
          if (lic.start_date) {
            const year = lic.start_date.substring(0, 4);
            if (year === anio1 || year === anio2) {
              if (!conteo[nombreArea]) conteo[nombreArea] = { area: nombreArea, casosAnio1: 0, casosAnio2: 0 };
              if (year === anio1) conteo[nombreArea].casosAnio1 += 1;
              if (year === anio2) conteo[nombreArea].casosAnio2 += 1;
            }
          }
        });
      }
    });
    return Object.values(conteo);
  }, [rawData, anio1, anio2]);

  // Chart4: Rangos de Edad
  const datosEdades = useMemo(() => {
    if (!rawData.length || !anio1 || !anio2) return [];
    const conteo = {};
    
    rawData.forEach(emp => {
      // Calcular rango de edad
      let rangoEdad = 'No registrada';
      if (emp.birthday) {
        const edad = new Date().getFullYear() - new Date(emp.birthday).getFullYear();
        if (edad < 20) rangoEdad = 'Menor de 20 años';
        else if (edad <= 29) rangoEdad = '20 a 29 años';
        else if (edad <= 39) rangoEdad = '30 a 39 años';
        else if (edad <= 49) rangoEdad = '40 a 49 años';
        else if (edad <= 59) rangoEdad = '50 a 59 años';
        else rangoEdad = '60 años o más';
      }

      if (emp.licencias && emp.licencias.length > 0) {
        emp.licencias.forEach(lic => {
          if (lic.start_date) {
            const year = lic.start_date.substring(0, 4);
            if (year === anio1 || year === anio2) {
              if (!conteo[rangoEdad]) conteo[rangoEdad] = { rangoEdad, casosAnio1: 0, casosAnio2: 0 };
              if (year === anio1) conteo[rangoEdad].casosAnio1 += 1;
              if (year === anio2) conteo[rangoEdad].casosAnio2 += 1;
            }
          }
        });
      }
    });
    return Object.values(conteo);
  }, [rawData, anio1, anio2]);

  // Chart5: Rangos de Antigüedad
  const datosAntiguedad = useMemo(() => {
    if (!rawData.length || !anio1 || !anio2) return [];
    const conteo = {};

    rawData.forEach(emp => {
      // Calcular rango de antigüedad
      let rangoAntiguedad = 'No registrada';
      if (emp.active_since) {
        const anios = new Date().getFullYear() - new Date(emp.active_since).getFullYear();
        if (anios < 1) rangoAntiguedad = 'Menos de 1 año';
        else if (anios <= 3) rangoAntiguedad = '1 a 3 años';
        else if (anios <= 6) rangoAntiguedad = '4 a 6 años';
        else if (anios <= 10) rangoAntiguedad = '7 a 10 años';
        else rangoAntiguedad = 'Más de 10 años';
      }

      if (emp.licencias && emp.licencias.length > 0) {
        emp.licencias.forEach(lic => {
          if (lic.start_date) {
            const year = lic.start_date.substring(0, 4);
            if (year === anio1 || year === anio2) {
              if (!conteo[rangoAntiguedad]) conteo[rangoAntiguedad] = { rangoAntiguedad, casosAnio1: 0, casosAnio2: 0 };
              if (year === anio1) conteo[rangoAntiguedad].casosAnio1 += 1;
              if (year === anio2) conteo[rangoAntiguedad].casosAnio2 += 1;
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
    return <div className="flex justify-center items-center h-screen text-xl">Cargando...</div>;
  }

  return (
    <div className="space-y-6 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Ausentismos</h1>
        <div className="flex space-x-4 text-center">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 font-semibold mb-1">Año 1</label>
            <select className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={anio1} onChange={(e) => setAnio1(e.target.value)}>
              {availableYears.map(year => <option key={`a1-${year}`} value={year}>{year}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 font-semibold mb-1">Año 2</label>
            <select className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={anio2} onChange={(e) => setAnio2(e.target.value)}>
              {availableYears.map(year => <option key={`a2-${year}`} value={year}>{year}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border-1 border-yellow-500 flex flex-col justify-center">
          <span className="text-sm tracking-wider">Total Empleados</span>
          <span className="text-3xl">{totalEmpleados}</span>
        </div>
        <div className="p-4 rounded-lg border-1 border-blue-500 flex flex-col justify-center">
          <span className="text-sm tracking-wider">Total Ausentismos</span>
          <span className="text-3xl">{totalLicencias}</span>
        </div>
        <div className="p-4 rounded-lg border-1 border-red-500 flex flex-col justify-center">
          <span className="text-sm tracking-wider">Total</span>
          <span className="text-3xl">KPI</span>
        </div>
        <div className="p-4 rounded-lg border-1 border-green-500 flex flex-col justify-center">
          <span className="text-sm tracking-wider">Total</span>
          <span className="text-3xl">KPI</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Aquí está la magia: Hacemos que Chart 0 tome las 2 columnas */}
        <div className="col-span-1 xl:col-span-2">
          <Chart0 data={datosDiagnosticos} labelAnio1={anio1} labelAnio2={anio2} />
          <Chart1 data={datosCargos} labelAnio1={anio1} labelAnio2={anio2} />
        <Chart2 data={datosTipos} labelAnio1={anio1} labelAnio2={anio2} />
        <Chart3 data={datosAreas} labelAnio1={anio1} labelAnio2={anio2} />
        <Chart4 data={datosEdades} labelAnio1={anio1} labelAnio2={anio2} />
        <Chart5 data={datosAntiguedad} labelAnio1={anio1} labelAnio2={anio2} />
        </div>
        
        {/* El resto de gráficas siguen su comportamiento normal */}
        
      </div>

      <div className="p-6 rounded-lg border-1 border-black-100 space-y-4">
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
                <th className="p-3 text-center">Colaborador</th>
                <th className="p-3 text-center">Cargo y Área</th>
                <th className="p-3 text-center">Total Licencias</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? currentData.map((row) => {
                const cantidadLicencias = row.licencias ? row.licencias.length : 0;
                return (
                  <tr key={row.employee_id} className="hover:bg-gray-50 border-b transition-colors text-sm">
                    <td className="p-3 font-medium text-gray-900">
                      {row.picture_url ? (
                        <img src={row.picture_url} alt={row.full_name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                          {row.full_name.charAt(0)}
                        </div>
                      )}
                      {row.full_name} <br />
                      {row.document_number}
                    </td>
                    <td className="p-3 text-gray-600">
                      {row.cargo} <br />
                      {row.area}
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold">{cantidadLicencias}</span>
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => openModal(row)}
                        disabled={cantidadLicencias === 0}
                        className={`text-sm px-3 py-1 rounded transition-colors ${cantidadLicencias > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="7" className="p-6 text-center text-gray-500">No se encontraron colaboradores.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-sm text-gray-600">Mostrando página {currentPage} de {totalPages || 1}</span>
          <div className="space-x-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 border bg-white rounded text-sm disabled:opacity-50 hover:bg-gray-50">Anterior</button>
            <button disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 border bg-white rounded text-sm disabled:opacity-50 hover:bg-gray-50">Siguiente</button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <div className="flex items-center space-x-3">
                {selectedEmployee.picture_url && <img src={selectedEmployee.picture_url} alt="profile" className="w-12 h-12 rounded-full object-cover" />}
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
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold mr-2">{lic.codigo_incapacidad_colombia}</span>
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