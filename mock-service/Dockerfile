FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache curl && npm install
COPY app.js ./
EXPOSE 8081
CMD ["node", "app.js"]
