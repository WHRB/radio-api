FROM node:24
WORKDIR /app
ADD package.json /app
ADD package-lock.json /app
RUN npm install --omit=dev --ignore-scripts
ADD . /app/

CMD ["npm", "start"]
