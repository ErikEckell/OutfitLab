# Use Node.js image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of the frontend code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Command to start frontend
CMD ["yarn", "dev", "--host"]
