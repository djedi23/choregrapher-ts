import { Options } from '@djedi/event-sourcing';
import { Storage } from '@djedi/object-storage';
import {
  Filter,
  FindOneAndUpdateOptions,
  FindOptions,
  ModifyResult,
  UpdateFilter,
  UpdateOptions,
  UpdateResult,
} from 'mongodb';
import { OutputRef } from './Graph';

export interface RunContext {
  // partof: #SPC-processing.context_sendMessage
  sendMessage: <T>(graphId: string, key: string, obj: FlowMessage<T>) => void;
  // partof: #SPC-processing.context_updateOne
  updateOne: <T>(
    collection: string,
    filter: Filter<T>,
    update: UpdateFilter<T>,
    options?: UpdateOptions,
    option?: Options | undefined
  ) => Promise<UpdateResult>;
  // partof: #SPC-processing.context_findOne
  findOne: <T>(
    collection: string,
    filter: Filter<T>,
    options?: FindOptions<T>,
    option?: Options | undefined
  ) => Promise<T | null>;
  // partof: #SPC-processing.context_findOneAndUpdate
  findOneAndUpdate: <T>(
    collection: string,
    filter: Filter<T>,
    update: UpdateFilter<T>,
    options?: FindOneAndUpdateOptions,
    option?: Options | undefined
  ) => Promise<ModifyResult<T>>;
  // partof: #SPC-processing.context_storage
  storage: Promise<Storage>;
  // partof: #SPC-processing.context_yield
  /** A node function can produce an outpout stream. */
  yield: <T>(outputs: any, context?: FlowContext<T>) => Promise<void>;
}

export interface FlowContext<T> {
  labels?: { [id: string]: any };
  context?: { [id: string]: Partial<T> };
}

export interface FlowMessage<T> {
  processId: string;
  parameter: T;
  context?: FlowContext<T>;
}

export interface NodeOutput<T> extends FlowMessage<T> {
  output: OutputRef;
  timestamp: Date;
}

export interface FlowRun<T> {
  processId: string;
  graphId: string;
  timestamp: Date;
  outputs: Array<NodeOutput<T>>;
}
