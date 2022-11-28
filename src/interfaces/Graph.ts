import { FlowContext, RunContext } from '.';
import { InputMatcher } from './InputMatcher';

export interface Context<P, T> extends Node<P, T> {
  processId: string;
  relation: Relation;
  context: FlowContext<P>;
  runContext: RunContext;
}

export interface Node<P, T> {
  id: string;
  name?: string;
  // partof: #SPC-node.nodeFunction
  fct?: (param: P, context: Context<P, T>) => T | Promise<T>;
  input?: Array<keyof P | InputField<P>>;
  output?: Array<keyof T>;
  // inputmatching is used to synchronized multiple inputs. fetchParameters can filter parameters according inputMatching.
  //  partof: #SPC-node.inputMatching
  inputMatching?: InputMatcher;
  // partof: #SPC-node.nodeAffinity
  affinity?: NodeAffinity;
  /** Offre la possiblité de casser une sortie en plusieurs sortie ou ajouter du contexte */
  outputProcessing?: (
    output: any,
    slotName: keyof T,
    context: FlowContext<P>
  ) => Array<ProcessedOutput<P>>;
}

export interface ProcessedOutput<P> {
  output: any;
  context: FlowContext<P>;
}

export interface InputField<T> {
  name: keyof T;
  /** this input don't trigger an action
   *  partof: SPC-processing.routingToTransient
   */
  transient?: boolean;
}

type NodeAffinity = NameNodeAffinity;

/** affinité par nom */
interface NameNodeAffinity {
  type: 'nameNodeAffinity';
  name: string;
}

interface NodeRef {
  node: string;
}

export interface OutputRef extends NodeRef {
  output?: string;
}

interface InputRef extends NodeRef {
  input?: string;
}

export interface Relation {
  /** Output ref we should listen */
  from: OutputRef;
  /** Connect the __from__ to the __to__  */
  to: InputRef;
}

/**
 *   Computing graph.
 */
export interface Graph {
  /** id of the graph */
  id: string;
  /** nodes of the graph */
  nodes: Array<Node<any, any>>;
  /** Relations between the nodes */
  edges: Relation[];
}

export interface GraphInDB extends Graph {
  createdAt?: Date;
  modifiedAt?: Date;
  version?: string;
}
