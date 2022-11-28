import { mongo, Options } from '@djedi/event-sourcing';
import { Filter, FindOptions } from 'mongodb';

export const findOneNull = async <T>(
  _collection: string,
  _filter: Filter<T>,
  _options?: FindOptions<T>,
  _option?: Options | undefined
): Promise<T | null> => {
  return null;
};

export const findOne = async <T>(
  collection: string,
  filter: Filter<T>,
  options?: FindOptions<any>,
  option?: Options | undefined
): Promise<T | null> =>
  (await mongo(option?.connectionString)).collection(collection).findOne(filter, options);
