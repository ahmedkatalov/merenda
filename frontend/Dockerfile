FROM node:22-alpine AS build
WORKDIR /app
# Copy every workspace manifest so `npm ci` can resolve the full lockfile graph.
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY frontend/package.json frontend/
COPY admin/package.json admin/
RUN npm ci
COPY packages/shared packages/shared
COPY frontend frontend
RUN npm run build -w frontend

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
