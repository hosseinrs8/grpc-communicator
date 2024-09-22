import 'reflect-metadata';
import { Router } from './router/router';
import { TestController } from './test/test.controller';
import { GRPCServer } from './grpc.server';
import { Container } from 'typedi';

export async function bootstrap() {
  await Container.get(GRPCServer).boot();
  await Router.create([TestController]).boot();
}

bootstrap();
