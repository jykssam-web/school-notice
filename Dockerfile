FROM node:20-alpine
WORKDIR /app
COPY . .
COPY public/manifest.json dist/manifest.json
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview", "--", "--port", "8080"]