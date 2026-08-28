import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

export default function Chart7({ data, labelAnio1, labelAnio2 }) {
  const mesesLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // Procesar Totales Generales
  const totales = useMemo(() => {
    if (!data || data.length === 0) return { y1: Array(12).fill(0), y2: Array(12).fill(0), totalY1: 0, totalY2: 0 };
    
    let y1 = Array(12).fill(0);
    let y2 = Array(12).fill(0);
    let totalY1 = 0;
    let totalY2 = 0;

    data.forEach(item => {
      item.y1.forEach((val, i) => { y1[i] += val; totalY1 += val; });
      item.y2.forEach((val, i) => { y2[i] += val; totalY2 += val; });
    });

    return { y1, y2, totalY1, totalY2 };
  }, [data]);

  const chartOptions = useMemo(() => {
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: [labelAnio1, labelAnio2], bottom: 0 },
      grid: { left: '0', right: '1%', bottom: '10%', top: '0', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: mesesLabels },
      yAxis: { type: 'value', name: '' },
      series: [
        { name: labelAnio1, type: 'line', data: totales.y1, smooth: true, itemStyle: { color: '#94a3b8' }, areaStyle: { opacity: 0.1 } },
        { name: labelAnio2, type: 'line', data: totales.y2, smooth: true, itemStyle: { color: '#3b82f6' }, areaStyle: { opacity: 0.1 } }
      ]
    };
  }, [totales, labelAnio1, labelAnio2]);

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
        Comparativo Días Perdidos por Mes y Tipo
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Gráfica Lineal Global */}
        <div className="w-full h-[400px]">
          <ReactECharts 
            option={chartOptions} 
            style={{ height: '100%', width: '100%' }} 
            opts={{ renderer: 'svg' }} 
          />
        </div>

        {/* Tabla Minimalista */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-center text-sm border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b">
                <th className="p-2 font-semibold text-left">Tipo de Incapacidad</th>
                <th className="p-2 font-semibold">Año</th>
                {mesesLabels.map(m => <th key={m} className="p-2 font-semibold">{m}</th>)}
                <th className="p-2 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => {
                const totalY1 = row.y1.reduce((a, b) => a + b, 0);
                const totalY2 = row.y2.reduce((a, b) => a + b, 0);
                
                return (
                  <React.Fragment key={index}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td rowSpan={2} className="p-2 text-left font-medium align-middle text-gray-600 border-b border-r border-gray-200 truncate max-w-[150px]" title={row.tipo}>
                        {row.tipo}
                      </td>
                      <td className="p-2 text-gray-600">{labelAnio1}</td>
                      {row.y1.map((val, i) => <td key={i} className="p-2 text-gray-600">{formatNum(val)}</td>)}
                      <td className="p-2 text-gray-600 font-bold">{formatNum(totalY1)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors border-b">
                      <td className="p-2 text-gray-600">{labelAnio2}</td>
                      {row.y2.map((val, i) => <td key={i} className="p-2 text-gray-600">{formatNum(val)}</td>)}
                      <td className="p-2 text-gray-600 font-bold">{formatNum(totalY2)}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-bold text-gray-800 border-t-2 border-gray-200">
                <td rowSpan={2} className="p-2 text-left align-middle border-r border-gray-200">TOTAL GENERAL</td>
                <td className="p-2">{labelAnio1}</td>
                {totales.y1.map((val, i) => <td key={i} className="p-2">{formatNum(val)}</td>)}
                <td className="p-2">{formatNum(totales.totalY1)}</td>
              </tr>
              <tr className="font-bold text-gray-800">
                <td className="p-2">{labelAnio2}</td>
                {totales.y2.map((val, i) => <td key={i} className="p-2">{formatNum(val)}</td>)}
                <td className="p-2">{formatNum(totales.totalY2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}