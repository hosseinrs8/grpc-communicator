import { Container, Service } from 'typedi';
import { RPCTransferEvent } from '../../services/events.service';
import { RouterHandler, Router } from '../router';
import { GRPCClient } from '../../grpc.client';
import { Logger } from '../../tools/logger';

@Service({ transient: true })
export class RPCRequest {
  private readonly logger: Logger;

  private data: RPCTransferEvent;
  private handler: RouterHandler<any>;

  constructor() {
    this.logger = new Logger(this.constructor.name);
  }

  static send(req: RPCTransferEvent): Promise<any> {
    return Container.get(RPCRequest).send(req);
  }

  static route(req: RPCTransferEvent): Promise<any> {
    return Container.get(RPCRequest).route(req);
  }

  send<T>(req: RPCTransferEvent): Promise<T> {
    this.logger.debug('send rpc request', { subject: req.subject });
    req.reply = true;
    return Container.get(GRPCClient)
      .publish(req)
      .then(({ payload }) => JSON.parse(payload) as T);
  }

  route(req: RPCTransferEvent): Promise<any> {
    this.logger.debug('route rpc request', { subject: req.subject });
    this.data = req;
    this.checkSubject();
    this.pickHandler();
    return this.handler(req.parsedPayload());
  }

  private checkSubject() {
    if (!Router.requestSubject[this.data.subject]) {
      this.logger.error('invalid subject');
      throw new Error('InvalidSubject');
    }
  }

  private pickHandler() {
    const handler = Router.requestHandlers.get(this.data.subject);
    if (!handler) {
      this.logger.error('no handler registered for subject', {
        subject: this.data.subject,
      });
      throw new Error('NoHandlerRegistered');
    }
    this.handler = handler;
  }
}
