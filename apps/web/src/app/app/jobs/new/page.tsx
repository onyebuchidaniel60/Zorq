import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { NewJobForm } from "@/components/forms/new-job-form";
import { getSessionFromCookies } from "@/server/auth/session";
import { SignedOutCard } from "@/components/wallet/signed-out-card";

export const metadata: Metadata = { title: "Create a training job" };

export default async function NewJobPage() {
  const session = await getSessionFromCookies();
  return (
    <>
      <PageHeader
        eyebrow="Researcher"
        title="Create a training job"
        description="Publish a public purpose and bounded window. The model preset and configuration hash are fixed."
      />
      {session ? <NewJobForm /> : <SignedOutCard feature="Job creation" />}
    </>
  );
}
