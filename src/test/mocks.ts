import { vi } from 'vitest';

/**
 * Mock Redis client for testing
 */
export class MockRedis {
  private store: Map<string, { value: string; expiry?: number }> = new Map();

  async set(
    key: string,
    value: string,
    options?: { px?: number }
  ): Promise<string> {
    const expiry = options?.px ? Date.now() + options.px : undefined;
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;

    // Check if expired
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  // Utility methods for testing
  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  has(key: string): boolean {
    return this.store.has(key);
  }
}

/**
 * Create a mock Redis instance
 */
export const createMockRedis = (): MockRedis => {
  return new MockRedis();
};

/**
 * Mock SendGrid mail service
 */
export const createMockSendGrid = () => {
  const send = vi.fn().mockResolvedValue([{ statusCode: 202 }]);
  const setApiKey = vi.fn();

  return {
    send,
    setApiKey,
    MailService: class {
      send = send;
      setApiKey = setApiKey;
    }
  };
};
