import {
  mergeBlogUpdate,
  validateCreateBlogInput,
} from '../../domain/entities/Blog.js';
import { NotFoundError } from '../../domain/errors/AppError.js';
import { assertPermission, PERMISSIONS } from '../../domain/rbac/permissions.js';

export class ListBlogsUseCase {
  constructor({ blogRepository }) {
    this.blogRepository = blogRepository;
  }

  async execute() {
    const blogs = await this.blogRepository.findAll();
    return { blogs };
  }
}

export class CreateBlogUseCase {
  constructor({ blogRepository }) {
    this.blogRepository = blogRepository;
  }

  async execute(actor, body) {
    assertPermission(actor, PERMISSIONS.BLOGS_WRITE);
    const data = validateCreateBlogInput(body);
    const blog = await this.blogRepository.create(data);
    return { blog };
  }
}

export class UpdateBlogUseCase {
  constructor({ blogRepository }) {
    this.blogRepository = blogRepository;
  }

  async execute(actor, id, body) {
    assertPermission(actor, PERMISSIONS.BLOGS_WRITE);
    const existing = await this.blogRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Không tìm thấy bài viết.');
    }
    const merged = mergeBlogUpdate(existing, body);
    const blog = await this.blogRepository.update(id, merged);
    return { blog };
  }
}

export class DeleteBlogUseCase {
  constructor({ blogRepository }) {
    this.blogRepository = blogRepository;
  }

  async execute(actor, id) {
    assertPermission(actor, PERMISSIONS.BLOGS_DELETE);
    const deleted = await this.blogRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Không tìm thấy bài viết.');
    }
    return { ok: true };
  }
}
