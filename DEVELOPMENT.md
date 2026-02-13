# Development Guidelines




# Prisma
```bash
npm install --save-dev prisma dotenv
npm install @prisma/client
npx prisma init --datasource-provider postgresql 
```

```bash
npx prisma migrate dev --name init # Create new migration
npx prisma migrate deploy
```
