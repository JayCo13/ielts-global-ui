FROM node:20-alpine as build

# Add Python, build dependencies, and Chromium (used by react-snap to
# pre-render each route to static HTML at build time for SEO / crawlability).
RUN apk add --no-cache python3 make g++ \
    chromium nss freetype harfbuzz ca-certificates ttf-freefont

# Don't let puppeteer (react-snap's dependency) download its own Chromium — the
# bundled build does not run on Alpine. Use the system Chromium installed above.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
# Modified npm install command to handle dependency conflicts
RUN npm install --legacy-peer-deps --force

COPY . .

# Point react-snap at the system Chromium for this (Alpine) build only. The
# committed package.json stays portable (no hardcoded path) so local macOS
# builds use puppeteer's bundled Chromium automatically. If prerender fails for
# any reason the `postbuild` script swallows the error and the normal CRA build
# is shipped, so this step can never break the deploy.
RUN node -e "const fs=require('fs');const p=require('./package.json');p.reactSnap=Object.assign({},p.reactSnap,{puppeteerExecutablePath:'/usr/bin/chromium-browser'});fs.writeFileSync('./package.json',JSON.stringify(p,null,2));"

RUN npm run build

FROM nginx:alpine as production
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]