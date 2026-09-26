// Usage: npm run sync            (now playing, popular, trending)
//        npm run sync -- --full  (also the 400 top-rated films, for a fresh DB)
import { appDataSource } from '../datasource.js';
import { syncCatalog } from '../services/sync.js';

await appDataSource.initialize();
try {
  await syncCatalog({ full: process.argv.includes('--full') });
} finally {
  await appDataSource.destroy();
}
