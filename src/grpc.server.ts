import { Service } from 'typedi';
import {
  Metadata,
  sendUnaryData,
  Server,
  ServerCredentials,
  ServerUnaryCall,
  ServiceError,
  ServerWritableStream,
} from '@grpc/grpc-js';
import { RPCTransferEvent, EventAcknowledge } from './services/events.service';
import { GRPC } from './core/grpc.service';
import { Status } from '@grpc/grpc-js/build/src/constants';
import { RPCRequest } from './router/entities/rpc.request';
import { RPCEvent } from './router/entities/rpc.event';
import { RPCStream } from './router/entities/rpc.stream';

@Service()
export class GRPCServer extends GRPC {
  private server: Server;

  constructor() {
    super();
  }

  boot(): Promise<this> {
    const { serverHost, localPort } = this.config;
    this.logger.debug('create gRPC server', {
      port: localPort,
      host: serverHost,
    });
    this.server = new Server();
    this.server.addService(this.service, {
      handle: this.handle.bind(this),
      handleStream: this.handleStream.bind(this),
    });
    return new Promise((resolve, reject) => {
      this.server.bindAsync(
        [serverHost, localPort].join(':'),
        ServerCredentials.createInsecure(),
        (error, port) => {
          if (error) {
            this.logger.error('error in gRPC server boot', { error });
            reject(error);
          }
          this.server.start(); // seems deprecated, remove with caution
          this.logger.info(`server running on address: ${serverHost}:${port}`);
          resolve(this);
        },
      );
    });
  }

  private handleStream(
    call: ServerWritableStream<RPCTransferEvent, RPCTransferEvent>,
  ) {
    const { request } = call;
    this.logger.debug('handle stream', { sub: request.subject });
    call.on('error', (error) => {
      this.logger.error('stream error', { sub: request.subject, error });
    });
    call.on('end', () => {
      this.logger.info('stream end', { sub: request.subject });
    });
    return Promise.resolve(
      new RPCStream(
        new RPCTransferEvent(request.subject, request.payload, request.reply),
        call,
      ).route(),
    );
  }

  private handle(
    call: ServerUnaryCall<RPCTransferEvent, EventAcknowledge>,
    callback: sendUnaryData<EventAcknowledge>,
  ): void {
    let { request } = call;
    request = new RPCTransferEvent(
      request.subject,
      request.payload,
      request.reply,
    );
    this.logger.debug('handle gRPC event', { event: request });
    if (request.reply) {
      this.handleRequest(request)
        .then((res) => callback(null, new EventAcknowledge(request, res)))
        .catch((e) => {
          this.logger.error('error in gRPC request handling', { error: e });
          const error = this.constructError(e);
          return callback(
            error,
            new EventAcknowledge(request, undefined, error),
          );
        });
      return;
    }
    this.handleEvent(request).catch((e) => {
      this.logger.error('error in gRPC event handling', { error: e });
      const error = this.constructError(e);
      return callback(error, new EventAcknowledge(request, undefined, error));
    });
    return callback(null, new EventAcknowledge(request, { time: Date.now() }));
  }

  private handleRequest(request: RPCTransferEvent): Promise<any> {
    this.logger.debug('handle gRPC request', { request });
    return Promise.resolve(RPCRequest.route(request));
  }

  private handleEvent(request: RPCTransferEvent): Promise<any> {
    this.logger.debug('handle gRPC event', { request });
    return Promise.resolve(RPCEvent.route(request));
  }

  private constructError(e: unknown): ServiceError {
    return {
      ...(e as Error),
      code: Status.UNKNOWN,
      details: '',
      metadata: new Metadata(),
    };
  }
}
