export interface AttachmentStorageRecord {
  data: string;
  storageProvider: string | null;
  storageReference: string | null;
  storageUrl: string | null;
}

export interface StoreAttachmentPayloadInput {
  buffer: Buffer;
}

export interface StoreAttachmentPayloadResult {
  data: string;
  storageProvider?: string | null;
  storageReference?: string | null;
  storageUrl?: string | null;
}

interface AttachmentStorageProvider {
  readonly providerName: string;
  store(input: StoreAttachmentPayloadInput): Promise<StoreAttachmentPayloadResult>;
  read(record: AttachmentStorageRecord): Promise<Buffer>;
  remove(record: AttachmentStorageRecord): Promise<void>;
}

class DatabaseAttachmentStorageProvider implements AttachmentStorageProvider {
  readonly providerName = "database";

  async store({ buffer }: StoreAttachmentPayloadInput) {
    return {
      data: buffer.toString("base64"),
      storageProvider: this.providerName,
      storageReference: null,
      storageUrl: null,
    };
  }

  async read(record: AttachmentStorageRecord) {
    return Buffer.from(record.data, "base64");
  }

  async remove(_record: AttachmentStorageRecord) {
    // No-op. Payload is removed with the attachment row.
  }
}

class AttachmentStorageService {
  private readonly defaultProvider = new DatabaseAttachmentStorageProvider();

  async storePayload(input: StoreAttachmentPayloadInput) {
    return this.defaultProvider.store(input);
  }

  async readPayload(record: AttachmentStorageRecord) {
    if (record.storageProvider && record.storageProvider !== this.defaultProvider.providerName) {
      // Future providers can be registered here; fallback keeps existing records readable.
      return this.defaultProvider.read(record);
    }

    return this.defaultProvider.read(record);
  }

  async deletePayload(record: AttachmentStorageRecord) {
    if (record.storageProvider && record.storageProvider !== this.defaultProvider.providerName) {
      await this.defaultProvider.remove(record);
      return;
    }

    await this.defaultProvider.remove(record);
  }
}

export const attachmentStorageService = new AttachmentStorageService();
