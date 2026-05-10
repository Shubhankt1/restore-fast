"use client";

import { RouteError } from "@/components/route-error";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <RouteError
      title="Project details are unavailable."
      description={error.message || "The project view could not be rendered."}
      reset={reset}
    />
  );
}
