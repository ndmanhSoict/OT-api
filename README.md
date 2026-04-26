# Express API Project (TypeScript)

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Production

```bash
npm start
```

Server will run on `http://localhost:3000`

## Project Structure

```
src/
├── app.ts              # Main application file
├── config/
│   └── database.ts     # Database configuration
├── routes/             # API routes
├── controllers/        # Business logic
└── middlewares/        # Custom middlewares
dist/                   # Compiled JavaScript output
```

## API Endpoints

- `GET /` - Welcome message
- `GET /api/health` - Health check

## Environment Variables

Create a `.env` file in the root directory with:
- `PORT` - Server port (default: 3000)
- `DB_HOST` - Database host
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `DB_PORT` - Database port
- `NODE_ENV` - Environment (development/production)
