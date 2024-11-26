# Dockerfile
# renamailer

FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --silent

COPY . .

# Install PM2 globally
RUN npm install -g pm2

RUN apt-get update -y
RUN apt-get upgrade -y
RUN apt-get install -y vim


EXPOSE 3030

# CMD [ "node", "server.js" ]
# CMD [ "npm", "start" ]
CMD ["pm2-runtime", "ecosystem.config.cjs"]