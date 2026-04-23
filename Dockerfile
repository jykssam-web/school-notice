FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY src ./src
COPY public ./public
COPY index.html vite.config.ts tsconfig.json ./
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "dev"]
