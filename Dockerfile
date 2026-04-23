FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 8080
ENV PORT=8080
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8080"]
