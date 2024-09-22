import { RPCTransferEvent } from '../../services/events.service';
import { RouterHandler, Router } from '../router';
import { ServerWritableStream } from '@grpc/grpc-js';
import { Logger } from '../../tools/logger';

export class RPCStream {
  private readonly logger: Logger;

  private readonly stream: ServerWritableStream<
    RPCTransferEvent,
    RPCTransferEvent
  >;
  private readonly data: RPCTransferEvent;
  private handler: RouterHandler<any>;

  constructor(
    data: RPCTransferEvent,
    stream: ServerWritableStream<RPCTransferEvent, RPCTransferEvent>,
  ) {
    this.stream = stream;
    this.data = data;

    this.logger = new Logger(this.constructor.name);
  }

  send(req: RPCTransferEvent): boolean {
    this.logger.debug('send rpc stream', { subject: req.subject });
    return this.stream.write(req);
  }

  route(): Promise<any> {
    this.logger.debug('route rpc stream', { data: this.data });
    this.checkSubject();
    this.pickHandler();
    return this.handler(this.data.parsedPayload(), this);
  }

  end() {
    this.logger.debug('end rpc stream', { data: this.data });
    return this.stream.end();
  }

  private checkSubject() {
    if (!Router.streamSubjects[this.data.subject]) {
      this.logger.error('invalid subject');
      throw new Error('InvalidSubject');
    }
  }

  private pickHandler() {
    const handler = Router.streamHandlers.get(this.data.subject);
    if (!handler) {
      this.logger.error('no handler registered for subject', {
        subject: this.data.subject,
      });
      throw new Error('NoHandlerRegistered');
    }
    this.handler = handler;
  }
}
