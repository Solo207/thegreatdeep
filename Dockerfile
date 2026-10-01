# Stage 1: Build client
FROM node:22-alpine AS client-builder

WORKDIR /app/client

# Copy package.json and lock file before the rest of the code
COPY client/package.json client/package-lock.json ./
RUN npm ci

# Copy the rest of the client code and build
COPY client/ ./
RUN npm run build

# Stage 2: Production server
FROM node:22-alpine

WORKDIR /app/server

# Copy package.json and lock file before the rest of the code
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# Copy server code and built client dist
COPY server/ ./
COPY --from=client-builder /app/client/dist /app/client/dist

EXPOSE 3000

# Run node server.js from server/
CMD ["node", "server.js"]
