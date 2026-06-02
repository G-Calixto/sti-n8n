FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/frontend/package.json apps/frontend/package.json

RUN npm install --workspace apps/frontend

COPY apps/frontend apps/frontend

ARG VITE_API_BASE_URL=http://localhost:3001
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build --workspace apps/frontend

FROM nginx:1.27-alpine

COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80
