import { Service } from 'typedi';
import EventEmitter from 'node:events';
import { OnRPCRequest } from '../router/decorators/on-request.service.decorator';
import { Logger } from '../tools/logger';

@Service()
export class TestController extends EventEmitter {
  private readonly logger: Logger;

  constructor() {
    super();
    this.logger = new Logger(this.constructor.name);
    this.on('test', () => {
      this.logger.info('got test event', { time: Date.now() });
    });
  }

  @OnRPCRequest('test')
  handleTest(data: { time: Date }) {
    this.logger.info('test handler called', { data });
    return { request: true, time: Date.now() };
  }
}
