import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

export default function Chart7({ data, labelAnio1, labelAnio2 }) {
  const mesesLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

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
      legend: { 
        data: [labelAnio1, labelAnio2], 
        bottom: 0, 
        icon: 'circle', 
        itemGap: 20, 
        textStyle: { color: '#4b5563' } 
      },
      grid: { left: '3%', right: '3%', bottom: '12%', top: '4%', containLabel: true },
      xAxis: { 
        type: 'category', 
        boundaryGap: false, 
        data: mesesLabels,
        axisLine: { lineStyle: { color: '#d1d5db' } },
        axisTick: { show: false },
        axisLabel: { color: '#374151' }
      },
      yAxis: { 
        type: 'value', 
        name: '',
        splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } }
      },
      series: [
        { 
          name: labelAnio1, 
          type: 'line', 
          data: totales.y1, 
          smooth: true, 
          itemStyle: { color: '#A88C7D' }, 
          areaStyle: { opacity: 0.1, color: '#A88C7D' },
          lineStyle: { width: 3 }
        },
        { 
          name: labelAnio2, 
          type: 'line', 
          data: totales.y2, 
          smooth: true, 
          itemStyle: { color: '#503629' }, 
          areaStyle: { opacity: 0.1, color: '#503629' },
          lineStyle: { width: 3 }
        }
      ]
    };
  }, [totales, labelAnio1, labelAnio2]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-center items-center h-64 text-gray-500">
        No hay datos registrados para los años seleccionados ({labelAnio1} - {labelAnio2}).
      </div>
    );
  }

  const formatNum = (num) => Number(num).toLocaleString('es-CO', { maximumFractionDigits: 1 });

  return (
    <div className="p-6 rounded-xl border border-[#503629] flex flex-col gap-8">
      <h2 className="text-xl font-bold text-center text-[#503629]">
        Comparativo Días Perdidos por Mes y Tipo
      </h2>
      
      <div className="w-full h-[450px]">
        <ReactECharts option={chartOptions} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
      </div>

      <div className="overflow-x-auto w-full rounded-lg border border-[#503629]">
        <table className="w-full text-center text-sm border-collapse whitespace-nowrap">
          <thead className="bg-[#f7f5f4] text-[#503629] border-b border-[#503629]">
            <tr>
              <th className="p-3 font-semibold text-left">Tipo de Incapacidad</th>
              <th className="p-3 font-semibold">Año</th>
              {mesesLabels.map(m => <th key={m} className="p-3 font-semibold">{m}</th>)}
              <th className="p-3 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, index) => {
              const totalY1 = row.y1.reduce((a, b) => a + b, 0);
              const totalY2 = row.y2.reduce((a, b) => a + b, 0);
              
              return (
                <React.Fragment key={index}>
                  <tr className="hover:bg-[#faf9f8] transition-colors">
                    <td rowSpan={2} className="p-3 text-left font-medium align-middle text-gray-700 border-b border-r border-[#503629] truncate max-w-[150px]" title={row.tipo}>
                      {row.tipo}
                    </td>
                    <td className="p-3 text-gray-600">{labelAnio1}</td>
                    {row.y1.map((val, i) => <td key={i} className="p-3 text-gray-600">{formatNum(val)}</td>)}
                    <td className="p-3 text-gray-600 font-bold">{formatNum(totalY1)}</td>
                  </tr>
                  <tr className="hover:bg-[#faf9f8] transition-colors border-b">
                    <td className="p-3 text-gray-600 font-semibold">{labelAnio2}</td>
                    {row.y2.map((val, i) => <td key={i} className="p-3 text-[#503629] font-semibold">{formatNum(val)}</td>)}
                    <td className="p-3 text-[#503629] font-bold">{formatNum(totalY2)}</td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot className="bg-[#f7f5f4] text-[#503629]">
            <tr className="font-bold border-t-2 border-[#503629]">
              <td rowSpan={2} className="p-3 text-left align-middle border-r border-[#503629]">TOTAL GENERAL</td>
              <td className="p-3">{labelAnio1}</td>
              {totales.y1.map((val, i) => <td key={i} className="p-3">{formatNum(val)}</td>)}
              <td className="p-3">{formatNum(totales.totalY1)}</td>
            </tr>
            <tr className="font-bold">
              <td className="p-3">{labelAnio2}</td>
              {totales.y2.map((val, i) => <td key={i} className="p-3">{formatNum(val)}</td>)}
              <td className="p-3">{formatNum(totales.totalY2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}