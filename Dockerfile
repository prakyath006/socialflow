FROM node:20-slim

# Install ffmpeg for video processing
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the Vite frontend
RUN npm run build

# Expose port (Cloud Run defaults to 8080)
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
