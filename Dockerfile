FROM node:18-alpine as development

WORKDIR /app

COPY package*.json .

RUN yarn

COPY . .

RUN yarn build

FROM node:18-alpine as production

# ARG NODE_ENV=production
# ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

COPY package*.json .

RUN yarn --quiet --production

COPY --from=development /app/dist ./dist

CMD [ "node", "dist/app.js" ]