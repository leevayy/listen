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

# Keep runtime deterministic: reuse deps from build stage so `vite` is always present.
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PATH=/app/node_modules/.bin:$PATH

COPY --from=build /app/dist ./dist

EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173", "--strictPort"]
