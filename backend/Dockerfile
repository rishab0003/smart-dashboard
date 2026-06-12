# Use Node.js 20 Alpine (small image)
FROM node:20-alpine

WORKDIR /app

# Copy package files first (leverage Docker layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production  # ci = clean install (more reliable than npm install)

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:5000/health || exit 1

# Run the server
CMD ["node", "server.js"]