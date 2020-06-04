FROM node:alpine
WORKDIR '/app'
# Re-install in case of changes, else use cache  
COPY ./package.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "start"]