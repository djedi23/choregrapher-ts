import { Options } from '@djedi/event-sourcing';
import { storage } from '@djedi/object-storage';
import test, { ExecutionContext } from 'ava';
import { Filter, UpdateFilter, UpdateOptions, UpdateResult } from 'mongodb';
import { findOneNull } from './findOne';
import { findOneAndUpdateNull } from './findOneAndUpdate';
import { GraphInternal } from './GraphInternal';
import { FlowMessage, RunContext } from './interfaces';
import { Graph, Node } from './interfaces/Graph';
import { processNode } from './processNode';
import { busRoutingKeyPrefix } from './rabbitmq';

const makeContext = (t: ExecutionContext<unknown>, mkey: string): RunContext => ({
  updateOne: async <T = any>(
    collection: string,
    filter: Filter<T>,
    update: UpdateFilter<T>,
    options?: UpdateOptions,
    option?: Options
  ): Promise<UpdateResult> => {
    t.snapshot({ collection, filter, update, option }, `updateOne ${mkey}`);
    return {} as UpdateResult;
  },
  sendMessage: <A>(graphId: string, key: string, obj: FlowMessage<A>) => {
    t.snapshot({ graphId, key, obj }, `sendMessage ${mkey}`);
  },
  findOne: findOneNull,
  findOneAndUpdate: findOneAndUpdateNull,
  storage: storage({}, ''),
  yield: async (_output: any) => {},
});

test('one node one input', async (t) => {
  interface A {
    a: number;
  }
  interface O {
    o: number;
  }

  const fct = (a: A): O => {
    t.snapshot(a, 'function');
    return { o: 4 };
  };

  const node: Node<A, O> = { id: 'node', fct, input: ['a'], output: ['o'] };
  const graph: Graph = {
    id: 'graph1',
    nodes: [node],
    edges: [{ from: { node: 'start', output: 'init' }, to: { node: 'node', input: 'a' } }],
  };
  const graphinternal = new GraphInternal(graph);
  const data: FlowMessage<A> = {
    processId: '453',
    context: {},
    parameter: { a: 4 },
  };

  Date.now = () => 1534567890123;
  const context: RunContext = makeContext(t, '1 -> 1');
  //  const output = { o: 5 };

  t.deepEqual(
    await processNode(graphinternal, `${busRoutingKeyPrefix}node_a`, data, context),
    undefined
  );
});

test('two node one link', async (t) => {
  interface A {
    a: number;
  }
  interface O {
    o: number;
  }

  const fct = (a: A): O => {
    t.snapshot(a, 'function');
    return { o: 4 };
  };

  const node: Node<A, O> = { id: 'node', fct, input: ['a'], output: ['o'] };
  const node2: Node<A, O> = { id: 'node2', fct, input: ['a'] };
  const graph: Graph = {
    id: 'graph1',
    nodes: [node, node2],
    edges: [
      { from: { node: 'start', output: 'init' }, to: { node: 'node', input: 'a' } },
      { from: { node: 'node', output: 'o' }, to: { node: 'node2', input: 'a' } },
    ],
  };
  const graphinternal = new GraphInternal(graph);
  const data: FlowMessage<A> = {
    processId: '453',
    context: {},
    parameter: { a: 4 },
  };

  Date.now = () => 1534567890123;
  const context: RunContext = makeContext(t, '1 -> 1 -> 1');
  //  const output = { o: 5 };

  t.deepEqual(
    await processNode(graphinternal, `${busRoutingKeyPrefix}node_a`, data, context),
    undefined
  );
});
