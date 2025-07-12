# 100-jacker

 How to run

Backend

cd backend
npm install
node server.js

Frontend

cd frontend
npm install
npm run build

Copy frontend build to backend

rm -rf backend/dist
cp -r frontend/dist backend/dist

Start backend server (if not already running)

cd backend
node server.js

Open browser

Go to:


http://localhost:4000


4. Summary


Backend proxies requests and bypasses Cloudflare.

Frontend provides dashboard with attack vectors, file upload, cookie input, and logs.

Fully functional, easy to build and run.

Modular and extensible.
