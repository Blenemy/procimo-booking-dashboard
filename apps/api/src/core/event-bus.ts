import { EventEmitter } from 'node:events';
import type { AVAILABILITY_CHANGED_EVENT, AvailabilityChangedEvent } from '@courtly/shared';

export interface ServerEvent {
  type: typeof AVAILABILITY_CHANGED_EVENT;
  data: AvailabilityChangedEvent;
}

const PUBLISHED = 'published';
const CLOSED = 'closed';
const UNLIMITED_LISTENERS = 0;

export class EventBus {
  private readonly emitter = new EventEmitter().setMaxListeners(UNLIMITED_LISTENERS);

  publish(event: ServerEvent): void {
    this.emitter.emit(PUBLISHED, event);
  }

  subscribe(onEvent: (event: ServerEvent) => void, onClose: () => void): () => void {
    this.emitter.on(PUBLISHED, onEvent);
    this.emitter.once(CLOSED, onClose);
    return () => {
      this.emitter.off(PUBLISHED, onEvent);
      this.emitter.off(CLOSED, onClose);
    };
  }

  close(): void {
    this.emitter.emit(CLOSED);
  }
}
