import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import copyrightRoutes from './routes/copyright.routes';
import stakeholderRoutes from './routes/stakeholder.routes';
import craftVillageRoutes from './routes/craftVillage.routes';
import trademarkRoutes from './routes/trademark.routes';
import geographicalIndicationRoutes from './routes/geographicalIndication.routes';
import inventionRoutes from './routes/invention.routes';
import industrialDesignRoutes from './routes/industrialDesign.routes';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Swagger UI
const swaggerDocument = yaml.load(
  fs.readFileSync(path.join(__dirname, '../swagger.yaml'), 'utf8')
) as object;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Welcome to Express API' });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/copyrights', copyrightRoutes);
app.use('/api/stakeholders', stakeholderRoutes);
app.use('/api/craft-villages', craftVillageRoutes);
app.use('/api/trademarks', trademarkRoutes);
app.use('/api/geographical-indications', geographicalIndicationRoutes);
app.use('/api/inventions', inventionRoutes);
app.use('/api/industrial-designs', industrialDesignRoutes);

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
