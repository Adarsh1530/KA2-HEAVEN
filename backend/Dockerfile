FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install

# Copy source code
COPY shared/ ./shared/
COPY backend/ ./backend/

# Build shared and backend
RUN npm --workspace=shared run build
RUN npm --workspace=backend run build

# Create data and uploads directories
RUN mkdir -p /app/backend/data /app/backend/uploads

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

CMD ["npm", "--workspace=backend", "run", "start"]
