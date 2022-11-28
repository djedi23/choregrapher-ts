import { EventUpdateOne } from '@djedi/event-sourcing';
import { Filter } from 'mongodb';
import { GraphInternal } from './GraphInternal';
import { FlowRun, NodeOutput, RunContext } from './interfaces';
import { InputField, Node } from './interfaces/Graph';

/**
 * Fetch the last parameter set of a node.
 * @param processId the current process
 * @param variable the parameter variable currently processed
 * @param parameter the parameter currently processed
 * @param node the actual node
 * @param graph the graph being processed
 */
export const fetchParameters = async <T>(
  processId: string,
  variable: keyof T,
  parameter: T,
  node: Node<T, any>,
  graph: GraphInternal,
  { findOne }: RunContext
): Promise<any> => {
  if (!node.input) return {};
  const params = await Promise.all(
    node.input.map(async (fko) => {
      //   // Example: cherche le premier argument
      // const fk = node.input && node.input[0];
      const fk: string = String((fko as InputField<T>).name || fko);
      const rel = graph.relationByDestination(`${graph.prefix()}${node.id}_${String(fk)}`);
      if (rel) {
        const queryFilter: Filter<EventUpdateOne<FlowRun<T>>> = {
          type: 'updateOne',
          collection: 'runs',
          filter: {
            processId,
          },
          'update._push.outputs.output': {
            node: rel[0].from.node, // FIXME iterate over array
            output: rel[0].from.output,
          },
        };

        // partof: #SPC-processing.inputMatching
        switch (node.inputMatching?.type) {
          case 'keyEquals': {
            // @ts-ignore
            queryFilter[`update._push.outputs.parameter.${node.inputMatching.key}`] = (
              parameter[variable] as any
            )[node.inputMatching.key];
            break;
          }
        }

        // Looking for the paramater value in the event list
        // @ts-ignore
        const outputEvent = await findOne<EventUpdateOne<FlowRun<T>>>('events', queryFilter, {
          sort: { timestamp: -1 },
        });
        //        console.log(rel, (outputEvent?.update._push?.outputs as NodeOutput<T>)?.parameter);
        return {
          key: fk,
          val: (outputEvent?.update._push?.outputs as NodeOutput<T>)?.parameter,
        };
      }
      return null;
    })
  );

  const paramObject: any = {};
  params.forEach((param) => {
    if (param === null) return;
    const { key, val } = param;
    if (val !== undefined) paramObject[key] = val;
  });

  return paramObject;
};
