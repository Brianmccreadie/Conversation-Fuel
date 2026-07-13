import { Suspense } from "react";
import { Shell } from "@/components/shell";
import { EmberClient } from "./ember-client";

// The fireside — the Ember's own room. Voice needs OPENAI_API_KEY;
// text mode runs on the same Anthropic key as the rest of the app.
export default function EmberPage() {
  const voiceAvailable = Boolean(process.env.OPENAI_API_KEY);

  return (
    <Shell active="/ember" ticker={false}>
      <Suspense>
        <EmberClient voiceAvailable={voiceAvailable} />
      </Suspense>
    </Shell>
  );
}
