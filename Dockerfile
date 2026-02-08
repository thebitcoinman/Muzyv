# Use Node.js 18 LTS as base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files from frontend directory
COPY muzyv_frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code from frontend directory
COPY muzyv_frontend/ .

# Build the application (skip TypeScript checking)
RUN npx vite build

# Production stage - use nginx to serve the static files
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]