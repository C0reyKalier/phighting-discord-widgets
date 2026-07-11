# Use a lightweight official Node.js image
FROM node:22-alpine

# Set the operational directory inside the container
WORKDIR /usr/src/app

# Copy application manifests first to leverage Docker layer caching
COPY package*.json ./

# Install only necessary production dependencies
RUN npm ci --only=production

# Copy the rest of your local codebase
COPY . .

# Deploy commands then run the startup script
RUN node deploy-commands.js
CMD ["node", "index.js"]