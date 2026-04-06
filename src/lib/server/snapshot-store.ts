import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SnapshotStore } from "../../../packages/retailer-connectors/src/runtime";

type SnapshotPayload = {
  key: string;
  body: string;
  contentType: "text/html" | "application/json";
};

class InMemorySnapshotStore implements SnapshotStore {
  private readonly snapshots = new Set<string>();

  async hasSnapshot(key: string): Promise<boolean> {
    return this.snapshots.has(key);
  }

  async putSnapshot(input: SnapshotPayload): Promise<void> {
    void input.body;
    void input.contentType;
    this.snapshots.add(input.key);
  }
}

class FileSystemSnapshotStore implements SnapshotStore {
  constructor(private readonly baseDir: string) {}

  private filePathForKey(key: string): string {
    return join(this.baseDir, ...key.split("/"));
  }

  async hasSnapshot(key: string): Promise<boolean> {
    try {
      await access(this.filePathForKey(key));
      return true;
    } catch {
      return false;
    }
  }

  async putSnapshot(input: SnapshotPayload): Promise<void> {
    const filePath = this.filePathForKey(input.key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, input.body, "utf8");
  }
}

class SupabaseStorageSnapshotStore implements SnapshotStore {
  constructor(
    private readonly client: SupabaseClient,
    private readonly bucket: string,
  ) {}

  async hasSnapshot(key: string): Promise<boolean> {
    const segments = key.split("/");
    const fileName = segments.pop();
    const directory = segments.join("/");
    if (!fileName) return false;

    const { data, error } = await this.client.storage.from(this.bucket).list(directory, {
      search: fileName,
      limit: 1,
    });

    if (error) return false;
    return (data ?? []).some((entry) => entry.name === fileName);
  }

  async putSnapshot(input: SnapshotPayload): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).upload(
      input.key,
      new Blob([input.body], { type: input.contentType }),
      {
        contentType: input.contentType,
        upsert: false,
      },
    );

    if (error) {
      throw new Error(`Failed to persist snapshot ${input.key}: ${error.message}`);
    }
  }
}

function createSupabaseSnapshotStore(): SnapshotStore | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SNAPSHOT_BUCKET?.trim();

  if (!url || !serviceRoleKey || !bucket) return null;

  const client = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return new SupabaseStorageSnapshotStore(client, bucket);
}

function createFileSystemSnapshotStore(): SnapshotStore | null {
  const configuredDir = process.env.SNAPSHOT_DIR?.trim();
  const fallbackDir = process.env.TMPDIR?.trim()
    ? join(process.env.TMPDIR.trim(), "budgeats-snapshots")
    : join(process.cwd(), ".snapshots");
  const baseDir = configuredDir || fallbackDir;

  if (!baseDir) return null;
  return new FileSystemSnapshotStore(baseDir);
}

export function createSnapshotStore(): SnapshotStore {
  return createSupabaseSnapshotStore()
    ?? createFileSystemSnapshotStore()
    ?? new InMemorySnapshotStore();
}
