FROM node:20-alpine

WORKDIR /app

# 모든 파일 복사
COPY . .

# 의존성 설치
RUN npm install

# 빌드
RUN npm run build

# manifest.json 복사 (이미 dist에 있지만 명시적으로)
RUN cp public/manifest.json dist/manifest.json || true

# 포트 설정
EXPOSE 8080

# 환경 변수
ENV NODE_ENV=production
ENV PORT=8080

# server.ts 실행 (Express + API + SSE)
CMD ["node", "--loader=tsx", "server.ts"]