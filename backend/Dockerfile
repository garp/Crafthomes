# Use official Node.js image
FROM node:22-alpine

# Set working directory
WORKDIR /src

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app
COPY . .

RUN cp .env .env && \
	npm run prisma:generate && \
	npm run prisma:migrate:deploy

# Expose app port (change if your app uses a different one)
EXPOSE 5005

# Default command for Easypanel to run your stage script
CMD ["npm", "run", "prod"]
