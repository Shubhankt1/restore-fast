"use client";

import { RouteError } from "@/components/route-error";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <RouteError
      title="The tracker failed to load."
      description={
        error.message || "A route-level error interrupted the current view."
      }
      reset={reset}
    />
  );
}
