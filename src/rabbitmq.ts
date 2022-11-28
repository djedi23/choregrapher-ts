import conf from '@djedi/configuration';
import { logCall, logger } from '@djedi/log';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { Channel } from 'amqplib';
import { FlowMessage } from './interfaces';

const createRabbitMQ = (graphId: string): ChannelWrapper | undefined => {
  try {
    const conn = amqp.connect(conf.get('queue:url') || 'amqp://localhost');
    const ch = conn.createChannel({
      setup: async (ch: Channel) => {
        // partof: #SPC-rabbitmq.exchangeByGraph
        ch.assertExchange(`${conf.get('queue:exchanges:events:name')}_${graphId}`, 'topic', {
          durable: true,
        });
        // partof: #SPC-rabbitmq.prefetch
        ch.prefetch(conf.get('queue:prefetch') || 8);
      },
    });
    return ch;
  } catch (err) {
    logger.error(err);
  }
};

interface ChannelDict {
  [graphId: string]: ChannelWrapper | undefined;
}
let channel: ChannelDict = {};

export const ch = (graphId: string) => {
  if (!channel[graphId]) channel[graphId] = createRabbitMQ(graphId);
  return channel[graphId];
};

/**
 * Prefix for the rabbiqmq routing key.
 */
export const busRoutingKeyPrefix = `${conf.get('queue:queues:events:routingkey') || 'flow'}.`;

export const sendMessage = logCall(
  async <T>(graphId: string, key: string, obj: FlowMessage<T>) =>
    // partof: #SPC-rabbitmq.exchange
    ch(graphId)?.publish(
      `${conf.get('queue:exchanges:events:name')}_${graphId}`,
      key,
      new Buffer(JSON.stringify(obj)),
      {
        persistent: true,
        contentType: 'application/json',
      }
    ) || logger.error("Can' send message", { key, data: obj }),
  { uuid: true, name: 'sendMessage', profiling: true }
);
