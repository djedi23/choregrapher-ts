import { logCall } from '@djedi/log';
import { some } from 'lodash';
import { Context, Graph, InputField, Node, Relation } from './interfaces/Graph';

export class GraphInternal {
  private graphId: string;
  private nodes: Map<string, Array<Node<any, any>>> = new Map();
  private fromMap: Map<string, Relation[]> = new Map();
  private toMap: Map<string, Relation[]> = new Map();
  private prefixInternal: string;

  constructor(
    graph: Graph,
    functionMap?: Map<string, (param: any, context?: Context<any, any>) => any>,
    prefix = 'flow.'
  ) {
    this.prefixInternal = prefix;
    this.graphId = graph.id;
    graph.nodes.forEach((node) => {
      if (
        node.affinity?.type === 'nameNodeAffinity' &&
        functionMap?.get(node.affinity.name) !== undefined
      ) {
        node.fct = functionMap.get(node.affinity.name) as (
          param: any,
          context?: Context<any, any>
        ) => any;
      }
      if (node.fct)
        node.fct = logCall(node.fct, { uuid: true, level: 'debug', name: node.id, profiling: true });

      const nodes = this.nodes.get(node.id) || [];
      this.nodes.set(node.id, [...nodes, node]);
    });

    graph.edges.forEach((relation) => {
      // Transient inputs don't received the message.
      // partof: #SPC-processing.routingToTransient
      const toNodes = this.node(relation.to.node);
      const transient = some(toNodes, (node: Node<any, any>): boolean => {
        const nodeInput = node.input?.find(
          (input) => relation.to.input === String((input as InputField<any>).name || input)
        );
        return (nodeInput as InputField<any>).transient || false;
      });
      if (!transient) {
        // Destination is not transient. Normal processecing.
        const key = `${prefix}${relation.from.node}_${relation.from.output}`;
        const relations = this.fromMap.get(key) || [];
        this.fromMap.set(key, [...relations, relation]);
      }
      // Always back connecting to retrieve parameter (even transient ones)
      const keyTo = `${prefix}${relation.to.node}_${relation.to.input}`;
      const relationsTo = this.fromMap.get(keyTo) || [];
      this.toMap.set(keyTo, [...relationsTo, relation]);
    });
  }
  public node<P = any, T = any>(id?: string): Array<Node<P, T>> | undefined {
    if (id === undefined) return undefined;
    return this.nodes.get(id);
  }

  public relation(id: string): Relation[] | undefined {
    return this.fromMap.get(id);
  }

  /**
   * Get relations set by destination
   *
   * @param id the id of the form `${prefix}${relation.to.node}_${relation.to.input}`
   * @returns a set of relation
   */
  public relationByDestination(id: string): Relation[] | undefined {
    return this.toMap.get(id);
  }

  public prefix(): string {
    return this.prefixInternal;
  }

  public id(): string {
    return this.graphId;
  }
}
