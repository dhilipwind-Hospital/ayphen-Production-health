# Development stage
FROM node:18-slim

WORKDIR /app

# Install Python and build tools required for node-gyp
RUN apt-get update && apt-get install -y python3 make g++

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install --no-optional

# Copy the rest of the application
COPY . .

# Environment variables
ENV NODE_ENV=development
ENV PORT=5000

# Expose port 5000 for the backend server
EXPOSE 5000

# Start the development server
CMD ["npm", "run", "dev"]
