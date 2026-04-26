FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
COPY public/manifest.json dist/manifest.json
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npx", "tsx", "server.ts"]