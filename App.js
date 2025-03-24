import React, { useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin);

function App() {
  const [stock1, setStock1] = useState('AAPL');
  const [stock2, setStock2] = useState('MSFT');
  const [period, setPeriod] = useState('1y');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await axios.post('/compare_stocks', { stock1, stock2, period });
      if (response.data.error) throw new Error(response.data.error);
      setResult(response.data);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const priceChartData = result
    ? {
        labels: result.dates,
        datasets: [
          { label: stock1, data: result.stock1_prices, borderColor: '#3b82f6', fill: false },
          { label: stock2, data: result.stock2_prices, borderColor: '#ef4444', fill: false },
        ],
      }
    : null;

  const spreadChartData = result
    ? { labels: result.dates, datasets: [{ label: 'Spread', data: result.spread, borderColor: '#10b981', fill: false }] }
    : null;

  const zScoreChartData = result
    ? { labels: result.dates, datasets: [{ label: 'Z-Score', data: result.z_score, borderColor: '#8b5cf6', fill: false }] }
    : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true },
      tooltip: { enabled: true, mode: 'index', intersect: false },
      zoom: {
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' },
        pan: { enabled: true, mode: 'xy' },
      },
    },
    scales: {
      x: { ticks: { maxTicksLimit: 10 } },
      y: { ticks: { callback: (value) => value.toFixed(2) } },
    },
  };

  return (
    <div className={`flex flex-col items-center min-h-screen p-6 transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold">Pairs Trading Tool</h1>
        <span className="ml-2 text-2xl">🍐</span>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setShowAbout(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          About Pairs Trading
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        >
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <div className="mb-4">
          <label className="block font-medium mb-1 dark:text-gray-200">Stock 1:</label>
          <input
            type="text"
            value={stock1}
            onChange={(e) => setStock1(e.target.value.toUpperCase())}
            placeholder="e.g., AAPL"
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1 dark:text-gray-200">Stock 2:</label>
          <input
            type="text"
            value={stock2}
            onChange={(e) => setStock2(e.target.value.toUpperCase())}
            placeholder="e.g., MSFT"
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1 dark:text-gray-200">Period:</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="1mo">1 Month</option>
            <option value="3mo">3 Months</option>
            <option value="6mo">6 Months</option>
            <option value="1y">1 Year</option>
            <option value="2y">2 Years</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full p-2 rounded-lg text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'}`}
        >
          {loading ? 'Loading...' : 'Compare Stocks'}
        </button>
      </form>

      {showAbout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-center dark:text-white">About Pairs Trading</h2>
            <p className="mb-4 dark:text-gray-200">
              Pairs trading is a strategy where you trade two stocks that usually move together. When their prices diverge, you buy the underperforming stock (go long) and sell the overperforming one (go short), betting they’ll return to their normal relationship.
            </p>
            <h3 className="text-xl font-semibold mb-2 dark:text-gray-100">How to Use This Tool</h3>
            <ul className="list-disc pl-5 mb-4 dark:text-gray-200">
              <li><strong>Pick Stocks:</strong> Choose two stocks you think are related (e.g., AAPL and MSFT).</li>
              <li><strong>Check Correlation:</strong> A value close to 1 means they move together well—ideal for pairs trading. Below 0.7 might be less reliable.</li>
              <li><strong>Watch the Spread:</strong> The spread (Stock 1 - Stock 2) shows their price difference. A big spread means divergence.</li>
              <li>
                <strong>Use Z-Score:</strong> This tells you how extreme the spread is:
                <ul className="list-circle pl-5">
                  <li>Z-Score &gt; 2: Spread is wide—short the high stock, long the low one.</li>
                  <li>Z-Score &lt; -2: Spread is narrow—long the low stock, short the high one.</li>
                  <li>Z-Score near 0: Prices are normal—no trade yet.</li>
                </ul>
              </li>
              <li><strong>Monitor Trends:</strong> Run the tool regularly to spot opportunities and close trades when the spread narrows.</li>
            </ul>
            <h3 className="text-xl font-semibold mb-2 dark:text-gray-100">Example</h3>
            <p className="mb-4 dark:text-gray-200">
              If AAPL and MSFT’s z-score hits 2.5, AAPL might be overpriced. Short AAPL, long MSFT, and wait for the z-score to drop near 0 for profit.
            </p>
            <button
              onClick={() => setShowAbout(false)}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}
      {result && (
        <div className="w-full max-w-4xl space-y-8">
          <h2 className="text-2xl font-semibold mb-4 text-center">Results</h2>
          <p className="text-center mb-2">Correlation: {result.correlation.toFixed(4)}</p>
          {result.signal && (
            <p className="text-center mb-4 text-green-600 dark:text-green-400 font-medium">{result.signal}</p>
          )}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2 text-center dark:text-white">Stock Prices</h3>
              <Line
                data={priceChartData}
                options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { text: 'Stock Prices' } } }}
              />
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2 text-center dark:text-white">Spread</h3>
              <Line
                data={spreadChartData}
                options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { text: 'Spread' } } }}
              />
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md lg:col-span-2">
              <h3 className="text-xl font-semibold mb-2 text-center dark:text-white">Z-Score</h3>
              <Line
                data={zScoreChartData}
                options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { text: 'Z-Score' } } }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;