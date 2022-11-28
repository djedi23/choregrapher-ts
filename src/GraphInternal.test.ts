import { logger } from '@djedi/log';
import test from 'ava';
import { GraphInternal } from './GraphInternal';
import { Graph, Node } from './interfaces/Graph';

interface Aa {
  ia: number;
}
interface Ab {
  ib: number;
}
interface Oa {
  oa: number;
}

const f1 = ({ ia }: Aa): Oa => ({ oa: ia * ia });
const n1: Node<Aa, Oa> = { id: 'f1', fct: f1, input: ['ia'], output: ['oa'] };
const f2 = ({ ib }: Ab): void => {
  logger.info(`*****   a ${ib}`);
};
const n2: Node<Ab, void> = { id: 'f2', fct: f2, input: ['ib'] };

// f1( ia ) -> oa
// f2( ib ) -> void
// new -> ia
// oa -> ib
const graph: Graph = {
  id: 'graph1',
  nodes: [n1, n2],
  edges: [
    {
      from: { node: 'start', output: 'f1' },
      to: { node: 'f1', input: 'ia' },
    },
    {
      from: { node: 'f1', output: 'oa' },
      to: { node: 'f2', input: 'ib' },
    },
  ],
};

test('node by id', (t) => {
  const g = new GraphInternal(graph);

  t.deepEqual(g.node('f1'), [n1]);
  t.deepEqual(g.node('f2'), [n2]);
  t.deepEqual(g.node('f3'), undefined);
  t.deepEqual(g.node(undefined), undefined);
});

test('relation by id', (t) => {
  const g = new GraphInternal(graph);

  t.deepEqual(g.relation('flow.start_f1'), [
    {
      from: { node: 'start', output: 'f1' },
      to: { node: 'f1', input: 'ia' },
    },
  ]);
  t.deepEqual(g.relation('flow.f1_oa'), [
    {
      from: { node: 'f1', output: 'oa' },
      to: { node: 'f2', input: 'ib' },
    },
  ]);
  t.deepEqual(g.relation('none'), undefined);
  //  t.deepEqual(g.relation(undefined), undefined);
});

test('relation by destination', (t) => {
  const g = new GraphInternal(graph);

  t.deepEqual(g.relationByDestination('flow.f1_ia'), [
    {
      from: { node: 'start', output: 'f1' },
      to: { node: 'f1', input: 'ia' },
    },
  ]);
  t.deepEqual(g.relationByDestination('flow.f2_ib'), [
    {
      from: { node: 'f1', output: 'oa' },
      to: { node: 'f2', input: 'ib' },
    },
  ]);
  t.deepEqual(g.relationByDestination('none'), undefined);
  //  t.deepEqual(g.relation(undefined), undefined);
});

test('node by id functionMap', (t) => {
  const f1 = ({ ia }: Aa): Oa => ({ oa: ia * ia });
  const n1: Node<Aa, Oa> = { id: 'f1', fct: f1, input: ['ia'], output: ['oa'] };
  const f2 = ({ ib }: Ab) => ({ a: ib + ib });
  const n2: Node<Ab, void> = {
    id: 'f2',
    input: ['ib'],
    affinity: { type: 'nameNodeAffinity', name: 'f2' },
  };

  const graph: Graph = {
    id: 'graph1',
    nodes: [n1, n2],
    edges: [],
  };

  const g = new GraphInternal(graph, new Map([['f2', f2]]));

  t.snapshot(g.node('f1'));
  t.snapshot(g.node('f2'));
  t.snapshot(g.node('f3'));
});

const n1o: Node<Aa, Oa> = { id: 'f1', input: [{ name: 'ia' }], output: ['oa'] };
const n2o: Node<Ab, void> = { id: 'f2', fct: f2, input: [{ name: 'ib' }] };

// f1( ia ) -> oa
// f2( ib ) -> void
// new -> ia
// oa -> ib
const graphInputObject: Graph = {
  id: 'graph1',
  nodes: [n1o, n2o],
  edges: [
    {
      from: { node: 'start', output: 'f1' },
      to: { node: 'f1', input: 'ia' },
    },
    {
      from: { node: 'f1', output: 'oa' },
      to: { node: 'f2', input: 'ib' },
    },
  ],
};

test('relation by id (object)', (t) => {
  const g = new GraphInternal(graphInputObject);

  t.deepEqual(g.relation('flow.start_f1'), [
    {
      from: { node: 'start', output: 'f1' },
      to: { node: 'f1', input: 'ia' },
    },
  ]);
  t.deepEqual(g.relation('flow.f1_oa'), [
    {
      from: { node: 'f1', output: 'oa' },
      to: { node: 'f2', input: 'ib' },
    },
  ]);
  t.deepEqual(g.relation('none'), undefined);
  //  t.deepEqual(g.relation(undefined), undefined);
});

test('relation by destination (object)', (t) => {
  const g = new GraphInternal(graph);

  t.deepEqual(g.relationByDestination('flow.f1_ia'), [
    {
      from: { node: 'start', output: 'f1' },
      to: { node: 'f1', input: 'ia' },
    },
  ]);
  t.deepEqual(g.relationByDestination('flow.f2_ib'), [
    {
      from: { node: 'f1', output: 'oa' },
      to: { node: 'f2', input: 'ib' },
    },
  ]);
  t.deepEqual(g.relationByDestination('none'), undefined);
  //  t.deepEqual(g.relation(undefined), undefined);
});

const n1t: Node<Aa, Oa> = { id: 'f1', input: [{ name: 'ia', transient: true }], output: ['oa'] };
const n2t: Node<Ab, void> = { id: 'f2', fct: f2, input: [{ name: 'ib', transient: true }] };

// f1( ia ) -> oa
// f2( ib ) -> void
// new -> ia
// oa -> ib
const graphTransient: Graph = {
  id: 'graph1',
  nodes: [n1t, n2t],
  edges: [
    {
      from: { node: 'start', output: 'f1' },
      to: { node: 'f1', input: 'ia' },
    },
    {
      from: { node: 'f1', output: 'oa' },
      to: { node: 'f2', input: 'ib' },
    },
  ],
};

test('relation by id (transient)', (t) => {
  const g = new GraphInternal(graphTransient);

  t.deepEqual(g.relation('flow.start_f1'), undefined);
  t.deepEqual(g.relation('flow.f1_oa'), undefined);
  t.deepEqual(g.relation('none'), undefined);
  //  t.deepEqual(g.relation(undefined), undefined);
});

test('relation by destination (transient)', (t) => {
  const g = new GraphInternal(graphTransient);

  t.deepEqual(g.relationByDestination('flow.f1_ia'), [
    {
      from: { node: 'start', output: 'f1' },
      to: { node: 'f1', input: 'ia' },
    },
  ]);
  t.deepEqual(g.relationByDestination('flow.f2_ib'), [
    {
      from: { node: 'f1', output: 'oa' },
      to: { node: 'f2', input: 'ib' },
    },
  ]);
  t.deepEqual(g.relationByDestination('none'), undefined);
  //  t.deepEqual(g.relation(undefined), undefined);
});
