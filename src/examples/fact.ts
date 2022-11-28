import conf from '@djedi/configuration';
import { logger } from '@djedi/log';
import { addGraph, Graph, Node, startProcess } from '../';

interface Fact {
  i: {
    n: number;
    fact?: number;
  };
}

interface FactResult {
  o?: {
    n: number;
    fact?: number;
  };
  r?: number;
}

const factFunction = ({ i: { n = 1, fact = 1 } }: Fact): FactResult => {
  if (n === 1) {
    console.log('fact:', fact);
    return { r: fact };
  } else return { o: { n: n - 1, fact: fact * n } };
};
const factNode: Node<Fact, FactResult> = {
  id: 'fact',
  affinity: {
    type: 'nameNodeAffinity',
    name: 'factFunction',
  },
  input: ['i'],
  output: ['o', 'r'],
};

const graph: Graph = {
  id: 'fact',
  nodes: [factNode],
  edges: [
    {
      from: { node: 'start', output: 'i' },
      to: { node: 'fact', input: 'i' },
    },
    {
      from: { node: 'fact', output: 'o' },
      to: { node: 'fact', input: 'i' },
    },
  ],
};

addGraph(graph, new Map([['factFunction', factFunction]]));
if (conf.get('daemon') !== true && conf.get('daemon') !== 'true')
  startProcess<Fact>(graph, { i: { n: conf.get('n') || 5 } });
else logger.info('daemon mode', { daemon: conf.get('daemon') });
logger.info(
  `${conf.get('application:name')}: ${conf.get('application:gittag')} [${conf.get(
    'application:releasenumber'
  )}]`
);
logger.info('start');
