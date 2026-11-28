import {
  mergeProductUpdate,
  validateCreateProductInput,
} from '../../domain/entities/Product.js';
import { NotFoundError } from '../../domain/errors/AppError.js';
import { assertPermission, PERMISSIONS } from '../../domain/rbac/permissions.js';

export class ListProductsUseCase {
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  async execute(filters = {}) {
    const products = await this.productRepository.findAll(filters);
    return { products };
  }
}

export class GetProductUseCase {
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  async execute(id) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Không tìm thấy sản phẩm.');
    }
    return { product };
  }
}

export class CreateProductUseCase {
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  async execute(actor, body) {
    assertPermission(actor, PERMISSIONS.PRODUCTS_WRITE);
    const data = validateCreateProductInput(body);
    const product = await this.productRepository.create(data);
    return { product };
  }
}

export class UpdateProductUseCase {
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  async execute(actor, id, body) {
    assertPermission(actor, PERMISSIONS.PRODUCTS_WRITE);
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Không tìm thấy sản phẩm.');
    }
    const merged = mergeProductUpdate(existing, body);
    const product = await this.productRepository.update(id, merged);
    return { product };
  }
}

export class DeleteProductUseCase {
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  async execute(actor, id) {
    assertPermission(actor, PERMISSIONS.PRODUCTS_DELETE);
    const deleted = await this.productRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Không tìm thấy sản phẩm.');
    }
    return { ok: true };
  }
}
