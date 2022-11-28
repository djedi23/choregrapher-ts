import conf from '@djedi/configuration';
import { logger } from '@djedi/log';
import { addGraph, Node, startProcess } from '../';
import { loadGraph, saveGraph } from '../graph_to_db';

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

const main = async () => {
  let graph = await loadGraph('fact');
  if (!graph) {
    const factNode: Node<Fact, FactResult> = {
      id: 'fact',
      affinity: {
        type: 'nameNodeAffinity',
        name: 'factFunction',
      },
      input: ['i'],
      output: ['o', 'r'],
    };

    graph = {
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

    saveGraph(graph);
  }
  addGraph(graph, new Map([['factFunction', factFunction]]));
  startProcess<Fact>(graph, { i: { n: 5 } });
};

logger.info(
  `${conf.get('application:name')}: ${conf.get('application:gittag')} [${conf.get(
    'application:releasenumber'
  )}]`
);
logger.info('start');
main();
