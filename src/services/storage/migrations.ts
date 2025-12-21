// Database migration utilities
// Architecture: Schema versioning and data migrations

import { DiscalculasDB } from './db';

/**
 * Apply database migrations
 * Currently empty for schema v1
 *
 * Future versions will use this pattern:
 *
 * @example
 * db.version(2).stores({
 *   sessions: '++id, timestamp, module, [timestamp+module], userId'
 * }).upgrade(tx => {
 *   return tx.table('sessions').toCollection().modify(session => {
 *     session.userId = 'local_user';
 *   });
 * });
 *
 * @param db - DiscalculasDB instance
 */
export function applyMigrations(_db: DiscalculasDB): void {
  // No migrations for v1
  // This function is a placeholder for future schema changes
  // Parameter prefixed with _ to indicate intentionally unused

  // Example v2 migration (commented for reference):
  // db.version(2).stores({
  //   sessions: '++id, timestamp, module, [timestamp+module], userId'
  // }).upgrade(async (tx) => {
  //   // Migrate existing data
  //   const sessions = await tx.table('sessions').toArray();
  //   await Promise.all(
  //     sessions.map(session =>
  //       tx.table('sessions').update(session.id!, { userId: 'local_user' })
  //     )
  //   );
  // });
}
