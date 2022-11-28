import conf from '@djedi/configuration';
import { logger } from '@djedi/log';
import { addGraph, Graph, Node, startProcess } from '../';

interface Aa {
  a: number;
  n?: number;
}
interface Ab {
  ib: number;
}

interface Result {
  oa: number;
}

const f1 = ({ a, n = 1 }: Aa): Result => ({ oa: a * n });
const n1: Node<Aa, Result> = { id: 'f1', fct: f1, input: ['a', 'n'], output: ['oa'] };

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
      from: { node: 'start', output: 'a' },
      to: { node: 'f1', input: 'a' },
    },
    {
      from: { node: 'f1', output: 'oa' },
      to: { node: 'f2', input: 'ib' },
    },
  ],
};

addGraph(graph);
startProcess<Aa>(graph, { a: 2 }, { context: { f1: { n: 2 } } });

//sendMessage('flow.new', { a: 2 });
logger.info(
  `${conf.get('application:name')}: ${conf.get('application:gittag')} [${conf.get(
    'application:releasenumber'
  )}]`
);
logger.info('start');
