import { updateOne } from '@djedi/event-sourcing';
import { logger } from '@djedi/log';
import { v4 as uuid } from 'uuid';
import { FlowContext, FlowMessage, FlowRun } from './interfaces';
import { Graph, Relation } from './interfaces/Graph';
import { sendMessage } from './rabbitmq';

export const startProcess = <T = any>(graph: Graph, parameter: T, context: FlowContext<T> = {}) => {
  const processId = uuid();
  if (!context.labels) context.labels = {};
  graph.edges.forEach(async (relation: Relation) => {
    try {
      if (relation.from.node === 'start') {
        const p: any = {};
        if (relation.to.input && relation.from.output) {
          p[relation.to.input] = (parameter as any)[relation.from.output];

          await updateOne<FlowRun<T>>(
            'runs',
            { processId },
            {
              $set: {
                processId,
                graphId: graph.id,
                timestamp: new Date(),
              },
              $addToSet: {
                outputs: {
                  processId,
                  output: relation.from,
                  parameter: (parameter as any)[relation.from.output],
                  timestamp: new Date(),
                  context,
                },
              },
            },
            { upsert: true }
          );
        }
        await sendMessage(graph.id, `flow.${relation.to.node}_${relation.to.input}`, {
          processId,
          parameter: p,
          context,
        } as FlowMessage<T>);
      }
    } catch (error) {
      logger.error(`error in startProcess: ${(error as Error).message}`, {
        error,
        processId,
        relation,
        parameter,
        context,
      });
    }
  });
};
