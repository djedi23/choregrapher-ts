import { size } from 'lodash';
import { FlowContext, RunContext } from './interfaces';
import { Node, Relation } from './interfaces/Graph';

export const nodeCall = <P = any, T = any>(
  node: Node<P, T>,
  parameter: Partial<P>,
  relation: Relation,
  processId: string,
  context: FlowContext<P>,
  runContext: RunContext
): T | Promise<T> | undefined => {
  if (node.fct) {
    // Merging parameter and context:
    // parameter = a:2 ; context = b:3 ==> result a:2,b:3
    const parameters = {
      ...(context?.context && context?.context[node.id]),
      ...parameter,
    } as P;
    if (node.input && node.input?.length === size(parameters as unknown as object)) {
      // partof: #SPC-processing.actionContext
      return node.fct(parameters, { ...node, relation, context, runContext, processId });
    }
  }
};
