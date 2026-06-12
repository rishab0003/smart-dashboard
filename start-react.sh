#!/bin/bash

# SmartAnalyticsDash - React Frontend Startup Script
# Usage: ./start-react.sh

set -e

PROJECT_DIR="/home/rishab/SmartAnalyticsDash/smart-dashboard"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║        SmartAnalyticsDash - React Frontend Starting           ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Navigate to project directory
cd "$PROJECT_DIR"

echo "📦 Building and starting React frontend..."
echo ""

# Stop existing containers
docker compose down 2>/dev/null || true

# Build and start all services
docker compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "🔍 Checking service status..."
echo ""

# Check backend
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Backend API: http://localhost:5000/api"
else
    echo "⏳ Backend API: Starting..."
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ React Frontend: http://localhost:3000"
else
    echo "⏳ React Frontend: Building..."
fi

# Check ML service
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo "✅ ML Service: http://localhost:5001"
else
    echo "⏳ ML Service: Starting..."
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║              🚀 React Frontend Started Successfully!           ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Access Points:"
echo "   • React App:  http://localhost:3000"
echo "   • Backend:    http://localhost:5000/api"
echo "   • ML Service: http://localhost:5001"
echo ""
echo "📝 Features:"
echo "   • Modern React UI with Tailwind CSS"
echo "   • Dark glassmorphism theme"
echo "   • Responsive design"
echo "   • Real-time charts and analytics"
echo "   • Drag & drop file upload"
echo "   • ML-powered predictions"
echo "   • Complete authentication system"
echo ""
echo "📚 Pages Available:"
echo "   • Login: http://localhost:3000/login"
echo "   • Register: http://localhost:3000/register"
echo "   • Dashboard: http://localhost:3000/dashboard"
echo "   • Analytics: http://localhost:3000/analytics"
echo "   • Upload: http://localhost:3000/upload"
echo "   • Predictions: http://localhost:3000/predictions"
echo ""
echo "🛑 To stop the application:"
echo "   docker compose down"
echo ""
echo "📊 To view logs:"
echo "   docker compose logs -f frontend"
echo ""