# SmartAnalyticsDash 🚀

[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933.svg?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB.svg?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248.svg?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Supported-2496ED.svg?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com/)

**SmartAnalyticsDash** is an enterprise-ready, containerized full-stack analytics suite. It bridges a modern glassmorphic React interface with a Node.js/Express API Gateway and an independent Python Flask/Gunicorn microservice. It allows users to ingest CSV datasets, explore and edit records in real time, and fit machine learning models (Random Forest) to compute predictive sales forecasts.

## 🌐 Live Demo

**[🚀 Visit the Live Application](https://smart-dashboard-frontend-qafh.onrender.com/)**

Check out the deployed version to see SmartAnalyticsDash in action!

## 🖼️ Interface Previews

<div align="center">
  <h3>1. Interactive Sales Dashboard</h3>
  <img src="docs/images/dashboard_light.png" width="100%" alt="Interactive Sales Dashboard" style="border-radius: 8px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
  
  <br/><br/>
  
  <h3>2. Business Insights & Analytics</h3>
  <img src="docs/images/analytics_light.png" width="100%" alt="Business Insights & Analytics" style="border-radius: 8px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
  
  <br/><br/>
  
  <h3>3. Machine Learning Forecasting Console</h3>
  <img src="docs/images/predictions_light.png" width="100%" alt="Machine Learning Forecasting Console" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
</div>

---

## 🏛️ System Architecture

The application is orchestrated as a modular microservices platform via **Docker Compose** and **Nginx Reverse Proxy**:

```mermaid
graph TD
    Client[Browser Client]
    Nginx[Nginx Reverse Proxy: 8080]
    React[React Frontend: 3000]
    Node[Express API Gateway: 5000]
    Flask[Python ML Service: 5001]
    Mongo[(MongoDB: 27017)]

    Client -->|HTTP / static assets| Nginx
    Nginx -->|Proxy: /| React
    Nginx -->|Proxy: /api| Node
    Node -->|Mongoose DB Driver| Mongo
    Node -->|HTTP API calls| Flask
```

1. **Frontend (React)**: Handles stateful user interactions, responsive glassmorphic cards, dynamic chart renderings (Recharts), and transitions.
2. **Backend API Gateway (Node.js/Express)**: Manages JWT-based authentication, CSV file sanitization and uploads, database schemas via Mongoose, and triggers training/prediction requests to the ML container.
3. **ML Processing Service (Python/Flask/Gunicorn)**: Performs automated data cleaning, labels encoding, Random Forest training, hyperparameter metrics calculation (R², MAPE, MAE, RMSE), and outputs feature weight importances.
4. **Database (MongoDB)**: Persists transaction registers and user authentication schemas.
5. **Nginx Reverse Proxy**: Handles incoming host port traffic (on port `8080`), routes requests to appropriate containers, and eliminates CORS/origin mismatches.

---

## ✨ Key Features

* 🔐 **Secure JWT Pipeline**: Industry-standard user registration and login pipeline with password hashing.
* 📊 **Interactive Glassmorphic Interface**: Premium Ronasit-inspired theme with micro-animations, physical sliding navigation indicator, and View Transitions API circular theme switching.
* 📈 **Machine Learning Hyperparameter Training Console**:
  * Tuning parameters (Number of Estimators, Max Tree Depth) directly from the UI.
  * Auto-calculated validation metrics (R² Score, MAPE, MAE, RMSE) with train/validation split ($80\%$ / $20\%$).
* 🧬 **ML Feature Importance Impact Chart**: Dynamic feature weight extraction (`feature_importances_`) rendered using premium glassmorphic orange-red charts.
* 🗃️ **Advanced Data Explorer & Spreadsheet Editor**:
  * Real-time regex search filtering text columns (Product, Category, Region).
  * Smooth client-side column sorting and row actions.
  * Inline "Edit Record" modal with derived validation (calculates `totalRevenue` automatically) and "Delete Record" confirmation.
* 🖨️ **Offline Export & Print Overrides**:
  * Instant offline CSV reports compiling monthly trends and product category distributions.
  * Custom `@media print` overrides hiding sidebars, buttons, and headers, formatting clean vector printable layouts.

---

## 🛠️ Tech Stack

| Service | Technologies | Key Packages |
| :--- | :--- | :--- |
| **Frontend** | React 18, HTML5, Vanilla CSS | `lucide-react`, `recharts`, `axios` |
| **Backend Gateway** | Node.js, Express.js | `mongoose`, `jsonwebtoken`, `bcrypt`, `csv-parser` |
| **ML Engine** | Python 3.11, Flask, Gunicorn | `scikit-learn`, `pandas`, `numpy` |
| **Database** | MongoDB 7.0 | `mongosh` |
| **Infrastructure** | Nginx, Docker, Docker Compose | `nginx:alpine` |

---

## 🚀 Getting Started

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine (v20+)
* [Docker Compose](https://docs.docker.com/compose/)
* *Optional:* Node.js 18+ and Python 3.11 (if running without containerization)

### 1. Set Up Environment Variables
Copy the production environment template or edit the default local `.env` file in the project root:

```bash
cp .env.example .env
```

Ensure the file contains private secure credentials:
```env
DOMAIN=localhost
MONGO_USER=admin
MONGO_PASSWORD=8gYo/m5ZZFv9meoYE4r2HhhIjb2ZJXTpKoSygaiOQmQ=
JWT_SECRET=YNE7L/7jHfEDasNZIs7u8FBDT3EIDLhvEK/roc5/SH6uVYQnBuHR788mdjzGAhCc0gAS+g0n1tEv7XwfKQcfcw==
NODE_ENV=production
```
*(Note: `.env` is ignored by Git in `.gitignore` to prevent any credential leaks).*

### 2. Run the Dockerized Stack
You can start the entire cluster in a single command using the provided helper startup script:

```bash
chmod +x ./start-react.sh
./start-react.sh
```

Or run Docker Compose directly:
```bash
docker compose up --build -d
```

### 3. Service Access Points
Once started, the services will be running at:
* **React Web App:** `http://localhost:3000` (or proxy gateway `http://localhost:8080`)
* **Backend API Server:** `http://localhost:5000`
* **Python ML API:** `http://localhost:5001`

---

## 🗄️ Database Management & Inspection

The database port `27017` is exposed in `docker-compose.yml` for local inspection. You can view your database collections using either of these methods:

### Method A: VS Code MongoDB Extension (Recommended)
1. Install the official **MongoDB for VS Code** extension.
2. Click **New Connection** and enter the following connection string (the password is URL-encoded to handle special characters):
   ```text
   mongodb://admin:8gYo%2Fm5ZZFv9meoYE4r2HhhIjb2ZJXTpKoSygaiOQmQ%3D@localhost:27017/smart_dashboard?authSource=admin
   ```
3. Expand `smart_dashboard` database to view the `users` and `sales` collections.

### Method B: Terminal CLI (MongoDB Shell)
Run the following command in your terminal to query user accounts directly from the container:
```bash
docker exec -it smart_dashboard_db mongosh -u admin -p "8gYo/m5ZZFv9meoYE4r2HhhIjb2ZJXTpKoSygaiOQmQ=" --authenticationDatabase admin --eval "printjson(db.getSiblingDB('smart_dashboard').users.find().toArray())"
```

---

## 📬 API Reference

### 🔐 Authentication
* `POST /api/auth/register` - Create a new user account.
* `POST /api/auth/login` - Authenticate user and receive a JWT token.

### 📊 Ingestion & DB Operations
* `POST /api/sales/upload` - Upload and parse sales CSV datasets.
* `GET /api/sales` - Fetch transaction database rows (supports pagination, regex search, and sorting).
* `PUT /api/sales/:id` - Edit a transaction record (auto-calculates total revenue).
* `DELETE /api/sales/:id` - Delete a transaction record from the database.

### 🤖 Predictive ML Operations
* `POST /api/predict` - Fit Random Forest model with tuned parameters.
* `GET /api/predict/status` - Fetch the training status and validation metrics.
* `GET /api/predict/model-info` - Fetch features importance weights.

---

## 📂 Directory Structure

```text
smart-dashboard/
├── backend/                  # Node.js API Gateway & Controllers
│   ├── config/               # DB connections & environment config
│   ├── src/controllers/      # Auth, Ingestion, and prediction handlers
│   ├── src/models/           # Mongoose schemas (User, Sale)
│   └── src/routes/           # API routes mapping
├── frontend/                 # React Web App UI
│   ├── public/               # Static assets (favicons, entry index.html)
│   └── src/components/       # Reusable layout and wrapper modules
│   └── src/pages/            # Dashboard, Explorer, Predictions views
├── ml-service/               # Python Flask ML Service
│   ├── models/               # Serialized pkl models & encoders (git-ignored)
│   ├── data/                 # Sanitized datasets & plot figures (git-ignored)
│   └── app.py                # Flask entry point & Gunicorn deployment
├── docker/                   # Nginx reverse proxy configurations
└── docker-compose.yml        # Multi-container orchestration rules
```

---

## 🤝 Contributing

We welcome contributions to the project:
1. **Fork** the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a **Pull Request**.

---
<div align="center">
  <sub>Built with ❤️ for modern data science & microservices engineering ecosystems.</sub>
</div>
