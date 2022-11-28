import conf from '@djedi/configuration';
import { updateOne } from '@djedi/event-sourcing';
import { logger } from '@djedi/log';
import { storage } from '@djedi/object-storage';
import { Channel, ConsumeMessage, Replies } from 'amqplib';
import { findOne } from './findOne';
import { findOneAndUpdate } from './findOneAndUpdate';
import { GraphInternal } from './GraphInternal';
import { FlowMessage } from './interfaces';
import { Context, Graph, InputField } from './interfaces/Graph';
import { processNode } from './processNode';
import { busRoutingKeyPrefix, ch, sendMessage } from './rabbitmq';

/**
 * Build and register a flow graph.
 * @param graph the graph
 * @param functionMap maps of node ids to function
 */
export const addGraph = <T = any>(
  graph: Graph,
  functionMap?: Map<string, (param: any, context?: Context<any, any>) => any>
) => {
  const ginternal = new GraphInternal(graph, functionMap, busRoutingKeyPrefix);

  ch(graph.id)?.addSetup(async (chan: Channel) => {
    try {
      const consumer = async (msg: ConsumeMessage | null) => {
        if (msg === null) return;
        try {
          const data: FlowMessage<T> = JSON.parse(msg.content.toString()) as FlowMessage<T>;
          const key = msg.fields.routingKey;
          const [prefixRoutingKey, relationRoutingKey] = key.split('.'); // kepps only the two first part of the routing key
          const routingKey = `${prefixRoutingKey}.${relationRoutingKey}`;

          await processNode(ginternal, routingKey, data, {
            sendMessage,
            updateOne,
            findOne,
            findOneAndUpdate,
            storage: storage(conf.get('storage:connection'), conf.get('storage:bucket')),
            yield: async (_output: any) => {
              throw new Error('function not implemented');
            },
          });
          chan.ack(msg);
        } catch (err) {
          console.error(err);
          logger.error({ message: err });
          chan.nack(msg);
        }
      };

      await Promise.all(
        graph.nodes.map(async (node) => {
          if (node.fct) {
            // partof: #SPC-rabbitmq.nodeHaveQueue
            const queue = await (chan.assertQueue(
              `${conf.get('queue:queues:events:name')}_${node.id}`,
              { durable: true }
            ) as unknown as Promise<Replies.AssertQueue>);
            if (node.input)
              await Promise.all(
                node.input.map(
                  (input) =>
                    chan.bindQueue(
                      queue.queue,
                      // partof: #SPC-rabbitmq.inputBindTopic
                      `${conf.get('queue:exchanges:events:name')}_${graph.id}`,
                      `${busRoutingKeyPrefix}${node.id}_${String(
                        (input as InputField<T>).name || input
                      )}`
                    ) as unknown as Promise<Replies.Empty>
                )
              );
            chan.consume(queue.queue, consumer);
          }
        })
      );
    } catch (err) {
      logger.error(err);
    }
  });
  return ginternal;
};
