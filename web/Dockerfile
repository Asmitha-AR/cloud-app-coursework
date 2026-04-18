# Dependencies stage
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build stage
FROM node:22-alpine AS build
WORKDIR /app

# Accept build-time environment variables
ARG NEXT_PUBLIC_AUTH_API_URL=http://localhost:5001/api
ARG NEXT_PUBLIC_SALARY_API_URL=http://localhost:5002/api
ARG NEXT_PUBLIC_STATS_API_URL=http://localhost:5004/api
ARG NEXT_PUBLIC_VOTE_API_PROXY_PATH=/api/vote
ARG NEXT_PUBLIC_SEARCH_API_PROXY_PATH=/api/search

# Make them available to Next.js build
ENV NEXT_PUBLIC_AUTH_API_URL=$NEXT_PUBLIC_AUTH_API_URL
ENV NEXT_PUBLIC_SALARY_API_URL=$NEXT_PUBLIC_SALARY_API_URL
ENV NEXT_PUBLIC_STATS_API_URL=$NEXT_PUBLIC_STATS_API_URL
ENV NEXT_PUBLIC_VOTE_API_PROXY_PATH=$NEXT_PUBLIC_VOTE_API_PROXY_PATH
ENV NEXT_PUBLIC_SEARCH_API_PROXY_PATH=$NEXT_PUBLIC_SEARCH_API_PROXY_PATH

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runtime stage
FROM node:22-alpine AS final
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
ENTRYPOINT ["npm", "run", "start"]
