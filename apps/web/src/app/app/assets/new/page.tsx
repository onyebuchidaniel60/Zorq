import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { NewAssetForm } from "@/components/forms/new-asset-form";
import { getSessionFromCookies } from "@/server/auth/session";
import { SignedOutCard } from "@/components/wallet/signed-out-card";

export const metadata: Metadata = { title: "Register a data asset" };

export default async function NewAssetPage() {
  const session = await getSessionFromCookies();
  return (
    <>
      <PageHeader
        eyebrow="Data provider"
        title="Register a data asset"
        description="Create an opaque on-chain asset reference plus a salted metadata commitment. No file upload exists."
      />
      {session ? <NewAssetForm /> : <SignedOutCard feature="Asset registration" />}
    </>
  );
}
