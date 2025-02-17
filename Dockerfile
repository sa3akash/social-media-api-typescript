# Development stage
FROM node:18-alpine AS development

WORKDIR /app
COPY package*.json ./
RUN yarn install
COPY . . 
RUN yarn build

# Production stage
FROM node:18-alpine AS production

# Install FFmpeg (fix apt-get issue)
RUN apk add --no-cache ffmpeg

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Create user and set permissions correctly
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app
COPY package*.json ./
RUN chown -R app:app /app

USER app
RUN yarn install --production --silent

COPY --from=development /app/dist ./dist

CMD [ "node", "dist/app.js" ]
