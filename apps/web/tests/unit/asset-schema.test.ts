import { describe, expect, it } from "vitest";
import { assetDraftSchema } from "@/server/validation/domain";

const base = {
  displayName: "Provider dataset",
  description: "External training table.",
  idempotencyKey: "asset-draft-key-1",
};

describe("asset draft schema", () => {
  it("requires a partition for a demo asset", () => {
    expect(
      assetDraftSchema.safeParse({ ...base, dataSource: "demo" }).success,
    ).toBe(false);
    expect(
      assetDraftSchema.safeParse({
        ...base,
        dataSource: "demo",
        demoPartitionId: 3,
      }).success,
    ).toBe(true);
  });

  it("accepts an external database and requires its URL and table", () => {
    expect(
      assetDraftSchema.safeParse({
        ...base,
        dataSource: "external",
        dbUrl: "postgresql://readonly:secret@db.example.com:5432/training",
        dbTable: "public.training_rows",
        labelColumn: "label",
      }).success,
    ).toBe(true);

    expect(
      assetDraftSchema.safeParse({ ...base, dataSource: "external" }).success,
    ).toBe(false);
  });

  it("rejects unsafe table identifiers", () => {
    expect(
      assetDraftSchema.safeParse({
        ...base,
        dataSource: "external",
        dbUrl: "postgresql://readonly:secret@db.example.com:5432/training",
        dbTable: "training_rows; drop table users",
      }).success,
    ).toBe(false);
  });
});
