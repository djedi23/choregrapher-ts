import { Event, Options } from '@djedi/event-sourcing';
import { storage } from '@djedi/object-storage';
import test, { ExecutionContext } from 'ava';
import { Filter, FindOptions, UpdateFilter, UpdateOptions, UpdateResult } from 'mongodb';
import { fetchParameters } from './fetchParameters';
import { findOneAndUpdateNull } from './findOneAndUpdate';
import { GraphInternal } from './GraphInternal';
import { FlowMessage, RunContext } from './interfaces';
import { Graph, Node } from './interfaces/Graph';

const makeContext = (t: ExecutionContext<unknown>, mkey: string): RunContext => {
  let i = 0;

  return {
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
    findOne: async <T = Event<FlowMessage<any>>>(
      collection: string,
      filter: Filter<T>,
      _options?: FindOptions<T>,
      _option?: Options | undefined
    ): Promise<T | null> => {
      t.is(collection, 'events');
      i++;
      switch (i) {
        case 1:
          t.deepEqual(filter, {
            collection: 'runs',
            filter: { processId: '453' },
            type: 'updateOne',
            'update._push.outputs.output': {
              node: 'node3',
              output: 'oo',
            },
          } as Filter<T>);
          return { update: { _push: { outputs: { parameter: { aa: 12 } } } } } as any;
        case 2:
          t.deepEqual(filter, {
            collection: 'runs',
            filter: { processId: '453' },
            type: 'updateOne',
            'update._push.outputs.output': {
              node: 'node2',
              output: 'o',
            },
          } as Filter<T>);
          return { update: { _push: { outputs: { parameter: { bb: 5 } } } } } as any;
      }
      return null;
    },
    findOneAndUpdate: findOneAndUpdateNull,
    storage: storage({}, ''),
    yield: async (_output: any) => {},
  };
};

test('Fetch 2 parameters', async (t) => {
  interface A {
    a: number;
    b: number;
  }

  const node: Node<A, A> = { id: 'node', input: ['a', 'b'], output: ['a'] };
  const graph: Graph = {
    id: 'graph1',
    nodes: [node],
    edges: [
      {
        from: { node: 'node3', output: 'oo' },
        to: { node: 'node', input: 'a' },
      },
      {
        from: { node: 'node2', output: 'o' },
        to: { node: 'node', input: 'b' },
      },
    ],
  };
  const graphinternal = new GraphInternal(graph);
  const context: RunContext = makeContext(t, '2 params');

  t.deepEqual(await fetchParameters('453', 'a', { a: 4, b: 6 }, node, graphinternal, context), {
    a: { aa: 12 },
    b: { bb: 5 },
  });
});

const makeContextkeyMatcher = (t: ExecutionContext<unknown>, mkey: string): RunContext => {
  let i = 0;

  return {
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
    findOne: async <T = Event<FlowMessage<any>>>(
      collection: string,
      filter: Filter<T>,
      _options?: FindOptions<T>,
      _option?: Options | undefined
    ): Promise<T | null> => {
      t.is(collection, 'events');
      i++;
      switch (i) {
        case 1:
          t.deepEqual(filter, {
            collection: 'runs',
            filter: { processId: '453' },
            type: 'updateOne',
            'update._push.outputs.output': {
              node: 'node3',
              output: 'oo',
            },
            'update._push.outputs.parameter.key': 'mykey',
          } as Filter<T>);
          return { update: { _push: { outputs: { parameter: { aa: 12 } } } } } as any;
        case 2:
          t.deepEqual(filter, {
            collection: 'runs',
            filter: { processId: '453' },
            type: 'updateOne',
            'update._push.outputs.output': {
              node: 'node2',
              output: 'o',
            },
            'update._push.outputs.parameter.key': 'mykey',
          } as Filter<T>);
          return { update: { _push: { outputs: { parameter: { bb: 5 } } } } } as any;
      }
      return null;
    },
    findOneAndUpdate: findOneAndUpdateNull,
    storage: storage({}, ''),
    yield: async (_output: any) => {},
  };
};

test('Fetch 2 parameters key matcher', async (t) => {
  interface Value {
    value: number;
    key: string;
  }

  interface A {
    a: Value;
    b: Value;
  }

  const node: Node<A, A> = {
    id: 'node',
    input: ['a', 'b'],
    output: ['a'],
    inputMatching: { type: 'keyEquals', key: 'key' },
  };
  const graph: Graph = {
    id: 'graph1',
    nodes: [node],
    edges: [
      {
        from: { node: 'node3', output: 'oo' },
        to: { node: 'node', input: 'a' },
      },
      {
        from: { node: 'node2', output: 'o' },
        to: { node: 'node', input: 'b' },
      },
    ],
  };
  const graphinternal = new GraphInternal(graph);
  const context: RunContext = makeContextkeyMatcher(t, '2 params');

  t.deepEqual(
    await fetchParameters(
      '453',
      'a',
      { a: { value: 4, key: 'mykey' }, b: { value: 6, key: 'mykey' } },
      node,
      graphinternal,
      context
    ),
    {
      a: { aa: 12 },
      b: { bb: 5 },
    }
  );
});
