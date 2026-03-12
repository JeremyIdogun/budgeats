export type IngestionRunStatus = "queued" | "running" | "completed" | "failed";

export interface IngestionRunRecord {
  retailer_id: string;
  started_at: string;
  completed_at: string | null;
  status: IngestionRunStatus;
  products_scraped: number;
  errors_json: unknown;
}

export interface IngestionRunSink {
  write(run: IngestionRunRecord): Promise<void>;
}

export class InMemoryIngestionRunSink implements IngestionRunSink {
  readonly rows: IngestionRunRecord[] = [];

  async write(run: IngestionRunRecord): Promise<void> {
    this.rows.push(run);
  }
}

type MinimalPrismaClient = {
  ingestionRun: {
    create: (input: { data: IngestionRunRecord }) => Promise<unknown>;
  };
};

export class PrismaIngestionRunSink implements IngestionRunSink {
  constructor(private readonly prisma: MinimalPrismaClient) {}

  async write(run: IngestionRunRecord): Promise<void> {
    await this.prisma.ingestionRun.create({ data: run });
  }
}

export async function recordIngestionRun(input: {
  sink: IngestionRunSink;
  retailerId: string;
  startedAt?: Date;
  completedAt?: Date | null;
  status: IngestionRunStatus;
  productsScraped: number;
  errors?: unknown;
}): Promise<IngestionRunRecord> {
  const row: IngestionRunRecord = {
    retailer_id: input.retailerId,
    started_at: (input.startedAt ?? new Date()).toISOString(),
    completed_at: input.completedAt ? input.completedAt.toISOString() : null,
    status: input.status,
    products_scraped: input.productsScraped,
    errors_json: input.errors ?? null,
  };

  await input.sink.write(row);
  return row;
}
