import { Container } from 'typedi';
import { GRPCServer } from '../grpc.server';
import { GRPCClient } from '../grpc.client';
import { RPCTransferEvent } from '../services/events.service';

async function listen() {
  const server = Container.get(GRPCServer);

  server.on('rpc-event', (req) => {
    console.log('request received', req);
    console.dir(req.parsedPayload());
  });
}

async function publish(reply = false) {
  const client = Container.get(GRPCClient);

  await client
    .publish(
      new RPCTransferEvent(
        'test',
        {
          time: Date.now(),
        },
        reply,
      ),
    )
    .then((res) => {
      console.log('response received', res.parsedPayload());
    });
}

listen()
  .then(() => publish())
  .then(() => publish(true));

publish().then(() => publish(true));
