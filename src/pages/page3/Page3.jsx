import { useState, useEffect, useMemo } from 'react';
import Chart0 from './charts/Chart0'; // Diagnósticos
import Chart1 from './charts/Chart1'; // Cargos
import Chart2 from './charts/Chart2'; // Tipos
import Chart3 from './charts/Chart3'; // Áreas
import Chart4 from './charts/Chart4'; // Edades
import Chart5 from './charts/Chart5'; // Antigüedad
import Chart6 from './charts/Chart6'; // Días Perdidos por Tipo
import Chart7 from './charts/Chart7'; // Días Perdidos por Mes y Tipo

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

  // Chart6: Días Perdidos por Tipo
  const datosDiasPerdidos = useMemo(() => {
    if (!rawData.length || !anio1 || !anio2) return [];
    const conteo = {};
    rawData.forEach(emp => {
      if (emp.licencias && emp.licencias.length > 0) {
        emp.licencias.forEach(lic => {
          if (lic.start_date && lic.licence_type) {
            const year = lic.start_date.substring(0, 4);
            if (year === anio1 || year === anio2) {
              const tipo = lic.licence_type;
              const dias = parseFloat(lic.days_count) || 0;
              if (!conteo[tipo]) conteo[tipo] = { tipo, diasAnio1: 0, diasAnio2: 0 };
              
              if (year === anio1) conteo[tipo].diasAnio1 += dias;
              if (year === anio2) conteo[tipo].diasAnio2 += dias;
            }
          }
        });
      }
    });
    return Object.values(conteo);
  }, [rawData, anio1, anio2]);

  // Chart7: Días Perdidos por Mes y Tipo
  const datosDiasMeses = useMemo(() => {
    if (!rawData.length || !anio1 || !anio2) return [];
    const conteo = {};
    rawData.forEach(emp => {
      if (emp.licencias && emp.licencias.length > 0) {
        emp.licencias.forEach(lic => {
          if (lic.start_date && lic.licence_type) {
            const year = lic.start_date.substring(0, 4);
            const mesIndex = parseInt(lic.start_date.substring(5, 7), 10) - 1; // 0 = Ene, 11 = Dic

            if (year === anio1 || year === anio2) {
              const tipo = lic.licence_type;
              const dias = parseFloat(lic.days_count) || 0;
              if (!conteo[tipo]) {
                conteo[tipo] = { tipo, y1: Array(12).fill(0), y2: Array(12).fill(0) };
              }
              
              if (year === anio1) conteo[tipo].y1[mesIndex] += dias;
              if (year === anio2) conteo[tipo].y2[mesIndex] += dias;
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
        <div className="p-4 rounded-lg border-1 border-gray-300 flex flex-col justify-center">
          <span className="text-sm tracking-wider">Colaboradores</span>
          <span className="text-3xl">{totalEmpleados}</span>
        </div>
        <div className="p-4 rounded-lg border-1 border-gray-300 flex flex-col justify-center">
          <span className="text-sm tracking-wider">Ausentismos</span>
          <span className="text-3xl">{totalLicencias}</span>
        </div>
        <div className="p-4 rounded-lg border-1 border-gray-300 flex flex-col justify-center">
          <span className="text-sm tracking-wider">Kpi3</span>
          <span className="text-3xl">KPI3</span>
        </div>
        <div className="p-4 rounded-lg border-1 border-gray-300 flex flex-col justify-center">
          <span className="text-sm tracking-wider">Kpi4</span>
          <span className="text-3xl">KPI4</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="col-span-1 xl:col-span-2">
          <Chart0 data={datosDiagnosticos} labelAnio1={anio1} labelAnio2={anio2} />
          <Chart1 data={datosCargos} labelAnio1={anio1} labelAnio2={anio2} />
          <Chart2 data={datosTipos} labelAnio1={anio1} labelAnio2={anio2} />
          <Chart6 data={datosDiasPerdidos} labelAnio1={anio1} labelAnio2={anio2} />
          <Chart7 data={datosDiasMeses} labelAnio1={anio1} labelAnio2={anio2} />
          <Chart3 data={datosAreas} labelAnio1={anio1} labelAnio2={anio2} />
          <Chart4 data={datosEdades} labelAnio1={anio1} labelAnio2={anio2} />
          <Chart5 data={datosAntiguedad} labelAnio1={anio1} labelAnio2={anio2} />
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Colaboradores</h2>
          <input 
            type="text" 
            placeholder="Buscar por nombre o documento..." 
            className="p-2 text-sm border border-gray-200 rounded-md w-full md:w-80 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr>
                <th className="p-2 font-semibold text-gray-700">Colaborador</th>
                <th className="p-2 font-semibold text-gray-700 text-center">Cargo y Área</th>
                <th className="p-2 font-semibold text-gray-700 text-center">Total Licencias</th>
                <th className="p-2 font-semibold text-gray-700 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? currentData.map((row) => {
                const cantidadLicencias = row.licencias ? row.licencias.length : 0;
                return (
                  <tr key={row.employee_id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        {row.picture_url ? (
                          <img src={row.picture_url} alt={row.full_name} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs border border-gray-200">
                            {row.full_name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-800">{row.full_name}</div>
                          <div className="text-xs text-gray-500">{row.document_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="text-gray-700 font-medium">{row.cargo}</div>
                      <div className="text-gray-500 text-xs">{row.area}</div>
                    </td>
                    <td className="p-2 text-center">
                      <span className="bg-red-50 text-red-600 text-xs px-2.5 py-1 rounded-full font-semibold">
                        {cantidadLicencias}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <button 
                        onClick={() => openModal(row)}
                        disabled={cantidadLicencias === 0}
                        className={`text-xs px-3 py-1.5 rounded-md transition-colors font-medium ${
                          cantidadLicencias > 0 
                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                    No se encontraron colaboradores.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-sm text-gray-500">Mostrando página {currentPage} de {totalPages || 1}</span>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 bg-white rounded-md text-sm text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors">
              Anterior
            </button>
            <button disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 bg-white rounded-md text-sm text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors">
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-11/12 max-w-5xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <div className="flex items-center space-x-4">
                {selectedEmployee.picture_url ? (
                  <img src={selectedEmployee.picture_url} alt="profile" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg border border-gray-200">
                    {selectedEmployee.full_name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{selectedEmployee.full_name}</h3>
                  <p className="text-sm text-gray-500">{selectedEmployee.cargo}</p>
                  <p className="text-sm text-gray-500">{selectedEmployee.area}</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors">
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 overflow-y-auto">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 font-semibold text-gray-700">Inicio</th>
                      <th className="p-2 font-semibold text-gray-700">Fin</th>
                      <th className="p-2 font-semibold text-gray-700 text-center">Días</th>
                      <th className="p-2 font-semibold text-gray-700">Tipo de Incapacidad</th>
                      <th className="p-2 font-semibold text-gray-700">Diagnóstico (CIE-10)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmployee.licencias.map((lic) => (
                      <tr key={lic.buk_licence_id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                        <td className="p-2 text-gray-600 whitespace-nowrap">{lic.start_date}</td>
                        <td className="p-2 text-gray-600 whitespace-nowrap">{lic.end_date}</td>
                        <td className="p-2 text-center font-medium text-gray-800">{lic.days_count}</td>
                        <td className="p-2">
                          <span className="block text-gray-700 font-medium">{lic.licence_type}</span>
                          <span className="text-xs text-gray-500">{lic.licence_format}</span>
                        </td>
                        <td className="p-2">
                          <div className="flex items-start gap-2">
                            <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-md font-semibold whitespace-nowrap">
                              {lic.codigo_incapacidad_colombia}
                            </span>
                            <span className="text-gray-600 text-sm line-clamp-2" title={lic.descripcion_codigo_incapacidad_colombia}>
                              {lic.descripcion_codigo_incapacidad_colombia}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button 
                onClick={closeModal} 
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}