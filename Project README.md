# Supply Chain Analytics

A comprehensive solution for supply chain data analysis, demand forecasting, and inventory optimization using Flask, React, MongoDB, and advanced forecasting models.

## Overview

This project delivers tools for analyzing and visualizing supply chain data to optimize inventory management:

- **Data Analysis (EDA)**: Analyze and visualize order data, product categories, delivery times, and shipping costs
- **Demand Forecasting**: Use XGBoost and ARIMA models to forecast demand by product category
- **Inventory Strategy**: Calculate safety stock, reorder points, and optimal inventory levels
- **Supplier Analysis**: Cluster suppliers and identify bottlenecks in delivery processes

## Project Structure

```
supply-chain-analytics/
├── backend/                # Flask backend
│   ├── app.py              # Main Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── routes/             # API endpoints
│   ├── services/           # Analysis and forecasting services
│   └── utils/              # Utilities and helper functions
│
├── frontend/               # React frontend
│   ├── public/             # Static resources
│   ├── src/                # React source code
│   │   ├── components/     # React components
│   │   ├── pages/          # Application pages
│   │   └── services/       # API services
│   ├── package.json        # Configuration and dependencies
│   └── .env                # Environment configuration
│
└── database/               # MongoDB data and configuration
    ├── sample_data/        # Sample CSV data
    └── mongodb_exports/    # Exported MongoDB data
```

## Requirements

### Backend
- Python 3.8+
- Flask
- MongoDB
- Libraries: pandas, numpy, scikit-learn, xgboost, statsmodels, pymongo

### Frontend
- Node.js 14+
- React 18+
- Libraries: recharts, axios, react-router-dom

## Installation

### Backend

```bash
cd backend
pip install -r requirements.txt
# Create .env from .env.example and update MongoDB connection
python app.py
```

### Frontend

```bash
cd frontend
npm install
# Update VITE_API_URL in .env if needed
npm run dev
```

## Database Setup

### Using MongoDB Atlas (Recommended)
1. Create an account and cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Configure Database Access (create username and password)
3. Configure Network Access (allow your IP address)
4. Update connection string in backend's `.env` file

### Import Sample Data
1. Use MongoDB Compass to connect to MongoDB
2. Create `supply_chain_db` database
3. Import collections from `database/mongodb_exports/` directory

## Usage

1. **Upload Data**: Upload the sample CSV files
2. **Dashboard**: View summary of supply chain data
3. **Analysis**: Explore orders by month, top categories, delivery rates, etc.
4. **Forecast**: View demand forecasts by category using XGBoost and ARIMA models
5. **Inventory Strategy**: View inventory strategies, supplier analysis, and bottlenecks

## Features

### Demand Forecasting
The system uses XGBoost and ARIMA models to forecast demand by product category, with performance metrics (MAE, RMSE) for model comparison.

### Inventory Optimization
Automatically calculates safety stock, reorder points, and optimal inventory levels based on demand forecasts, lead times, and demand variability.

### Supplier Analysis
Clusters suppliers into groups based on delivery performance and costs, helping businesses make better decisions about supplier selection.

### Optimization Recommendations
Provides automatic recommendations to optimize inventory and reduce holding costs, highlighting potential cost savings.

## Technologies

- **Backend**: Flask, MongoDB, Pandas, NumPy, XGBoost, ARIMA, scikit-learn
- **Frontend**: React, Recharts, Axios, React Router
- **Database**: MongoDB

## License

This project is distributed under the MIT License.