import conf from '@djedi/configuration';
import { logger } from '@djedi/log';
import { addGraph, Graph, Node, startProcess } from '../';

interface Value {
  value: number;
  key: string;
}

interface SumParam {
  i1?: Value;
  i2?: Value;
}

interface SumResult {
  o: Value;
}

const sumFunction = (
  {
    i1: { value: v1, key } = { value: 0, key: '' },
    i2: { value: v2 } = { value: 0, key: '' },
  }: SumParam = {
    i1: { value: 0, key: '' },
    i2: { value: 0, key: '' },
  }
): SumResult => {
  return { o: { value: v1 + v2, key } };
};
const sumNode: Node<SumParam, SumResult> = {
  id: 'sum',
  fct: sumFunction,
  input: ['i1', 'i2'],
  output: ['o'],
  inputMatching: {
    type: 'keyEquals',
    key: 'key',
  },
};

interface A {
  i: Value;
}

const proxyFuntion = (
  { i: { value } = { value: 0, key: '' } }: A = { i: { value: 0, key: '' } }
): A => {
  return { i: { value, key: 'ukey' } };
};
const proxyNode: Node<A, A> = {
  id: 'proxy',
  fct: proxyFuntion,
  input: ['i'],
  output: ['i'],
};

const proxy1Node: Node<A, A> = {
  id: 'proxy1',
  fct: proxyFuntion,
  input: ['i'],
  output: ['i'],
};

const graph: Graph = {
  id: 'summer',
  nodes: [sumNode, proxyNode, proxy1Node],
  edges: [
    {
      from: { node: 'start', output: 'i1' },
      to: { node: 'proxy', input: 'i' },
    },
    {
      from: { node: 'start', output: 'i2' },
      to: { node: 'proxy1', input: 'i' },
    },
    {
      from: { node: 'proxy', output: 'i' },
      to: { node: 'sum', input: 'i1' },
    },
    {
      from: { node: 'proxy1', output: 'i' },
      to: { node: 'sum', input: 'i2' },
    },
  ],
};

addGraph(graph);
startProcess<SumParam>(graph, { i1: { value: 5, key: 'aa' }, i2: { value: 3, key: 'ab' } });

logger.info(
  `${conf.get('application:name')}: ${conf.get('application:gittag')} [${conf.get(
    'application:releasenumber'
  )}]`
);
logger.info('start');
