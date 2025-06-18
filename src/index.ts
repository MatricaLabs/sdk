// Re-export v1 as default for backward compatibility
export { MatricaOAuthClient, UserSession } from './v1';
export * from './shared/types';
export * from './shared/errors';
export * from './shared/utils/validation';

// Export v1 and v2 as namespaces
import * as v1 from './v1';
import * as v2 from './v2';

export { v1, v2 };