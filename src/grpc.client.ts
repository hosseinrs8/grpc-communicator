import { Service } from 'typedi';
import { GRPC } from './core/grpc.service';
import {
  Client,
  credentials,
  makeGenericClientConstructor,
  ServiceClientConstructor,
} from '@grpc/grpc-js';
import {
  RPCTransferEvent,
  EventAcknowledge,
  EventsService,
} from './services/events.service';

export type EventsClient = Client & EventsService;

@Service()
export class GRPCClient extends GRPC {
  private client: EventsClient;

  constructor() {
    super();
  }

  boot() {
    const { clientHost, foreignPort } = this.config;
    this.logger.debug('create gRPC client', {
      port: foreignPort,
      host: clientHost,
    });
    const clientConstructor: ServiceClientConstructor =
      makeGenericClientConstructor(this.service, 'EventsService');
    this.client = new clientConstructor(
      [clientHost, foreignPort.toString()].join(':'),
      credentials.createInsecure(),
    ) as EventsClient;
  }

  publish(request: RPCTransferEvent): Promise<EventAcknowledge> {
    this.logger.debug('emit gRPC event', { request });
    return new Promise((resolve, reject) => {
      this.client.handle(request, (error, response) => {
        if (error) {
          this.logger.error('error from grpc server', { error });
          reject(error);
        } else {
          this.logger.debug('received grpc server acknowledge', { response });
          resolve(new EventAcknowledge(response));
        }
      });
    });
  }
}
