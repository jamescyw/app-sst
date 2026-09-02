import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { CircleArrowDown, CircleArrowUp, CircleMinus } from 'lucide-react';

export default function Chart0({ data, labelAnio1, labelAnio2 }) {
  const top10Data = useMemo(() => {
    if (!data || data.length === 0) return [];

    const sorted = [...data].sort((a, b) => b.casosAnio2 - a.casosAnio2).slice(0, 10);

    return sorted.map(item => {
      const variacion = item.casosAnio2 - item.casosAnio1;
      let colorTendencia = 'text-gray-400';
      let iconoTendencia = <CircleMinus size={16} />;

      if (variacion > 0) {
        colorTendencia = 'text-red-500';
        iconoTendencia = <CircleArrowUp size={16} />;
      } else if (variacion < 0) {
        colorTendencia = 'text-green-500';
        iconoTendencia = <CircleArrowDown size={16} />;
      }

      return {
        ...item,
        variacion,
        colorTendencia,
        iconoTendencia
      };
    });
  }, [data]);

  const chartOptions = useMemo(() => {
    const reversedData = [...top10Data].reverse();

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: [labelAnio1, labelAnio2],
        bottom: 0,
        icon: 'circle',
        itemGap: 20,
        textStyle: { color: '#4b5563' }
      },
      grid: {
        // Asignamos 250px fijos a la izquierda para los textos
        left: 250, 
        right: '4%',
        bottom: '12%',
        top: '2%',
        // Apagamos containLabel para que ECharts no desconfigure el espacio
        containLabel: false 
      },
      xAxis: {
        type: 'value',
        name: '',
        splitLine: {
          lineStyle: { type: 'dashed', color: '#e5e7eb' }
        }
      },
      yAxis: {
        type: 'category',
        data: reversedData.map(d => d.diagnostico),
        axisLabel: {
          width: 230,        // El ancho de la caja de texto
          overflow: 'truncate',
          fontSize: 11,
          align: 'left',     // Alinea a la izquierda de la caja
          margin: 240,       // Empuja la caja 240px hacia la izquierda (dentro del grid.left de 250)
          color: '#374151', 
        },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#d1d5db' } }
      },
      series: [
        {
          name: labelAnio1,
          type: 'bar',
          data: reversedData.map(d => d.casosAnio1),
          itemStyle: { 
            color: '#A88C7D', 
            borderRadius: [0, 4, 4, 0] 
          },
          barGap: '10%'
        },
        {
          name: labelAnio2,
          type: 'bar',
          data: reversedData.map(d => d.casosAnio2),
          itemStyle: { 
            color: '#503629', 
            borderRadius: [0, 4, 4, 0] 
          }
        }
      ]
    };
  }, [top10Data, labelAnio1, labelAnio2]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-center items-center h-64 text-gray-500">
        No hay datos registrados para los años seleccionados ({labelAnio1} - {labelAnio2}).
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl border border-[#503629] flex flex-col gap-8">
      <h2 className="text-xl font-bold text-center text-[#503629]">
        Top 10 Diagnósticos
      </h2>

      <div className="w-full h-[450px]">
        <ReactECharts 
          option={chartOptions} 
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </div>

      <div className="overflow-x-auto w-full rounded-lg border border-[#503629]">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-[#f7f5f4] text-[#503629] border-b border-[#503629]">
            <tr>
              <th className="p-3 font-semibold">Diagnóstico</th>
              <th className="p-3 font-semibold text-center w-28">Casos {labelAnio1}</th>
              <th className="p-3 font-semibold text-center w-28">Casos {labelAnio2}</th>
              <th className="p-3 font-semibold text-center w-28">Variación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {top10Data.map((row, index) => (
              <tr key={index} className="hover:bg-[#faf9f8] transition-colors">
                <td className="p-3 text-gray-700 font-medium truncate max-w-[200px]" title={row.diagnostico}>
                  {row.diagnostico}
                </td>
                <td className="p-3 text-center text-gray-600">{row.casosAnio1}</td>
                <td className="p-3 text-center text-gray-600 font-semibold">{row.casosAnio2}</td>
                <td className={`p-3 font-bold ${row.colorTendencia}`}>
                  <div className="flex items-center justify-center gap-1.5">
                    {row.variacion > 0 ? '+' : ''}{row.variacion}
                    {row.iconoTendencia}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}