import { createContainer } from './container.js';
import { createExpressApp } from './interfaces/http/createExpressApp.js';

export const container = createContainer();
const app = createExpressApp(container);

export { createContainer, createExpressApp };
export default app;
