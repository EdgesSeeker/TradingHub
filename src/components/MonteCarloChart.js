import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MonteCarloChart = ({ 
  data, 
  title, 
  xAxisLabel, 
  yAxisLabel, 
  showAverage = true,
  maxScenarios = 100 
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: '300px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#94a3b8',
        backgroundColor: '#1e293b',
        borderRadius: '0.5rem'
      }}>
        No data available
      </div>
    );
  }

  // Prepare data for Chart.js
  const chartData = {
    labels: data[0].map((_, index) => index),
    datasets: [
      // Individual scenarios (limited to maxScenarios for performance)
      ...data.slice(0, maxScenarios).map((scenario, index) => ({
        label: `Scenario ${index + 1}`,
        data: scenario.map(point => point.value || point),
        borderColor: 'rgba(139, 92, 246, 0.3)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 0.5,
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
        tension: 0.1,
        showLine: true
      })),
      // Average line
      ...(showAverage ? [{
        label: 'Average',
        data: data[0].map((_, dayIndex) => 
          data.reduce((sum, scenario) => sum + (scenario[dayIndex]?.value || scenario[dayIndex] || 0), 0) / data.length
        ),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        fill: false,
        tension: 0.1,
        showLine: true
      }] : [])
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide individual scenario legends
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        color: '#f8fafc',
        font: {
          size: 14,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context) => {
            return `${xAxisLabel}: ${context[0].label}`;
          },
          label: (context) => {
            return `Value: $${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: !!xAxisLabel,
          text: xAxisLabel,
          color: '#94a3b8',
          font: {
            size: 12
          }
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 10
          },
          maxTicksLimit: 10
        },
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawBorder: false
        }
      },
      y: {
        display: true,
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
          color: '#94a3b8',
          font: {
            size: 12
          }
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 10
          },
          callback: function(value) {
            return `$${(value / 1000).toFixed(0)}k`;
          }
        },
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawBorder: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 3
      }
    }
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default MonteCarloChart;
