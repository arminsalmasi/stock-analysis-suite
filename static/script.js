document.addEventListener("DOMContentLoaded", () => {
    const searchBtn = document.getElementById("search-btn");
    const tickerInput = document.getElementById("ticker-input");
    const periodSelect = document.getElementById("period-select");
    
    // UI Elements
    const titleEl = document.getElementById("dashboard-title");
    const stockInfoEl = document.getElementById("stock-info");
    const stockNameEl = document.getElementById("stock-name");
    const stockSectorEl = document.getElementById("stock-sector");
    const stockPriceEl = document.getElementById("stock-price");
    
    // Loaders
    const loaders = [
        document.getElementById("loader-price"),
        document.getElementById("loader-macd"),
        document.getElementById("loader-rsi")
    ];

    const plotConfig = { responsive: true, displayModeBar: false };
    const layoutTemplate = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#94a3b8', family: 'Inter, sans-serif' },
        margin: { t: 30, r: 10, l: 50, b: 40 },
        xaxis: { gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.05)' },
        yaxis: { gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.05)' }
    };

    const fetchData = async (ticker, period) => {
        showLoaders();
        try {
            // Note: Update port if backend runs on a different port
            const res = await fetch(`/api/analyze?ticker=${ticker.toUpperCase()}&period=${period}`);
            if (!res.ok) throw new Error("Data fetch failed");
            
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            
            updateUI(data, ticker);
            plotCharts(data);
        } catch (error) {
            console.error("Error:", error);
            alert("Error fetching data. Is the Python backend running?");
        } finally {
            hideLoaders();
        }
    };

    const updateUI = (data, ticker) => {
        titleEl.textContent = `${ticker.toUpperCase()} Technical Analysis`;
        stockNameEl.textContent = data.info.name;
        stockSectorEl.textContent = data.info.sector || 'Unknown Sector';
        
        // Format price
        const price = data.info.currentPrice;
        stockPriceEl.textContent = parseFloat(price).toFixed(2);
        
        stockInfoEl.style.display = 'block';
    };

    const plotCharts = (data) => {
        const dates = data.dates;
        
        // 1. Price Chart with SMAs
        const tracePrice = { x: dates, y: data.close, type: 'scatter', mode: 'lines', name: 'Close', line: { color: '#f8fafc', width: 2 } };
        const traceSMA20 = { x: dates, y: data.sma_20, type: 'scatter', mode: 'lines', name: 'SMA 20', line: { color: '#3b82f6', width: 1.5 } };
        const traceSMA50 = { x: dates, y: data.sma_50, type: 'scatter', mode: 'lines', name: 'SMA 50', line: { color: '#eab308', width: 1.5 } };
        
        const priceLayout = {
            ...layoutTemplate,
            title: { text: 'Price & Moving Averages', font: { color: '#f8fafc' } },
            legend: { orientation: 'h', y: -0.2 }
        };
        
        Plotly.newPlot('price-chart', [tracePrice, traceSMA20, traceSMA50], priceLayout, plotConfig);

        // 2. MACD Chart
        const traceMACD = { x: dates, y: data.macd, type: 'scatter', mode: 'lines', name: 'MACD', line: { color: '#3b82f6' } };
        const traceSignal = { x: dates, y: data.signal, type: 'scatter', mode: 'lines', name: 'Signal', line: { color: '#ef4444' } };
        const traceHist = { x: dates, y: data.macd_hist, type: 'bar', name: 'Histogram', marker: { color: data.macd_hist.map(v => v >= 0 ? '#10b981' : '#ef4444') } };
        
        const macdLayout = {
            ...layoutTemplate,
            title: { text: 'MACD', font: { color: '#f8fafc' } },
            legend: { orientation: 'h', y: -0.2 }
        };
        
        Plotly.newPlot('macd-chart', [traceHist, traceMACD, traceSignal], macdLayout, plotConfig);

        // 3. RSI Chart
        const traceRSI = { x: dates, y: data.rsi, type: 'scatter', mode: 'lines', name: 'RSI', line: { color: '#8b5cf6' } };
        
        const rsiLayout = {
            ...layoutTemplate,
            title: { text: 'Relative Strength Index (RSI)', font: { color: '#f8fafc' } },
            shapes: [
                { type: 'line', y0: 70, y1: 70, x0: dates[0], x1: dates[dates.length-1], line: { color: '#ef4444', width: 1, dash: 'dot' } },
                { type: 'line', y0: 30, y1: 30, x0: dates[0], x1: dates[dates.length-1], line: { color: '#10b981', width: 1, dash: 'dot' } }
            ]
        };
        
        Plotly.newPlot('rsi-chart', [traceRSI], rsiLayout, plotConfig);
    };

    const showLoaders = () => loaders.forEach(l => l.style.display = 'block');
    const hideLoaders = () => loaders.forEach(l => l.style.display = 'none');

    // Event Listeners
    searchBtn.addEventListener("click", () => {
        const ticker = tickerInput.value.trim();
        if (ticker) fetchData(ticker, periodSelect.value);
    });

    tickerInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const ticker = tickerInput.value.trim();
            if (ticker) fetchData(ticker, periodSelect.value);
        }
    });

    periodSelect.addEventListener("change", () => {
        const ticker = tickerInput.value.trim();
        if (ticker) fetchData(ticker, periodSelect.value);
    });

    // Initial load
    fetchData("AAPL", "1y");
});
