# Production Dockerfile for Ayphen Hospital Backend
FROM node:18-slim

WORKDIR /app

# Install Python and build tools required for node-gyp
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy the rest of the application
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port 5000 for the backend server
EXPOSE 5000

# Start the production server
CMD ["npm", "start"]
