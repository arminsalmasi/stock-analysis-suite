from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import yfinance as yf
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)

def calculate_rsi(data, periods=14):
    close_delta = data['Close'].diff()
    up = close_delta.clip(lower=0)
    down = -1 * close_delta.clip(upper=0)
    ma_up = up.ewm(com=periods - 1, adjust=True, min_periods=periods).mean()
    ma_down = down.ewm(com=periods - 1, adjust=True, min_periods=periods).mean()
    rsi = ma_up / ma_down
    rsi = 100 - (100 / (1 + rsi))
    return rsi

def calculate_macd(data, slow=26, fast=12, signal_period=9):
    exp1 = data['Close'].ewm(span=fast, adjust=False).mean()
    exp2 = data['Close'].ewm(span=slow, adjust=False).mean()
    macd = exp1 - exp2
    signal = macd.ewm(span=signal_period, adjust=False).mean()
    histogram = macd - signal
    return macd, signal, histogram

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['GET'])
def analyze_stock():
    ticker = request.args.get('ticker', default='AAPL', type=str)
    period = request.args.get('period', default='1y', type=str)
    
    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period=period)
        
        if df.empty:
            return jsonify({"error": "No data found for this ticker."}), 404
        
        # Calculate technical indicators
        df['SMA_20'] = df['Close'].rolling(window=20).mean()
        df['SMA_50'] = df['Close'].rolling(window=50).mean()
        df['RSI'] = calculate_rsi(df)
        df['MACD'], df['Signal'], df['MACD_Hist'] = calculate_macd(df)
        
        df = df.dropna()
        
        # Prepare response data
        response = {
            "dates": df.index.strftime('%Y-%m-%d').tolist(),
            "close": df['Close'].tolist(),
            "volume": df['Volume'].tolist(),
            "sma_20": df['SMA_20'].tolist(),
            "sma_50": df['SMA_50'].tolist(),
            "rsi": df['RSI'].tolist(),
            "macd": df['MACD'].tolist(),
            "signal": df['Signal'].tolist(),
            "macd_hist": df['MACD_Hist'].tolist(),
            "info": {
                "name": stock.info.get('shortName', ticker),
                "sector": stock.info.get('sector', 'N/A'),
                "industry": stock.info.get('industry', 'N/A'),
                "currentPrice": stock.info.get('currentPrice', df['Close'].iloc[-1])
            }
        }
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
