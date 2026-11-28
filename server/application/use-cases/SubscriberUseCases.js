import { validateSubscriberEmail } from '../../domain/entities/Contact.js';
import { assertPermission, PERMISSIONS } from '../../domain/rbac/permissions.js';

export class CreateSubscriberUseCase {
  constructor({ subscriberRepository }) {
    this.subscriberRepository = subscriberRepository;
  }

  async execute(email) {
    const cleaned = validateSubscriberEmail(email);
    return this.subscriberRepository.create(cleaned);
  }
}

export class ListSubscribersUseCase {
  constructor({ subscriberRepository }) {
    this.subscriberRepository = subscriberRepository;
  }

  async execute(actor) {
    assertPermission(actor, PERMISSIONS.SUBSCRIBERS_READ);
    const subscribers = await this.subscriberRepository.findAll();
    return { subscribers };
  }
}

export class DeleteSubscriberUseCase {
  constructor({ subscriberRepository }) {
    this.subscriberRepository = subscriberRepository;
  }

  async execute(actor, id) {
    assertPermission(actor, PERMISSIONS.SUBSCRIBERS_DELETE);
    await this.subscriberRepository.delete(id);
    return { ok: true };
  }
}
