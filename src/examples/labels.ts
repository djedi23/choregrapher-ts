import conf from '@djedi/configuration';
import { logger } from '@djedi/log';
import { addGraph, Context, Graph, Node, startProcess } from '../';

interface A {
  i: number;
}

const producerFunction = ({ i = 0 }: A, { context: { labels = {} } }: Context<A, A>): A => {
  labels.a = 'b';
  return { i: i + 1 };
};
const labelProducer: Node<A, A> = {
  id: 'producer',
  fct: producerFunction,
  input: ['i'],
  output: ['i'],
};

const consumerFunction = (_p: A, { context: { labels } }: Context<A, void>): void => {
  logger.info('Label', { labels });
};
const labelConsumer: Node<A, void> = {
  id: 'consumer',
  fct: consumerFunction,
  input: ['i'],
  output: [],
};

const graph: Graph = {
  id: 'fact',
  nodes: [labelProducer, labelConsumer],
  edges: [
    {
      from: { node: 'start', output: 'i' },
      to: { node: 'producer', input: 'i' },
    },
    {
      from: { node: 'producer', output: 'i' },
      to: { node: 'consumer', input: 'i' },
    },
  ],
};

addGraph(graph);
startProcess<A>(graph, { i: 1 });

logger.info(
  `${conf.get('application:name')}: ${conf.get('application:gittag')} [${conf.get(
    'application:releasenumber'
  )}]`
);
logger.info('start');
