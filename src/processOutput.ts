import { logger } from '@djedi/log';
import { GraphInternal } from './GraphInternal';
import { FlowContext, FlowMessage, FlowRun, RunContext } from './interfaces';
import { Node, Relation } from './interfaces/Graph';
import { busRoutingKeyPrefix } from './rabbitmq';

/**
 * Process the output of a node.
 * The outputs are recorded and then dispatch accross the graph
 *
 * @param graph the graph
 * @param node the node to process
 * @param output the output to process the format should be {out1: any, out2: any}
 * @param messageContent the content provided by rabbitmq
 * @param relation relation used for the log
 * @param context the execution context
 */
export const processOutput = async <T>(
  graph: GraphInternal,
  node: Node<any, any>,
  output: any | undefined,
  messageContent: FlowMessage<T>,
  relation: Relation,
  { sendMessage, updateOne }: RunContext
) => {
  if (node.output)
    node.output.forEach(async (outLabel) => {
      try {
        if (output !== undefined && output[outLabel] !== undefined) {
          // partof: #SPC-processing.node_outputprocessing
          if (!node.outputProcessing)
            // Set the default impl here to bypass the ? type
            node.outputProcessing = (
              output: any,
              _l: string | number | symbol,
              context: FlowContext<T>
            ) => [{ output, context }];

          node
            .outputProcessing(output[outLabel], outLabel, messageContent.context || {})
            .forEach(async ({ output, context }) => {
              // partof: #SPC-processing.saveOutput
              await updateOne<FlowRun<T>>(
                'runs',
                { processId: messageContent.processId },
                {
                  $push: {
                    outputs: {
                      processId: messageContent.processId,
                      output: { node: node.id, output: String(outLabel) },
                      parameter: output,
                      timestamp: new Date(Date.now()),
                      context,
                    },
                  },
                }
              );
              // partof: #SPC-processing.routingOutput
              const flowTo = graph.relation(`${graph.prefix()}${node.id}_${String(outLabel)}`) || [];
              //            console.log(node, flowTo, out, output);
              flowTo.forEach((destination) => {
                if (destination.to?.input) {
                  const parameter: { [k in string]: any } = {};
                  parameter[destination.to?.input] = output;
                  // partof: #SPC-processing.sendOutput
                  sendMessage(
                    graph.id(),
                    `${busRoutingKeyPrefix}${destination.to.node}_${destination.to.input}`,
                    {
                      ...messageContent,
                      context,
                      parameter,
                    }
                  );
                }
              });
            });
        }
      } catch (error) {
        logger.error(`${(error as Error).message}`, { error, messageContent, relation, node });
      }
    });
};
