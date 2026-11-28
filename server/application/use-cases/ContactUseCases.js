import {
  assertValidContactStatus,
  validateCreateContactInput,
} from '../../domain/entities/Contact.js';
import { NotFoundError } from '../../domain/errors/AppError.js';
import { assertPermission, PERMISSIONS } from '../../domain/rbac/permissions.js';

export class CreateContactUseCase {
  constructor({ contactRepository }) {
    this.contactRepository = contactRepository;
  }

  async execute(body) {
    const input = validateCreateContactInput(body);
    const contact = await this.contactRepository.create(input);
    return { contact };
  }
}

export class ListContactsUseCase {
  constructor({ contactRepository }) {
    this.contactRepository = contactRepository;
  }

  async execute(actor) {
    assertPermission(actor, PERMISSIONS.CONTACTS_READ);
    const contacts = await this.contactRepository.findAll();
    return { contacts };
  }
}

export class UpdateContactStatusUseCase {
  constructor({ contactRepository }) {
    this.contactRepository = contactRepository;
  }

  async execute(actor, id, status) {
    assertPermission(actor, PERMISSIONS.CONTACTS_UPDATE);
    assertValidContactStatus(status);
    const contact = await this.contactRepository.updateStatus(id, status);
    if (!contact) {
      throw new NotFoundError('Không tìm thấy liên hệ.');
    }
    return { contact };
  }
}

export class DeleteContactUseCase {
  constructor({ contactRepository }) {
    this.contactRepository = contactRepository;
  }

  async execute(actor, id) {
    assertPermission(actor, PERMISSIONS.CONTACTS_DELETE);
    const deleted = await this.contactRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Không tìm thấy liên hệ.');
    }
    return { ok: true };
  }
}
