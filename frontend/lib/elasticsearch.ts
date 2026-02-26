import { Client } from "@elastic/elasticsearch";

let client: Client | null = null;

export function getESClient(): Client {
  if (client) return client;

  const cloudId = process.env.ELASTIC_CLOUD_ID || "";
  const apiKey = process.env.ELASTIC_API_KEY || "";
  const esUrl = process.env.ELASTICSEARCH_URL || "";

  // Prefer direct URL over Cloud ID — more reliable in serverless environments
  if (esUrl && esUrl !== "https://your-deployment.es.cloud.es.io:9243") {
    client = new Client({
      node: esUrl,
      auth: { apiKey },
      requestTimeout: 30000,
    });
  } else if (cloudId && cloudId !== "your_cloud_id_here") {
    client = new Client({
      cloud: { id: cloudId },
      auth: { apiKey },
      requestTimeout: 30000,
    });
  } else {
    throw new Error(
      "Elasticsearch not configured. Set ELASTIC_CLOUD_ID or ELASTICSEARCH_URL in frontend/.env.local"
    );
  }

  return client;
}
