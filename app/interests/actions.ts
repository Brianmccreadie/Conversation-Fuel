"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleInterest(id: string, status: "active" | "paused") {
  const supabase = await createClient();
  await supabase.from("interests").update({ status }).eq("id", id);
  revalidatePath("/interests");
}

export async function deleteInterest(id: string) {
  const supabase = await createClient();
  await supabase.from("interests").delete().eq("id", id);
  revalidatePath("/interests");
}
