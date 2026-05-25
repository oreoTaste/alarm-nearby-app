# 1. 노드 이미지 선택 (가벼운 alpine 버전)
FROM node:20-alpine

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 의존성 파일 먼저 복사 (캐시 활용)
COPY package.json package-lock.json ./

# 4. 패키지 설치
RUN npm install

# 5. 나머지 소스 코드 복사
COPY . .

# 6. Vite의 기본 포트인 5173 노출
EXPOSE 5173

# 7. 서버 실행 (Vite는 도커 환경에서 --host 옵션이 필수입니다)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
