<div align="center">
  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/chart-line.svg" width="60" height="60" alt="Dashboard Icon" />
  <h1>Smart Dashboard</h1>
  <p><strong>A full-stack, microservices-based analytics platform with machine learning-powered predictive insights.</strong></p>
  
  [![React](https://img.shields.io/badge/React-18.x-blue.svg?style=flat&logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg?style=flat&logo=nodedotjs)](https://nodejs.org/)
  [![Python](https://img.shields.io/badge/Python-3.11-yellow.svg?style=flat&logo=python)](https://python.org/)
  [![Docker](https://img.shields.io/badge/Docker-Supported-2496ED.svg?style=flat&logo=docker)](https://docker.com/)
</div>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Docker Setup (Recommended)](#docker-setup-recommended)
  - [Manual Local Setup](#manual-local-setup)
- [Directory Structure](#directory-structure)
- [API Reference](#api-reference)
- [Contributing](#contributing)

---

## Overview

**Smart Dashboard** is an enterprise-ready web application designed to handle data ingestion, reporting, and advanced projections. It bridges robust backend data management with a sleek frontend interface and utilizes an independent Python microservice for heavy computational machine learning tasks, offering seamless scalability and performance.

---

## Architecture

The project strictly follows a microservices pattern orchestrated via **Docker & Docker Compose**:

1. **Frontend (React)**: Handles the UI/UX, built as an SPA, and securely interacts with backend APIs.
2. **Backend (Node.js/Express)**: Serves as the central API gateway managing user authentication, logic processing, database queries, and routing external Python microservice calls.
3. **ML Service (Python/Flask)**: An independent service dedicated strictly to processing sales datasets using `scikit-learn` for generating predictive insights.
4. **Nginx Reverse Proxy**: Orchestrates traffic, handles CORS efficiently, and routes requests to their appropriate internal containers.

---

## Key Features

- <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/lock.svg" width="16" height="16" /> **JWT-Based Authentication**: Industry-standard secure login and registration pipeline.
- <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/chart-bar.svg" width="16" height="16" /> **Interactive Analytics**: Rich visualizations highlighting metrics, sales, and platform trends.
- <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/robot.svg" width="16" height="16" /> **Predictive AI Engine**: Upload your raw data manually, and let our custom ML models project future trends.
- <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/file-csv.svg" width="16" height="16" /> **Data Upload Portal**: Securely ingest, sanitize, and persist CSV datasets.
- <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/brands/docker.svg" width="16" height="16" /> **Fully Dockerized**: Completely abstracted infrastructure making onboarding instantaneous.

---

## Tech Stack

| Component         | Technology                           |
|-------------------|--------------------------------------|
| **Frontend**      | React.js, React Router, Axios        |
| **Backend**       | Node.js, Express.js, Mongoose        |
| **Machine Learning**| Python 3.11, Flask, Pandas, Scikit-Learn |
| **Database**      | MongoDB (or compatible NoSQL)        |
| **Infrastructure**| Docker, Docker Compose, Nginx        |

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your local development machine:
- [Git](https://git-scm.com/)
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- *(Optional)* Node.js and Python 3.11 (if running without Docker)

### Docker Setup (Recommended)

Bootstrapping the entire microservices cluster takes just a single command. 

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/smart-dashboard.git
   cd smart-dashboard
   ```

2. **Spin up the environment:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - **Frontend UI:** `http://localhost:3000`
   - **Backend API:** `http://localhost:5000`
   - **ML Engine API:** `http://localhost:5001`

### Manual Local Setup

If you prefer to run the services explicitly on your host machine to debug configurations:

<details>
<summary><b>1. Start the Backend API</b></summary>
<br>

```bash
cd backend
npm install
npm start
```
</details>

<details>
<summary><b>2. Start the ML Service</b></summary>
<br>

```bash
cd ml-service
python3 -m venv ml_env
source ml_env/bin/activate
pip install -r requirements.txt
python app.py
```
</details>

<details>
<summary><b>3. Start the Frontend</b></summary>
<br>

```bash
cd frontend
npm install
npm start
```
</details>

---

## Directory Structure

```text
smart-dashboard/
├── backend/                  # Node.js REST API gateway
│   ├── src/controllers/      # Request handlers (auth, upload, predictions)
│   ├── src/models/           # DB schemas
│   └── src/routes/           # API path definitions
├── frontend/                 # Client UI application
│   ├── public/               # Static assets
│   └── src/                  # React components, pages, and utilities
├── ml-service/               # Python ML processing cluster
│   ├── models/               # Serialized ML metadata/feature mappings
│   ├── notebooks/            # Jupyter environments for data exploration
│   └── scripts/              # Training, preprocessing & evaluation pipelines
├── docker/                   # Custom Nginx configurations
└── docker-compose.yml        # Orchestration definitions
```

---

## Contributing

We welcome contributions to the **Smart Dashboard**! 

1. **Fork** the project.
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`).
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
4. **Push** to the branch (`git push origin feature/AmazingFeature`).
5. Open a **Pull Request**.

<div align="center">
  <sub>Built with <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/heart.svg" width="12" height="12" /> for modern data ecosystems.</sub>
</div>
