FROM node:18-alpine as development

WORKDIR /app
COPY package*.json .
RUN yarn
COPY . .

RUN yarn build

FROM node:18-alpine as production

# ARG NODE_ENV=production
# ENV NODE_ENV=${NODE_ENV}
RUN addgroup app && adduser -S -G app app
USER app

WORKDIR /app
COPY package*.json .
USER root
RUN chown -R app:app .
USER app

RUN yarn --quiet --production
COPY --from=development /app/dist ./dist

CMD [ "node", "dist/app.js" ]