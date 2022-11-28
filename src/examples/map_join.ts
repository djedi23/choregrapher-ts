import conf from '@djedi/configuration';
import { logger } from '@djedi/log';
import { last } from 'lodash';
import { Filter } from 'mongodb';
import { v4 as uuid } from 'uuid';
import { addGraph, Context, FlowContext, Graph, Node, ProcessedOutput, startProcess } from '../';
import { FlowRun } from '../interfaces';

interface Ar {
  i: number[];
}
interface A {
  i: number;
}

interface JoinReturn {
  i?: number[];
  _ignore?: boolean;
}

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
  if (n <= 1) {
    return { r: fact };
  } else return { o: { n: n - 1, fact: fact * n } };
};
const factNode: Node<Fact, FactResult> = {
  id: 'fact',
  fct: factFunction,
  input: ['i'],
  output: ['o', 'r'],
};

const mapFunction = ({ i = [] }: Ar): any => {
  return { i: i.map((n) => ({ n })) };
};

const mapOutputProcessing = <T, P>(
  output: any[],
  _slotName: keyof T,
  context: FlowContext<P>
): Array<ProcessedOutput<P>> => {
  const mapId = uuid();
  if (!context.labels) context.labels = {};
  if (!context.labels.maps) context.labels.maps = [];
  context.labels.maps.push(mapId);
  const size = output.length;
  const map_id = `map-${mapId}`;
  return output.map((output: any, index: number) => {
    const _context: FlowContext<P> = { ...context, labels: { ...context.labels } };
    if (_context.labels) _context.labels[map_id] = { index, size };
    return { output, context: _context };
  });
};

const mapNode: Node<Ar, Ar> = {
  id: 'map',
  fct: mapFunction,
  input: ['i'],
  output: ['i'],
  outputProcessing: mapOutputProcessing,
};

const joinFunction = async (
  parameters: A,
  {
    relation: { from },
    context: { labels },
    runContext: { findOne, findOneAndUpdate },
    processId,
  }: Context<A, JoinReturn>
): Promise<JoinReturn> => {
  logger.debug('Label', { parameters, labels });
  const d = await findOne<FlowRun<number>>('runs', { processId });
  const mapId: string = last(labels?.maps) || '';
  const mapLabel = `map-${mapId}`;
  const inputs = d?.outputs.filter((o) => {
    // Cherche les resultats que l'on va joindre
    if (o.output.node !== from.node || o.output.output !== from.output) return false;
    const maps: string[] | undefined = o.context?.labels?.maps;
    if (maps) {
      return maps.indexOf(mapId) !== -1;
    }
  });

  if (labels && labels[mapLabel].size === inputs?.length) {
    const query: Filter<A> = { processId };
    query[`join-${mapId}`] = { $exists: false };
    const update: any = {};
    update[`join-${mapId}`] = 1;
    const result = await findOneAndUpdate('runs', query, { $set: update });
    if (result.value !== null) {
      const outputArray = inputs
        ?.sort((a, b) => {
          const indexA = a.context?.labels && a.context?.labels[mapLabel].index;
          const indexB = b.context?.labels && b.context?.labels[mapLabel].index;
          return indexA < indexB ? -1 : 1;
        })
        .map(({ parameter }) => parameter);
      if (outputArray) {
        labels.maps.pop();
        delete labels[mapLabel]; // tslint:disable-line: no-dynamic-delete
        return { i: outputArray };
      }
    }
  }
  return { _ignore: true };
};
const joinNode: Node<A, JoinReturn> = {
  id: 'join',
  fct: joinFunction,
  input: ['i'],
  output: ['i'],
};

const dumpFunction = (parameters: Ar, { context: { labels } }: Context<Ar, void>): void => {
  logger.info('Dump', { parameters, labels });
};
const dumpNode: Node<Ar, void> = {
  id: 'dump',
  fct: dumpFunction,
  input: ['i'],
  output: [],
};

const graph: Graph = {
  nodes: [mapNode, joinNode, dumpNode, factNode],
  id: 'fact_map',
  edges: [
    {
      from: { node: 'start', output: 'i' },
      to: { node: 'map', input: 'i' },
    },
    {
      from: { node: 'map', output: 'i' },
      to: { node: 'fact', input: 'i' },
    },
    {
      from: { node: 'fact', output: 'r' },
      to: { node: 'join', input: 'i' },
    },
    {
      from: { node: 'fact', output: 'o' },
      to: { node: 'fact', input: 'i' },
    },
    {
      from: { node: 'join', output: 'i' },
      to: { node: 'dump', input: 'i' },
    },
  ],
};

addGraph(graph);
if (conf.get('daemon') !== true && conf.get('daemon') !== 'true')
  startProcess<Ar>(graph, {
    i: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  });
else logger.info('daemon mode', { daemon: conf.get('daemon') });

logger.info(
  `${conf.get('application:name')}: ${conf.get('application:gittag')} [${conf.get(
    'application:releasenumber'
  )}]`
);
logger.info('start');
