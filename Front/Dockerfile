FROM node:24

WORKDIR /app

COPY package*.json ./

RUN npm cache clean --force && \
    rm -rf node_modules package-lock.json && \
    npm install --include=optional

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]