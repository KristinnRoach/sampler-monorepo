import { NodeID } from '@/registry/NodeIDs';

export interface Message {
  readonly type: string;
  readonly senderId: NodeID;
}

export type MessageHandler<T> = (data: T) => void;

export interface MessageBus<T extends Message> {
  sendMessage(type: T['type'], data: Omit<T, 'type' | 'senderId'>): void;
  onMessage<K extends T['type']>(
    type: K,
    handler: MessageHandler<T>
  ): () => void;
}

export function createMessageBus<T extends Message>(
  senderId: NodeID
): MessageBus<T> {
  const handlers = new Map<string, Set<MessageHandler<T>>>();

  return {
    sendMessage(type, data) {
      const typeHandlers = handlers.get(type);
      if (typeHandlers) {
        const message = { type, senderId, ...data } as T;
        typeHandlers.forEach((handler) => handler(message));
      }
    },

    onMessage(type, handler) {
      if (!handlers.has(type)) {
        handlers.set(type, new Set());
      }
      const typeHandlers = handlers.get(type)!;
      typeHandlers.add(handler);
      return () => typeHandlers.delete(handler);
    },
  };
}
