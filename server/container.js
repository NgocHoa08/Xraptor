import { loadConfig } from './infrastructure/config/env.js';
import { ScryptPasswordHasher } from './infrastructure/security/ScryptPasswordHasher.js';
import { HmacTokenService } from './infrastructure/security/HmacTokenService.js';
import { LocalFileStorage } from './infrastructure/storage/LocalFileStorage.js';
import { SupabaseFileStorage } from './infrastructure/storage/SupabaseFileStorage.js';
import { VietQrGateway } from './infrastructure/payment/VietQrGateway.js';
import { VnpayGateway } from './infrastructure/payment/VnpayGateway.js';
import { SandboxOnlineGateway } from './infrastructure/payment/SandboxOnlineGateway.js';
import { PaymentGatewayFactory } from './infrastructure/payment/PaymentGatewayFactory.js';

import { createSqliteClient } from './infrastructure/database/sqlite/sqliteClient.js';
import { SqliteAdminRepository } from './infrastructure/database/sqlite/SqliteAdminRepository.js';
import { SqliteProductRepository } from './infrastructure/database/sqlite/SqliteProductRepository.js';
import { SqliteOrderRepository } from './infrastructure/database/sqlite/SqliteOrderRepository.js';
import { SqlitePaymentRepository } from './infrastructure/database/sqlite/SqlitePaymentRepository.js';
import { SqliteContactRepository } from './infrastructure/database/sqlite/SqliteContactRepository.js';
import { SqliteSubscriberRepository } from './infrastructure/database/sqlite/SqliteSubscriberRepository.js';
import { SqliteBlogRepository } from './infrastructure/database/sqlite/SqliteBlogRepository.js';

import { createSupabaseContext } from './infrastructure/database/supabase/supabaseClient.js';
import { SupabaseAdminRepository } from './infrastructure/database/supabase/SupabaseAdminRepository.js';
import { SupabaseProductRepository } from './infrastructure/database/supabase/SupabaseProductRepository.js';
import { SupabaseOrderRepository } from './infrastructure/database/supabase/SupabaseOrderRepository.js';
import { SupabasePaymentRepository } from './infrastructure/database/supabase/SupabasePaymentRepository.js';
import { SupabaseContactRepository } from './infrastructure/database/supabase/SupabaseContactRepository.js';
import { SupabaseSubscriberRepository } from './infrastructure/database/supabase/SupabaseSubscriberRepository.js';
import { SupabaseBlogRepository } from './infrastructure/database/supabase/SupabaseBlogRepository.js';

import {
  ChangePasswordUseCase,
  GetProfileUseCase,
  LoginUseCase,
} from './application/use-cases/AuthUseCases.js';
import {
  CreateUserUseCase,
  DeleteUserUseCase,
  GetRolesCatalogUseCase,
  ListUsersUseCase,
  UpdateUserUseCase,
} from './application/use-cases/UserUseCases.js';
import {
  CreateProductUseCase,
  DeleteProductUseCase,
  GetProductUseCase,
  ListProductsUseCase,
  UpdateProductUseCase,
} from './application/use-cases/ProductUseCases.js';
import {
  CreateOrderUseCase,
  DeleteOrderUseCase,
  ListOrdersUseCase,
  TrackOrdersUseCase,
  UpdateOrderStatusUseCase,
} from './application/use-cases/OrderUseCases.js';
import {
  ConfirmManualPaymentUseCase,
  CreatePaymentIntentUseCase,
  GetOrderPaymentUseCase,
  HandleSandboxPaymentUseCase,
  HandleVnpayCallbackUseCase,
  ListPaymentMethodsUseCase,
  ListPaymentsUseCase,
  RefundPaymentUseCase,
} from './application/use-cases/PaymentUseCases.js';
import {
  CreateContactUseCase,
  DeleteContactUseCase,
  ListContactsUseCase,
  UpdateContactStatusUseCase,
} from './application/use-cases/ContactUseCases.js';
import {
  CreateSubscriberUseCase,
  DeleteSubscriberUseCase,
  ListSubscribersUseCase,
} from './application/use-cases/SubscriberUseCases.js';
import {
  CreateBlogUseCase,
  DeleteBlogUseCase,
  ListBlogsUseCase,
  UpdateBlogUseCase,
} from './application/use-cases/BlogUseCases.js';
import { GetDashboardUseCase } from './application/use-cases/DashboardUseCases.js';
import { UploadImageUseCase } from './application/use-cases/MediaUseCases.js';

/**
 * Composition Root — wires Infrastructure implementations into Application Use Cases.
 * Supports passing overrides (e.g., `{ useSupabase: false, sqlitePath: ':memory:' }`) for isolated tests.
 */
export function createContainer(overrides = {}) {
  const config = loadConfig(overrides);

  // Security & Payment Gateways
  const passwordHasher = new ScryptPasswordHasher();
  const tokenService = new HmacTokenService(config.security.tokenSecret);

  const vietQrGateway = new VietQrGateway(config.vietqr);
  const vnpayGateway = new VnpayGateway(config.vnpay);
  const sandboxGateway = new SandboxOnlineGateway({
    signingSecret: config.security.paymentSigningSecret,
  });
  const paymentGatewayFactory = new PaymentGatewayFactory({
    vietQrGateway,
    vnpayGateway,
    sandboxGateway,
  });

  // Repositories & File Storage (Supabase vs SQLite)
  let adminRepository;
  let productRepository;
  let orderRepository;
  let paymentRepository;
  let contactRepository;
  let subscriberRepository;
  let blogRepository;
  let fileStorage;

  if (config.useSupabase) {
    const ctx = createSupabaseContext({
      url: config.supabase.url,
      serviceRoleKey: config.supabase.serviceRoleKey,
      passwordHasher,
      vietqr: config.vietqr,
    });
    adminRepository = new SupabaseAdminRepository(ctx);
    productRepository = new SupabaseProductRepository(ctx);
    orderRepository = new SupabaseOrderRepository(ctx);
    paymentRepository = new SupabasePaymentRepository(ctx);
    contactRepository = new SupabaseContactRepository(ctx);
    subscriberRepository = new SupabaseSubscriberRepository(ctx);
    blogRepository = new SupabaseBlogRepository(ctx);
    fileStorage = new SupabaseFileStorage({
      supabase: ctx.supabase,
      bucket: config.supabase.storageBucket,
    });
  } else {
    const db = createSqliteClient({
      sqlitePath: config.sqlitePath,
      isVercel: config.isVercel,
      passwordHasher,
      vietqr: config.vietqr,
    });
    adminRepository = new SqliteAdminRepository(db);
    productRepository = new SqliteProductRepository(db);
    orderRepository = new SqliteOrderRepository(db);
    paymentRepository = new SqlitePaymentRepository(db);
    contactRepository = new SqliteContactRepository(db);
    subscriberRepository = new SqliteSubscriberRepository(db);
    blogRepository = new SqliteBlogRepository(db);
    fileStorage = new LocalFileStorage({ isVercel: config.isVercel });
  }

  // Application Use Cases
  const useCases = {
    // Auth
    login: new LoginUseCase({ adminRepository, passwordHasher, tokenService }),
    getProfile: new GetProfileUseCase({ dbMode: config.dbMode }),
    changePassword: new ChangePasswordUseCase({ adminRepository, passwordHasher }),

    // Users & RBAC
    listUsers: new ListUsersUseCase({ adminRepository }),
    getRolesCatalog: new GetRolesCatalogUseCase(),
    createUser: new CreateUserUseCase({ adminRepository, passwordHasher }),
    updateUser: new UpdateUserUseCase({ adminRepository, passwordHasher }),
    deleteUser: new DeleteUserUseCase({ adminRepository }),

    // Products
    listProducts: new ListProductsUseCase({ productRepository }),
    getProduct: new GetProductUseCase({ productRepository }),
    createProduct: new CreateProductUseCase({ productRepository }),
    updateProduct: new UpdateProductUseCase({ productRepository }),
    deleteProduct: new DeleteProductUseCase({ productRepository }),

    // Orders
    createOrder: new CreateOrderUseCase({
      productRepository,
      orderRepository,
      paymentRepository,
      paymentGatewayFactory,
    }),
    trackOrders: new TrackOrdersUseCase({ orderRepository, paymentRepository }),
    listOrders: new ListOrdersUseCase({ orderRepository, paymentRepository }),
    updateOrderStatus: new UpdateOrderStatusUseCase({ orderRepository, paymentRepository }),
    deleteOrder: new DeleteOrderUseCase({ orderRepository }),

    // Payments
    listPaymentMethods: new ListPaymentMethodsUseCase({ paymentGatewayFactory }),
    createPaymentIntent: new CreatePaymentIntentUseCase({
      orderRepository,
      paymentRepository,
      paymentGatewayFactory,
    }),
    getOrderPayment: new GetOrderPaymentUseCase({ orderRepository, paymentRepository }),
    listPayments: new ListPaymentsUseCase({ paymentRepository }),
    handleVnpayCallback: new HandleVnpayCallbackUseCase({
      orderRepository,
      paymentRepository,
      paymentGatewayFactory,
    }),
    handleSandboxPayment: new HandleSandboxPaymentUseCase({
      orderRepository,
      paymentRepository,
      paymentGatewayFactory,
    }),
    confirmManualPayment: new ConfirmManualPaymentUseCase({
      orderRepository,
      paymentRepository,
    }),
    refundPayment: new RefundPaymentUseCase({ orderRepository, paymentRepository }),

    // Contacts
    createContact: new CreateContactUseCase({ contactRepository }),
    listContacts: new ListContactsUseCase({ contactRepository }),
    updateContactStatus: new UpdateContactStatusUseCase({ contactRepository }),
    deleteContact: new DeleteContactUseCase({ contactRepository }),

    // Subscribers
    createSubscriber: new CreateSubscriberUseCase({ subscriberRepository }),
    listSubscribers: new ListSubscribersUseCase({ subscriberRepository }),
    deleteSubscriber: new DeleteSubscriberUseCase({ subscriberRepository }),

    // Blogs
    listBlogs: new ListBlogsUseCase({ blogRepository }),
    createBlog: new CreateBlogUseCase({ blogRepository }),
    updateBlog: new UpdateBlogUseCase({ blogRepository }),
    deleteBlog: new DeleteBlogUseCase({ blogRepository }),

    // Dashboard & Media
    getDashboard: new GetDashboardUseCase({
      dbMode: config.dbMode,
      orderRepository,
      productRepository,
      paymentRepository,
      contactRepository,
      subscriberRepository,
      adminRepository,
    }),
    uploadImage: new UploadImageUseCase({ fileStorage }),
  };

  return {
    config,
    services: {
      passwordHasher,
      tokenService,
      paymentGatewayFactory,
      fileStorage,
    },
    repositories: {
      adminRepository,
      productRepository,
      orderRepository,
      paymentRepository,
      contactRepository,
      subscriberRepository,
      blogRepository,
    },
    useCases,
  };
}
