import { Container, Service } from 'typedi';
import { Logger } from '../tools/logger';

export interface RouterSubject {
  [key: string]: string;
}
export declare type RouterHandler<T> = (...args: Array<any>) => Promise<T>;
export declare type ControllerType<T = any> = new (...args: any[]) => T;

@Service()
export class Router {
  private readonly logger: Logger;
  private controllers: Array<ControllerType>;

  private readonly requestsSubjects: RouterSubject = {};
  private readonly requestHandlers: Map<string, RouterHandler<any>> = new Map();

  private readonly eventSubjects: RouterSubject = {};
  private readonly eventHandlers: Map<string, RouterHandler<any>> = new Map();

  private readonly streamSubjects: RouterSubject = {};
  private readonly streamHandlers: Map<string, RouterHandler<any>> = new Map();

  constructor() {
    this.logger = new Logger(this.constructor.name);
  }

  static get streamHandlers() {
    return Container.get(Router).streamHandlers;
  }

  static get streamSubjects() {
    return Container.get(Router).streamSubjects;
  }

  static get requestHandlers() {
    return Container.get(Router).requestHandlers;
  }

  static get requestSubject() {
    return Container.get(Router).requestsSubjects;
  }

  static get eventHandlers() {
    return Container.get(Router).eventHandlers;
  }

  static get eventSubjects() {
    return Container.get(Router).eventSubjects;
  }

  static create(controllers: Array<ControllerType>) {
    const router = Container.get(Router);
    router.controllers = controllers;
    return router;
  }

  async boot(): Promise<void> {
    this.logger.debug('boot request router');
    for (const controller of this.controllers) {
      this.parseControllers(controller);
    }
  }

  private parseControllers(controller: ControllerType) {
    this.logger.debug(`parseControllers`);
    const instance = Container.get(controller);
    const methods = Router.getMethods(instance);
    for (const methodName of methods) {
      this.logger.info('getting event/request type for method', {
        methodName,
      });
      const requestType = Reflect.getMetadata(
        'rpc.request.sub',
        instance,
        methodName,
      );
      const eventType = Reflect.getMetadata(
        'rpc.event.sub',
        instance,
        methodName,
      );
      const streamType = Reflect.getMetadata(
        'rpc.stream.sub',
        instance,
        methodName,
      );
      this.logger.info('got event/request type for method', {
        methodName,
        requestType,
        eventType,
      });
      if (requestType) {
        this.requestsSubjects[requestType] = requestType;
        this.requestHandlers.set(
          requestType,
          instance[methodName].bind(instance),
        );
      }
      if (eventType) {
        this.eventSubjects[eventType] = eventType;
        this.eventHandlers.set(eventType, instance[methodName].bind(instance));
      }
      if (streamType) {
        this.streamSubjects[streamType] = streamType;
        this.streamHandlers.set(
          streamType,
          instance[methodName].bind(instance),
        );
      }
    }
    return this.requestHandlers;
  }

  private static getMethods<T>(obj: T): Array<string> {
    const properties = new Set();
    let currentObj = obj;
    do {
      Object.getOwnPropertyNames(currentObj).forEach((item) =>
        properties.add(item),
      );
    } while ((currentObj = Object.getPrototypeOf(currentObj)));
    return ([...properties.keys()] as Array<string>).filter(
      (item) => typeof (obj as any)[item] === 'function',
    );
  }
}
