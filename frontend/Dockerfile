# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Install deps (keep layer cache-friendly)
COPY package.json package-lock.json ./
RUN npm ci

# Build
COPY . .
RUN npm run build

# Runtime stage (serve built assets via vite preview)
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci

COPY --from=build /app/dist ./dist

EXPOSE 80
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "80", "--strictPort"]
