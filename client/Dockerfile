FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json client/package.json

RUN npm ci --workspace=client --include-workspace-root=false

COPY client ./client

RUN npm run build --workspace=client

EXPOSE 3003

CMD ["npm", "run", "preview", "--workspace", "client", "--", "--host", "0.0.0.0", "--port", "3003"]
