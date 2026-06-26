FROM node:20-alpine
WORKDIR /app

# Install deps first for better layer caching
COPY package.json ./
RUN npm install

# App source
COPY . .

EXPOSE 5000

# Default command (compose overrides this to seed first)
CMD ["npm", "start"]
