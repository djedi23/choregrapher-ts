import conf from '@djedi/configuration';
import { logger } from '@djedi/log';
import { addGraph, Graph, Node, startProcess } from '../';

interface SumParam {
  i1?: number;
  i2?: number;
}

interface SumResult {
  o: number;
}

const sumFunction = ({ i1 = 0, i2 = 0 }: SumParam): SumResult => {
  return { o: i1 + i2 };
};
const sumNode: Node<SumParam, SumResult> = {
  id: 'sum',
  fct: sumFunction,
  input: [{ name: 'i1', transient: true }, 'i2'],
  output: ['o'],
};

interface A {
  i: number;
}

const proxyFunction = ({ i = 0 }: A): A => {
  return { i };
};
const proxyNode: Node<A, A> = {
  id: 'proxy',
  fct: proxyFunction,
  input: ['i'],
  output: ['i'],
};

const proxy1Node: Node<A, A> = {
  id: 'proxy1',
  fct: proxyFunction,
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
startProcess<SumParam>(graph, { i1: 5, i2: 3 });

logger.info(
  `${conf.get('application:name')}: ${conf.get('application:gittag')} [${conf.get(
    'application:releasenumber'
  )}]`
);
logger.info('start');
