import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { CircleArrowDown, CircleArrowUp, CircleMinus } from 'lucide-react';

export default function Chart6({ data, labelAnio1, labelAnio2 }) {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return { list: [], totals: {} };

    const sorted = [...data].sort((a, b) => b.diasAnio2 - a.diasAnio2);
    const totalAnio1 = sorted.reduce((acc, curr) => acc + curr.diasAnio1, 0);
    const totalAnio2 = sorted.reduce((acc, curr) => acc + curr.diasAnio2, 0);
    const totalVariacion = totalAnio2 - totalAnio1;
    const totalCambio = totalAnio1 > 0 ? ((totalVariacion / totalAnio1) * 100) : 0;

    const list = sorted.map(item => {
      const variacion = item.diasAnio2 - item.diasAnio1;
      const pctCambio = item.diasAnio1 > 0 ? ((variacion / item.diasAnio1) * 100) : null;
      const partAnio1 = totalAnio1 > 0 ? ((item.diasAnio1 / totalAnio1) * 100) : 0;
      const partAnio2 = totalAnio2 > 0 ? ((item.diasAnio2 / totalAnio2) * 100) : 0;

      let colorTendencia = 'text-gray-400';
      let iconoTendencia = <CircleMinus size={16} />;

      if (variacion > 0) {
        colorTendencia = 'text-red-500'; 
        iconoTendencia = <CircleArrowUp size={16} />;
      } else if (variacion < 0) {
        colorTendencia = 'text-green-500';
        iconoTendencia = <CircleArrowDown size={16} />;
      }

      return { ...item, variacion, pctCambio, partAnio1, partAnio2, colorTendencia, iconoTendencia };
    });

    return { list, totals: { totalAnio1, totalAnio2, totalVariacion, totalCambio } };
  }, [data]);

  const chartOptions = useMemo(() => {
    const reversedData = [...processedData.list].slice(0, 10).reverse();
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: [labelAnio1, labelAnio2], bottom: 0, icon: 'circle', itemGap: 20, textStyle: { color: '#4b5563' } },
      grid: { left: 250, right: '4%', bottom: '12%', top: '2%', containLabel: false },
      xAxis: { type: 'value', name: '', splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } } },
      yAxis: {
        type: 'category',
        data: reversedData.map(d => d.tipo),
        axisLabel: {
          width: 230, overflow: 'truncate', fontSize: 11, align: 'left', margin: 240, color: '#374151', 
        },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#d1d5db' } }
      },
      series: [
        { name: labelAnio1, type: 'bar', data: reversedData.map(d => d.diasAnio1), itemStyle: { color: '#A88C7D', borderRadius: [0, 4, 4, 0] }, barGap: '10%' },
        { name: labelAnio2, type: 'bar', data: reversedData.map(d => d.diasAnio2), itemStyle: { color: '#503629', borderRadius: [0, 4, 4, 0] } }
      ]
    };
  }, [processedData, labelAnio1, labelAnio2]);

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
        Días Perdidos por Tipo de Incapacidad
      </h2>

      <div className="w-full h-[450px]">
        <ReactECharts option={chartOptions} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
      </div>

      <div className="overflow-x-auto w-full rounded-lg border border-[#503629]">
        <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
          <thead className="bg-[#f7f5f4] text-[#503629] border-b border-[#503629]">
            <tr>
              <th className="p-3 font-semibold">Tipo de Incapacidad</th>
              <th className="p-3 font-semibold text-center">Días {labelAnio1}</th>
              <th className="p-3 font-semibold text-center">Días {labelAnio2}</th>
              <th className="p-3 font-semibold text-center">Variación</th>
              <th className="p-3 font-semibold text-center">% Cambio</th>
              <th className="p-3 font-semibold text-center">% Part. {labelAnio1}</th>
              <th className="p-3 font-semibold text-center">% Part. {labelAnio2}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {processedData.list.map((row, index) => (
              <tr key={index} className="hover:bg-[#faf9f8] transition-colors">
                <td className="p-3 text-gray-700 font-medium truncate max-w-[200px]" title={row.tipo}>{row.tipo}</td>
                <td className="p-3 text-center text-gray-600">{formatNum(row.diasAnio1)}</td>
                <td className="p-3 text-center text-gray-600 font-semibold">{formatNum(row.diasAnio2)}</td>
                <td className={`p-3 font-bold ${row.colorTendencia}`}>
                  <div className="flex items-center justify-center gap-1.5">
                    {row.variacion > 0 ? '+' : ''}{formatNum(row.variacion)}
                    {row.iconoTendencia}
                  </div>
                </td>
                <td className="p-3 text-center text-gray-600">
                  {row.pctCambio !== null ? `${row.pctCambio > 0 ? '+' : ''}${formatNum(row.pctCambio)}%` : 'N/A'}
                </td>
                <td className="p-3 text-center text-gray-600">{formatNum(row.partAnio1)}%</td>
                <td className="p-3 text-center text-gray-600">{formatNum(row.partAnio2)}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-[#f7f5f4] text-[#503629]">
            <tr className="font-bold border-t-2 border-[#503629]">
              <td className="p-3">Totales</td>
              <td className="p-3 text-center">{formatNum(processedData.totals.totalAnio1)}</td>
              <td className="p-3 text-center">{formatNum(processedData.totals.totalAnio2)}</td>
              <td className={`p-3 text-center ${processedData.totals.totalVariacion > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {processedData.totals.totalVariacion > 0 ? '+' : ''}{formatNum(processedData.totals.totalVariacion)}
              </td>
              <td className="p-3 text-center">{formatNum(processedData.totals.totalCambio)}%</td>
              <td className="p-3 text-center">100%</td>
              <td className="p-3 text-center">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}