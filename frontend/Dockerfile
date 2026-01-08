# Development stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including react-scripts
RUN npm install && npm install -g react-scripts

# Copy the rest of the application
COPY . .

# Environment variables
ENV NODE_ENV=development
ENV PORT=3000
ENV WDS_SOCKET_PORT=3000

# Expose port 3000 for the React development server
EXPOSE 3000

# Start the development server
CMD ["sh", "-c", "npm install && npm start"]
