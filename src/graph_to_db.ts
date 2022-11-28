import { updateOne } from '@djedi/event-sourcing';
import { logger } from '@djedi/log';
import { findOne } from './findOne';
import { GraphInDB } from './interfaces/Graph';

/**
 * Save a graph in Mongo
 * @param graph the graph to save.
 */
export const saveGraph = async (graph: GraphInDB): Promise<GraphInDB> => {
  if (!graph.createdAt) graph.createdAt = new Date();
  if (!graph.version) graph.version = '1';

  graph.modifiedAt = new Date();
  logger.debug(`Saving graph: ${graph.id}`);
  await updateOne<GraphInDB>('graph', { id: graph.id }, { $set: graph }, { upsert: true });
  return graph;
};

export const loadGraph = async (id: string): Promise<GraphInDB | null> => {
  logger.debug(`Loading graph: ${id}`);
  return findOne<GraphInDB>('graph', { id });
};
