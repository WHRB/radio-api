FROM node:12
WORKDIR /app
ADD package.json /app
ADD package-lock.json /app
RUN npm install --production
ADD . /app/

CMD ["npm", "start"]
