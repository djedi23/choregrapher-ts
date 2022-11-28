import conf from '@djedi/configuration';
import { logger } from '@djedi/log';

import { Db, MongoClient } from 'mongodb';

let db: Db | null = null;
export const mongo = async (): Promise<Db> => {
  if (!db) {
    const mongoUrl = conf.get('mongodb:url') || 'mongodb://localhost';
    logger.info(`Mongo url: ${mongoUrl}`);
    const mongoclient = await MongoClient.connect(mongoUrl);
    db = mongoclient.db(conf.get('db:database') || 'test');
  }
  return db;
};
