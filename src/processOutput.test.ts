import { Options } from '@djedi/event-sourcing';
import { storage } from '@djedi/object-storage';
import test, { ExecutionContext } from 'ava';
import { Filter, UpdateFilter, UpdateOptions, UpdateResult } from 'mongodb';
import { findOneNull } from './findOne';
import { findOneAndUpdateNull } from './findOneAndUpdate';
import { GraphInternal } from './GraphInternal';
import { FlowMessage, RunContext } from './interfaces';
import { Graph, Node } from './interfaces/Graph';
import { processOutput } from './processOutput';

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
  storage: storage({}, 'testbucket'),
  yield: async (_output: any) => {},
});

test('one output to one input', async (t) => {
  interface A {
    a: number;
  }
  interface B {
    b: number;
  }
  interface O {
    o: number;
  }

  const node: Node<A, O> = { id: 'node', input: ['a'], output: ['o'] };
  const node2: Node<B, void> = { id: 'node2', input: ['b'] };
  // node( a ) -> o
  // node2( b ) -> void
  //  o -> b
  const graph: Graph = {
    id: 'graph1',
    nodes: [node, node2],
    edges: [
      {
        from: { node: 'node', output: 'o' },
        to: { node: 'node2', input: 'b' },
      },
    ],
  };
  const graphinternal = new GraphInternal(graph);
  const relation = {
    from: { node: 'start', output: 'f1' },
    to: { node: 'node', input: 'a' },
  };
  const data: FlowMessage<A> = {
    processId: '453',
    context: {},
    parameter: { a: 4 },
  };

  Date.now = () => 1534567890123;
  const context: RunContext = makeContext(t, '1 -> 1');
  const output = { o: 5 };

  t.deepEqual(await processOutput(graphinternal, node, output, data, relation, context), undefined);
});

test('one output to one input (input as object)', async (t) => {
  interface A {
    a: number;
  }
  interface B {
    b: number;
  }
  interface O {
    o: number;
  }

  const node: Node<A, O> = { id: 'node', input: [{ name: 'a' }], output: ['o'] };
  const node2: Node<B, void> = { id: 'node2', input: [{ name: 'b' }] };
  // node( a ) -> o
  // node2( b ) -> void
  //  o -> b
  const graph: Graph = {
    id: 'graph1',
    nodes: [node, node2],
    edges: [
      {
        from: { node: 'node', output: 'o' },
        to: { node: 'node2', input: 'b' },
      },
    ],
  };
  const graphinternal = new GraphInternal(graph);
  const relation = {
    from: { node: 'start', output: 'f1' },
    to: { node: 'node', input: 'a' },
  };
  const data: FlowMessage<A> = {
    processId: '453',
    context: {},
    parameter: { a: 4 },
  };

  Date.now = () => 1534567890123;
  const context: RunContext = makeContext(t, '1 -> 1 (o)');
  const output = { o: 5 };

  t.deepEqual(await processOutput(graphinternal, node, output, data, relation, context), undefined);
});

test('two outputs to two inputs in two nodes', async (t) => {
  interface A {
    a: number;
  }
  interface B {
    b: number;
  }
  interface C {
    c: number;
  }
  interface O {
    o1: number;
    o2: number;
  }

  const node: Node<A, O> = { id: 'node', input: ['a'], output: ['o1', 'o2'] };
  const node2: Node<B, void> = { id: 'node2', input: ['b'] };
  const node3: Node<C, void> = { id: 'node3', input: ['c'] };
  // node( a ) -> o
  // node2( b ) -> void
  //  o -> b
  const graph: Graph = {
    id: 'graph1',
    nodes: [node, node2, node3],
    edges: [
      {
        from: { node: 'node', output: 'o1' },
        to: { node: 'node2', input: 'b' },
      },
      {
        from: { node: 'node', output: 'o2' },
        to: { node: 'node3', input: 'c' },
      },
    ],
  };
  const graphinternal = new GraphInternal(graph);
  const relation = {
    from: { node: 'start', output: 'f1' },
    to: { node: 'node', input: 'a' },
  };
  const data: FlowMessage<A> = {
    processId: '453',
    context: {},
    parameter: { a: 4 },
  };

  Date.now = () => 1534567890123;
  const context: RunContext = makeContext(t, '2 -> 2');
  const output = { o1: 5, o2: 8 };

  t.deepEqual(await processOutput(graphinternal, node, output, data, relation, context), undefined);
});

test('one output to two inputs in two nodes', async (t) => {
  interface A {
    a: number;
  }
  interface B {
    b: number;
  }
  interface C {
    c: number;
  }
  interface O {
    o: number;
  }

  const node: Node<A, O> = { id: 'node', input: ['a'], output: ['o'] };
  const node2: Node<B, void> = { id: 'node2', input: ['b'] };
  const node3: Node<C, void> = { id: 'node3', input: ['c'] };
  const graph: Graph = {
    id: 'graph1',
    nodes: [node, node2, node3],
    edges: [
      {
        from: { node: 'node', output: 'o' },
        to: { node: 'node2', input: 'b' },
      },
      {
        from: { node: 'node', output: 'o' },
        to: { node: 'node3', input: 'c' },
      },
    ],
  };
  const graphinternal = new GraphInternal(graph);
  const relation = {
    from: { node: 'start', output: 'f1' },
    to: { node: 'node', input: 'a' },
  };
  const data: FlowMessage<A> = {
    processId: '453',
    context: {},
    parameter: { a: 4 },
  };

  Date.now = () => 1534567890123;
  const context: RunContext = makeContext(t, '1 -> 2');
  const output = { o: 5 };

  t.deepEqual(await processOutput(graphinternal, node, output, data, relation, context), undefined);
});

test('undefined output', async (t) => {
  interface A {
    a: number;
  }
  interface B {
    b: number;
  }
  interface O {
    o: number;
  }

  const node: Node<A, O> = { id: 'node', input: ['a'], output: ['o'] };
  const node2: Node<B, void> = { id: 'node2', input: ['b'] };
  // node( a ) -> o
  // node2( b ) -> void
  //  o -> b
  const graph: Graph = {
    id: 'graph1',
    nodes: [node, node2],
    edges: [
      {
        from: { node: 'node', output: 'o' },
        to: { node: 'node2', input: 'b' },
      },
    ],
  };
  const graphinternal = new GraphInternal(graph);
  const relation = {
    from: { node: 'start', output: 'f1' },
    to: { node: 'node', input: 'a' },
  };
  const data: FlowMessage<A> = {
    processId: '453',
    context: {},
    parameter: { a: 4 },
  };

  Date.now = () => 1534567890123;
  const context: RunContext = makeContext(t, '1 -> 1 undefined output');
  const output = undefined;

  t.deepEqual(await processOutput(graphinternal, node, output, data, relation, context), undefined);
});

// #SPC-processing.tst-routingToTransient
test('transient input', async (t) => {
  interface A {
    a: number;
  }
  interface B {
    b: number;
  }
  interface O {
    o: number;
  }

  const node: Node<A, O> = { id: 'node', input: ['a'], output: ['o'] };
  const node2: Node<B, void> = { id: 'node2', input: [{ name: 'b', transient: true }] };
  // node( a ) -> o
  // node2( b ) -> void
  //  o -> b
  const graph: Graph = {
    id: 'graph1',
    nodes: [node, node2],
    edges: [
      {
        from: { node: 'node', output: 'o' },
        to: { node: 'node2', input: 'b' },
      },
    ],
  };
  const graphinternal = new GraphInternal(graph);
  const relation = {
    from: { node: 'start', output: 'f1' },
    to: { node: 'node', input: 'a' },
  };
  const data: FlowMessage<A> = {
    processId: '453',
    context: {},
    parameter: { a: 4 },
  };

  Date.now = () => 1534567890123;
  const context: RunContext = makeContext(t, '1 -> 1 transient input');
  const output = { o: 5 };

  t.deepEqual(await processOutput(graphinternal, node, output, data, relation, context), undefined);
});
