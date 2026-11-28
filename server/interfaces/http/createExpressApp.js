import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { ValidationError } from '../../domain/errors/AppError.js';
import { createAuthMiddlewares } from './middlewares/authMiddleware.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { AuthController } from './controllers/AuthController.js';
import { UserController } from './controllers/UserController.js';
import { ProductController } from './controllers/ProductController.js';
import { OrderController } from './controllers/OrderController.js';
import { PaymentController } from './controllers/PaymentController.js';
import { ContentController } from './controllers/ContentController.js';
import { createApiRouter } from './routes/apiRouter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '../../../public/uploads');

export function createExpressApp(container) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '6mb' }));
  app.use('/uploads', express.static(uploadsDir));

  const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype?.startsWith('image/')) cb(null, true);
      else cb(new ValidationError('Chỉ chấp nhận tệp hình ảnh.'));
    },
  });

  const authMiddlewares = createAuthMiddlewares({
    tokenService: container.services.tokenService,
    adminRepository: container.repositories.adminRepository,
  });

  const controllers = {
    auth: new AuthController(container.useCases),
    users: new UserController(container.useCases),
    products: new ProductController(container.useCases),
    orders: new OrderController(container.useCases),
    payments: new PaymentController({
      ...container.useCases,
      appBaseUrl: container.config.urls.appBaseUrl,
    }),
    content: new ContentController(container.useCases),
  };

  const apiRouter = createApiRouter({
    config: container.config,
    gatewayCapabilities: container.services.paymentGatewayFactory.getCapabilities(),
    authMiddlewares,
    uploadMiddleware,
    controllers,
  });

  app.use('/api', apiRouter);
  app.use(errorHandler);

  return app;
}
