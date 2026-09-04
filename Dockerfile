FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps to avoid conflicts
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Set environment for React dev server
ENV PORT=3000
ENV CHOKIDAR_USEPOLLING=true
ENV BROWSER=none

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
