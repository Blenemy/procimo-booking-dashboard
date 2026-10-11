import type { RequestHandler } from 'express';
import type { EventBus, ServerEvent } from '../../core/event-bus';
import { HTTP_STATUS } from '../../http/status';

const RECONNECT_DELAY_MS = 3_000;
const HEARTBEAT_INTERVAL_MS = 25_000;

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};

const frame = ({ type, data }: ServerEvent) => `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;

export function createEventsController({ events }: { events: EventBus }) {
  const stream: RequestHandler = (_req, res) => {
    res.writeHead(HTTP_STATUS.OK, SSE_HEADERS);
    res.write(`retry: ${RECONNECT_DELAY_MS}\n\n`);

    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), HEARTBEAT_INTERVAL_MS);
    const stop = () => {
      clearInterval(heartbeat);
      unsubscribe();
    };
    const unsubscribe = events.subscribe(
      (event) => res.write(frame(event)),
      () => {
        stop();
        res.end();
      },
    );
    res.on('close', stop);
  };

  return { stream };
}

export type EventsController = ReturnType<typeof createEventsController>;
