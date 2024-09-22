import { Container, Service } from 'typedi';
import {
  EventAcknowledge,
  RPCTransferEvent,
} from '../../services/events.service';
import { RouterHandler, Router } from '../router';
import { GRPCClient } from '../../grpc.client';
import { Logger } from '../../tools/logger';

@Service({ transient: true })
export class RPCEvent {
  private readonly logger: Logger;

  private data: RPCTransferEvent;
  private handler: RouterHandler<any>;

  constructor() {
    this.logger = new Logger(this.constructor.name);
  }

  static send(req: RPCTransferEvent): Promise<any> {
    return Container.get(RPCEvent).send(req);
  }

  static route(req: RPCTransferEvent): Promise<any> {
    return Container.get(RPCEvent).route(req);
  }

  send(req: RPCTransferEvent): Promise<EventAcknowledge> {
    this.logger.debug('send rpc event', { subject: req.subject });
    req.reply = false;
    return Container.get(GRPCClient).publish(req);
  }

  route(req: RPCTransferEvent): Promise<any> {
    this.logger.debug('route rpc event', { subject: req.subject });
    this.data = req;
    this.checkSubject();
    this.pickHandler();
    return this.handler(req.parsedPayload());
  }

  private checkSubject() {
    if (!Router.eventSubjects[this.data.subject]) {
      this.logger.error('invalid subject');
      throw new Error('InvalidSubject');
    }
  }

  private pickHandler() {
    const handler = Router.eventHandlers.get(this.data.subject);
    if (!handler) {
      this.logger.error('no handler registered for subject', {
        subject: this.data.subject,
      });
      throw new Error('NoHandlerRegistered');
    }
    this.handler = handler;
  }
}
