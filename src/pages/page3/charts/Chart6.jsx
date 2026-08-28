import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { CircleArrowDown, CircleArrowUp, CircleMinus } from 'lucide-react';

export default function Chart6({ data, labelAnio1, labelAnio2 }) {
  // Procesar datos para la tabla y gráficas
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return { list: [], totals: {} };

    // Ordenar por mayor cantidad de días en Año 2
    const sorted = [...data].sort((a, b) => b.diasAnio2 - a.diasAnio2);

    // Calcular Totales Generales para % de participación
    const totalAnio1 = sorted.reduce((acc, curr) => acc + curr.diasAnio1, 0);
    const totalAnio2 = sorted.reduce((acc, curr) => acc + curr.diasAnio2, 0);
    const totalVariacion = totalAnio2 - totalAnio1;
    const totalCambio = totalAnio1 > 0 ? ((totalVariacion / totalAnio1) * 100) : 0;

    const list = sorted.map(item => {
      const variacion = item.diasAnio2 - item.diasAnio1;
      const pctCambio = item.diasAnio1 > 0 ? ((variacion / item.diasAnio1) * 100) : null;
      const partAnio1 = totalAnio1 > 0 ? ((item.diasAnio1 / totalAnio1) * 100) : 0;
      const partAnio2 = totalAnio2 > 0 ? ((item.diasAnio2 / totalAnio2) * 100) : 0;

      let colorTendencia = 'text-gray-500';
      let iconoTendencia = <CircleMinus size={16} />;

      if (variacion > 0) {
        colorTendencia = 'text-red-500'; // Rojo porque más días perdidos es negativo
        iconoTendencia = <CircleArrowUp size={16} />;
      } else if (variacion < 0) {
        colorTendencia = 'text-green-500';
        iconoTendencia = <CircleArrowDown size={16} />;
      }

      return {
        ...item,
        variacion,
        pctCambio,
        partAnio1,
        partAnio2,
        colorTendencia,
        iconoTendencia
      };
    });

    return {
      list,
      totals: { totalAnio1, totalAnio2, totalVariacion, totalCambio }
    };
  }, [data]);

  const chartOptions = useMemo(() => {
    // Top 10 para la gráfica
    const reversedData = [...processedData.list].slice(0, 10).reverse();
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: [labelAnio1, labelAnio2], bottom: 0 },
      grid: { left: '0', right: '1%', bottom: '10%', top: '0', containLabel: true },
      xAxis: { type: 'value', name: '' },
      yAxis: {
        type: 'category',
        data: reversedData.map(d => d.tipo),
        axisLabel: { width: 150, overflow: 'truncate', fontSize: 11 }
      },
      series: [
        { name: labelAnio1, type: 'bar', data: reversedData.map(d => d.diasAnio1), itemStyle: { color: '#94a3b8' } },
        { name: labelAnio2, type: 'bar', data: reversedData.map(d => d.diasAnio2), itemStyle: { color: '#3b82f6' } }
      ]
    };
  }, [processedData, labelAnio1, labelAnio2]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex justify-center items-center h-64 text-gray-500">
        No hay datos registrados para los años seleccionados ({labelAnio1} - {labelAnio2}).
      </div>
    );
  }

  const formatNum = (num) => Number(num).toLocaleString('es-CO', { maximumFractionDigits: 1 });

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-center">
        Días Perdidos por Tipo de Incapacidad
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Gráfica */}
        <div className="w-full h-[400px]">
          <ReactECharts 
            option={chartOptions} 
            style={{ height: '100%', width: '100%' }} 
            opts={{ renderer: 'svg' }} 
          />
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b">
                <th className="p-2 font-semibold">Tipo de Incapacidad</th>
                <th className="p-2 font-semibold text-center">Días {labelAnio1}</th>
                <th className="p-2 font-semibold text-center">Días {labelAnio2}</th>
                <th className="p-2 font-semibold text-center">Variación</th>
                <th className="p-2 font-semibold text-center">% Cambio</th>
                <th className="p-2 font-semibold text-center">% Part. {labelAnio1}</th>
                <th className="p-2 font-semibold text-center">% Part. {labelAnio2}</th>
              </tr>
            </thead>
            <tbody>
              {processedData.list.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors border-b last:border-b-0">
                  <td className="p-2 text-gray-600 truncate max-w-[150px]" title={row.tipo}>{row.tipo}</td>
                  <td className="p-2 text-center text-gray-600">{formatNum(row.diasAnio1)}</td>
                  <td className="p-2 text-center text-gray-600">{formatNum(row.diasAnio2)}</td>
                  <td className={`p-2 font-bold ${row.colorTendencia}`}>
                    <div className="flex items-center justify-center gap-1">
                      {row.variacion > 0 ? '+' : ''}{formatNum(row.variacion)}
                      {row.iconoTendencia}
                    </div>
                  </td>
                  <td className="p-2 text-center text-gray-600">
                    {row.pctCambio !== null ? `${row.pctCambio > 0 ? '+' : ''}${formatNum(row.pctCambio)}%` : 'N/A'}
                  </td>
                  <td className="p-2 text-center text-gray-600">{formatNum(row.partAnio1)}%</td>
                  <td className="p-2 text-center text-gray-600">{formatNum(row.partAnio2)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold text-gray-800 border-t-2 border-gray-200">
                <td className="p-2">Totales</td>
                <td className="p-2 text-center">{formatNum(processedData.totals.totalAnio1)}</td>
                <td className="p-2 text-center">{formatNum(processedData.totals.totalAnio2)}</td>
                <td className={`p-2 text-center ${processedData.totals.totalVariacion > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {processedData.totals.totalVariacion > 0 ? '+' : ''}{formatNum(processedData.totals.totalVariacion)}
                </td>
                <td className="p-2 text-center">{formatNum(processedData.totals.totalCambio)}%</td>
                <td className="p-2 text-center">100%</td>
                <td className="p-2 text-center">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}