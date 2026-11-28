import { ValidationError } from '../../domain/errors/AppError.js';
import { assertPermission, PERMISSIONS } from '../../domain/rbac/permissions.js';

export class UploadImageUseCase {
  constructor({ fileStorage }) {
    this.fileStorage = fileStorage;
  }

  async execute(actor, file) {
    assertPermission(actor, PERMISSIONS.MEDIA_UPLOAD);
    if (!file) {
      throw new ValidationError('Chưa chọn tệp hình ảnh.');
    }
    const url = await this.fileStorage.uploadImage(file);
    return { url };
  }
}
