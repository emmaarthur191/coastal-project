# Use Node.js 22 Alpine image for modern package support
FROM node:22-alpine

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for dev mode)
RUN npm ci

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 3000

# Set environment for development
ENV NODE_ENV=development

# Run Vite dev server directly
# Note: volumes in docker-compose will handle hot reloading
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "3000"]
