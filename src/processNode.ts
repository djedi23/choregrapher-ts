import { fetchParameters } from './fetchParameters';
import { GraphInternal } from './GraphInternal';
import { FlowContext, FlowMessage, RunContext } from './interfaces';
import { Node } from './interfaces/Graph';
import { nodeCall } from './nodeCall';
import { processOutput } from './processOutput';

/**
 * Process nodes according to the data received.
 * The bus receiced data then we find the nodes to process and call them.
 *
 * @param graph the graph
 * @param routingKey routing key used to find node
 * @param data data of the message
 * @param context the execution context
 */
export const processNode = async <T>(
  graph: GraphInternal,
  routingKey: string,
  data: FlowMessage<T>,
  context: RunContext
) => {
  const relations = graph.relationByDestination(routingKey);
  relations?.forEach((relation) => {
    const nodeName = relation.to.node;
    // Find the nodes connected to this relation
    const nodes: Array<Node<T, any>> | undefined = graph.node(nodeName);

    // partof: #SPC-processing.multipleNodesPerInput
    nodes?.forEach(async (node) => {
      let parameters: Partial<T> = data.parameter;
      if (node.input && node.input?.length > 1) {
        const [_dummy, variable] = routingKey.split('_');
        // partof: #SPC-processing.missingInput
        parameters = {
          ...(await fetchParameters(
            data.processId,
            variable as keyof T,
            data.parameter,
            node,
            graph,
            context
          )),
          ...parameters,
        };
      }

      // parameter contains an object
      // partof: #SPC-processing.callAction
      const nodeOutputs = await nodeCall(
        node,
        parameters,
        relation,
        data.processId,
        data.context || {},
        {
          ...context,
          // partof: #SPC-processing.streamableOutput
          yield: async <R>(output: any, fcontext?: FlowContext<R>) =>
            processOutput(
              graph,
              node,
              output,
              { ...data, context: { ...data.context, labels: fcontext?.labels } },
              relation,
              context
            ),
        }
      );
      processOutput(graph, node, nodeOutputs, data, relation, context);
    });
  });
};
