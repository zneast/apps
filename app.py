from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import yfinance as yf
import pandas as pd
import numpy as np
import os

app = Flask(__name__, static_folder='frontend/build', static_url_path='/')
CORS(app, resources={r"/compare_stocks": {"origins": "*"}})

@app.route('/compare_stocks', methods=['POST'])
def compare_stocks():
    data = request.get_json()
    stock1 = data.get('stock1')
    stock2 = data.get('stock2')
    period = data.get('period')

    app.logger.info(f"Request: stock1={stock1}, stock2={stock2}, period={period}")

    if not stock1 or not stock2 or not period:
        return jsonify({'error': 'Missing stock ticker or period'}), 400
    valid_periods = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']
    if period not in valid_periods:
        return jsonify({'error': f'Invalid period. Use: {", ".join(valid_periods)}'}), 400

    try:
        app.logger.info(f"Fetching {stock1} data")
        df1_raw = yf.download(stock1, period=period)
        app.logger.info(f"{stock1} raw data: {df1_raw.shape}, columns={list(df1_raw.columns)}")
        if isinstance(df1_raw.columns, pd.MultiIndex):
            df1 = df1_raw['Adj Close'][stock1] if 'Adj Close' in df1_raw.columns.levels[0] else df1_raw['Close'][stock1]
        else:
            df1 = df1_raw['Adj Close'] if 'Adj Close' in df1_raw.columns else df1_raw['Close']

        app.logger.info(f"Fetching {stock2} data")
        df2_raw = yf.download(stock2, period=period)
        app.logger.info(f"{stock2} raw data: {df2_raw.shape}, columns={list(df2_raw.columns)}")
        if isinstance(df2_raw.columns, pd.MultiIndex):
            df2 = df2_raw['Adj Close'][stock2] if 'Adj Close' in df2_raw.columns.levels[0] else df2_raw['Close'][stock2]
        else:
            df2 = df2_raw['Adj Close'] if 'Adj Close' in df2_raw.columns else df2_raw['Close']

        if df1.empty or df2.empty or not isinstance(df1, pd.Series) or not isinstance(df2, pd.Series):
            return jsonify({'error': f'No valid data for {stock1} or {stock2}'}), 404

        df = pd.concat([df1, df2], axis=1).dropna()
        app.logger.info(f"Aligned data: {len(df)} rows")
        if df.empty:
            return jsonify({'error': 'No overlapping data after alignment'}), 404
        df.columns = [stock1, stock2]
        
        correlation = df[stock1].corr(df[stock2])
        spread = df[stock1] - df[stock2]
        z_score = (spread - spread.mean()) / spread.std()
        
        latest_z = z_score.iloc[-1] if not z_score.empty else 0
        signal = None
        if abs(latest_z) > 2:
            signal = 'Trade: ' + ('Short ' + stock1 + ', Long ' + stock2 if latest_z > 2 else 'Long ' + stock1 + ', Short ' + stock2)
        
        response = {
            'correlation': float(correlation) if not pd.isna(correlation) else 0.0,
            'dates': df.index.strftime('%Y-%m-%d').tolist(),
            'stock1_prices': df[stock1].tolist(),
            'stock2_prices': df[stock2].tolist(),
            'spread': spread.tolist(),
            'z_score': z_score.tolist(),
            'signal': signal
        }
        app.logger.info("Response prepared successfully")
        return jsonify(response)
    except Exception as e:
        app.logger.error(f"Error in compare_stocks: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    app.logger.info(f"Requested path: {path}")
    app.logger.info(f"Static folder: {app.static_folder}")
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        app.logger.info(f"Serving: {path}")
        return send_from_directory(app.static_folder, path)
    app.logger.info("Serving index.html")
    if not os.path.exists(os.path.join(app.static_folder, 'index.html')):
        app.logger.error("index.html not found in static folder")
        return "Frontend build not found. Run 'npm run build' in frontend/", 404
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)