# --- Build Stage ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Run tests and linter to guarantee the image is only built if the code passes quality checks
RUN npm run lint
RUN npm test

# --- Production Stage ---
FROM node:18-alpine AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_FILE=/app/data/database.sqlite

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy source code and frontend assets
COPY server/ ./server/
COPY public/ ./public/
COPY server.js ./

# Create directory for SQLite database storage and set permissions for security
RUN mkdir -p /app/data && chown -R node:node /app/data

# Run as non-root user for security
USER node

# Expose port
EXPOSE 3000

# Mountable volume for SQLite database persistence
VOLUME ["/app/data"]

CMD ["node", "server.js"]
