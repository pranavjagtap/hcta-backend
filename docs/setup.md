mkdir smartbiz-backend && cd smartbiz-backend

# Initialize npm and install dependencies

npm init -y

# Install backend dependencies

npm install --save express mongoose dotenv zod firebase-admin cors pino

# Install dev dependencies

npm install --save-dev typescript ts-node-dev @types/node @types/express @types/cors @types/mongoose jest ts-jest supertest @types/jest

# Initialize TypeScript

npx tsc --init

# Create project structure

mkdir src
cd src
mkdir api
mkdir controllers
mkdir services
mkdir models
mkdir middlewares
mkdir config
mkdir utils
mkdir types
cd ..
type nul > src\app.ts
type nul > src\server.ts
type nul > .env.example
type nul > .gitignore
type nul > README.md
