FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/backend/package.json apps/backend/package.json

RUN npm install --workspace apps/backend --omit=dev

COPY apps/backend apps/backend

WORKDIR /app/apps/backend

EXPOSE 3001

CMD ["npm", "start"]
