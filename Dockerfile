FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
COPY public/manifest.json dist/manifest.json
EXPOSE 8080
ENV NODE_ENV=production
ENV PORT=8080
CMD ["npx", "tsx", "server.ts"]