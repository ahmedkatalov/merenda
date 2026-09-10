FROM node:22-alpine AS build
WORKDIR /app
# Baked into the admin bundle at build time: the public site URL used by the
# live-preview iframe. Passed from docker-compose (args.VITE_SITE_URL).
ARG VITE_SITE_URL=""
ENV VITE_SITE_URL=$VITE_SITE_URL
# Copy every workspace manifest so `npm ci` can resolve the full lockfile graph.
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY frontend/package.json frontend/
COPY admin/package.json admin/
RUN npm ci
COPY packages/shared packages/shared
COPY admin admin
RUN npm run build -w admin

FROM nginx:1.27-alpine
COPY admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/admin/dist /usr/share/nginx/html
