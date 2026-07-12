"use server";

import { createClient } from "@/lib/supabase/server";

export async function reactToCard(
  cardId: string,
  action: "starred" | "used" | "dismissed" | "more" | "less"
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("interactions")
    .insert({ card_id: cardId, action });
  return { error: error?.message ?? null };
}
