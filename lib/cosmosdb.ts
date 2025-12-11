import { CosmosClient, Database, Container } from "@azure/cosmos";

const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
const key = process.env.AZURE_COSMOS_KEY!;
const databaseName = process.env.AZURE_COSMOS_DATABASE_NAME || "portfolio-tracker";
const containerName = process.env.AZURE_COSMOS_CONTAINER_NAME || "transactions";

let client: CosmosClient;
let database: Database;
let container: Container;

export async function getCosmosContainer() {
  if (!container) {
    client = new CosmosClient({ endpoint, key });
    database = client.database(databaseName);
    container = database.container(containerName);
  }
  return container;
}

export async function initCosmosDB() {
  if (!client) {
    client = new CosmosClient({ endpoint, key });
  }

  // Create database if it doesn't exist
  const { database: db } = await client.databases.createIfNotExists({
    id: databaseName,
  });
  database = db;

  // Create container if it doesn't exist
  const { container: cont } = await database.containers.createIfNotExists({
    id: containerName,
    partitionKey: { paths: ["/type"] }, // Partition by document type
  });
  container = cont;

  return container;
}
