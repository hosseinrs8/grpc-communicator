import { Container, Service } from 'typedi';
import { loadSync, PackageDefinition } from '@grpc/proto-loader';
import { EventsProto, EventsService } from '../services/events.service';
import { loadPackageDefinition, ServiceDefinition } from '@grpc/grpc-js';
import { GRPCIdentity } from './identity';
import EventEmitter from 'node:events';
import { Logger } from '../tools/logger';
import { Configs } from '../tools/configs';

@Service()
export abstract class GRPC extends EventEmitter {
  protected readonly logger: Logger;
  protected readonly config: GRPCIdentity;
  protected service: ServiceDefinition<EventsService>;

  protected constructor() {
    super();
    this.logger = new Logger(this.constructor.name);
    this.config = Container.get(Configs).get<GRPCIdentity>('grpc');
    this.loadService();
  }

  private loadService() {
    const packageDefinition: PackageDefinition = loadSync(
      this.config.protoPath,
      {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    );
    const proto: EventsProto = loadPackageDefinition(
      packageDefinition,
    ) as unknown as EventsProto;
    this.service = proto.communication.Events.service;
  }

  protected abstract boot(): void;
}
