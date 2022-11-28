import { Options } from '@djedi/event-sourcing';
import { storage } from '@djedi/object-storage';
import test from 'ava';
import { Filter, UpdateFilter, UpdateOptions, UpdateResult } from 'mongodb';
import { findOneNull } from './findOne';
import { findOneAndUpdateNull } from './findOneAndUpdate';
import { FlowContext, FlowMessage, RunContext } from './interfaces';
import { Node, Relation } from './interfaces/Graph';
import { nodeCall } from './nodeCall';

const runContext: RunContext = {
  updateOne: async <T = any>(
    _collection: string,
    _filter: Filter<T>,
    _update: UpdateFilter<T>,
    _options?: UpdateOptions,
    _option?: Options
  ): Promise<UpdateResult> => {
    return {} as UpdateResult;
  },
  sendMessage: <A>(_graphId: string, _key: string, _obj: FlowMessage<A>) => {},
  findOne: findOneNull,
  findOneAndUpdate: findOneAndUpdateNull,
  storage: storage({}, ''),
  yield: async (_output: any) => {},
};

test('node call no context', (t) => {
  interface A {
    a: number;
  }
  interface O {
    o: number;
  }

  const fct = ({ a }: A): O => ({ o: a });
  const node: Node<A, O> = { id: 'node', fct, input: ['a'], output: ['o'] };
  const parameter: A = { a: 1 };
  const relation = {
    from: { node: 'start', output: 'f1' },
    to: { node: 'node', input: 'a' },
  };

  t.deepEqual(nodeCall(node, parameter, relation, '', {}, runContext), { o: 1 });
});

test('node call context', (t) => {
  interface A {
    a: number;
    b: number;
  }
  interface O {
    o: number;
  }

  const fct = ({ a, b }: A): O => ({ o: a + b });
  const node: Node<A, O> = { id: 'node', fct, input: ['a', 'b'], output: ['o'] };
  const parameter = { a: 1 };
  const relation = {
    from: { node: 'start', output: 'f1' },
    to: { node: 'node', input: 'a' },
  };
  const context = { context: { node: { b: 2 } } };

  t.deepEqual(nodeCall(node, parameter, relation, '', context, runContext), { o: 3 });
});

/*
Context and parameter contains 'a'. 'a' from parameter is used.
*/
test('node call context shadow', (t) => {
  interface A {
    a: number;
    b: number;
  }
  interface O {
    o: number;
  }

  const fct = ({ a, b }: A): O => ({ o: a + b });
  const node: Node<A, O> = { id: 'node', fct, input: ['a', 'b'], output: ['o'] };
  const parameter = { a: 1 };
  const relation: Relation = {
    from: { node: 'start', output: 'f1' },
    to: { node: 'node', input: 'a' },
  };
  const context: FlowContext<A> = { context: { node: { a: 2, b: 2 } } };

  t.deepEqual(nodeCall(node, parameter, relation, '', context, runContext), { o: 3 });
});

test('node call two results', (t) => {
  interface A {
    a: number;
  }

  interface R {
    ob: number;
    oa: number;
  }

  const fct = ({ a }: A): R => ({ oa: 2, ob: 4 });
  const node: Node<A, R> = { id: 'node', fct, input: ['a'], output: ['oa', 'ob'] };
  const parameter: A = { a: 1 };
  const relation = {
    from: { node: 'start', output: 'f1' },
    to: { node: 'node', input: 'a' },
  };

  t.snapshot(nodeCall(node, parameter, relation, '', {}, runContext));
});

test('node call with partial parameters', (t) => {
  interface A {
    a: number;
    ab: number;
  }

  interface R {
    o: number;
  }

  const fct = ({ a }: A): R => ({ o: 2 });
  const node: Node<A, R> = { id: 'node', fct, input: ['a', 'ab'], output: ['o'] };
  const parameter: Partial<A> = { a: 1 };
  const relation = {
    from: { node: 'start', output: 'f1' },
    to: { node: 'node', input: 'a' },
  };

  t.is(nodeCall(node, parameter, relation, '', {}, runContext), undefined);
});
