import { mongo, Options } from '@djedi/event-sourcing';
import { Filter, FindOneAndUpdateOptions, ModifyResult, UpdateFilter } from 'mongodb';

export const findOneAndUpdateNull = async <T>(
  _collection: string,
  _filter: Filter<T>,
  _update: UpdateFilter<T>,
  _options?: FindOneAndUpdateOptions,
  _option?: Options | undefined
): Promise<ModifyResult<T>> => {
  return { value: null, ok: 1 };
};

export const findOneAndUpdate = async <T>(
  collection: string,
  filter: Filter<T>,
  update: UpdateFilter<T>,
  options?: FindOneAndUpdateOptions,
  option?: Options | undefined
): Promise<ModifyResult<T>> =>
  (await mongo(option?.connectionString))
    .collection<T>(collection)
    .findOneAndUpdate(filter, update, options || {});
