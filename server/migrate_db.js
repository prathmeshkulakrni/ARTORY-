const { MongoClient } = require('mongodb');

const localUri = "mongodb://localhost:27017/artory";
const atlasUri = "mongodb+srv://prajwalmeshram231162_db_user:OV1XP1yD4ee9Y5Px@artory.qg5ni83.mongodb.net/artory?retryWrites=true&w=majority&appName=artory";

async function migrate() {
  let localClient, atlasClient;

  try {
    console.log("Connecting to local MongoDB...");
    localClient = await MongoClient.connect(localUri);
    const localDb = localClient.db('artory');

    console.log("Connecting to Atlas MongoDB...");
    atlasClient = await MongoClient.connect(atlasUri);
    const atlasDb = atlasClient.db('artory');

    // Get all collections from local DB
    const collections = await localDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections locally.`);

    for (const collInfo of collections) {
      const collName = collInfo.name;
      console.log(`\nMigrating collection: ${collName}`);

      const localColl = localDb.collection(collName);
      const atlasColl = atlasDb.collection(collName);

      // Fetch all documents from local
      const docs = await localColl.find({}).toArray();
      console.log(`  - Found ${docs.length} documents in local DB.`);

      if (docs.length > 0) {
        // Create bulk operations for upserting (insert or update)
        const bulkOps = docs.map(doc => {
          if (collName === 'users' && doc.email) {
            const updatePayload = { ...doc };
            delete updatePayload._id; // _id is immutable in updates
            return {
              updateOne: {
                filter: { email: doc.email },
                update: { $set: updatePayload },
                upsert: true
              }
            };
          } else {
            return {
              updateOne: {
                filter: { _id: doc._id },
                update: { $set: doc },
                upsert: true
              }
            };
          }
        });

        console.log(`  - Uploading ${bulkOps.length} documents using safe upsert (no deletions)...`);
        try {
          const result = await atlasColl.bulkWrite(bulkOps, { ordered: false });
          console.log(`  - Upsert result: Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);
        } catch (bulkErr) {
          console.warn(`  - Upsert completed with some duplicate warnings/errors: ${bulkErr.message}`);
          if (bulkErr.result) {
            console.log(`    (Upserted: ${bulkErr.result.nUpserted}, Modified: ${bulkErr.result.nModified})`);
          }
        }
      } else {
        console.log(`  - Skipped (empty).`);
      }
    }

    console.log("\nMigration completed successfully!");

  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    if (localClient) await localClient.close();
    if (atlasClient) await atlasClient.close();
  }
}

migrate();
