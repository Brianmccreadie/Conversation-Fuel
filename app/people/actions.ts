"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addPerson(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const relationship = String(formData.get("relationship") ?? "").trim() || null;
  const topics = String(formData.get("topics") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const { data: person, error } = await supabase
    .from("people")
    .insert({ name, relationship })
    .select("id")
    .single();
  if (error || !person) return;

  if (topics.length > 0) {
    await supabase
      .from("person_interests")
      .insert(topics.map((label) => ({ person_id: person.id, label })));
  }
  revalidatePath("/people");
}

export async function deletePerson(id: string) {
  const supabase = await createClient();
  await supabase.from("people").delete().eq("id", id);
  revalidatePath("/people");
}

export async function addCaptureNote(personId: string, formData: FormData) {
  const note = String(formData.get("note") ?? "").trim();
  if (!note) return;
  const supabase = await createClient();
  await supabase.from("capture_notes").insert({ person_id: personId, note });
  revalidatePath(`/people/${personId}`);
}

export async function addPersonInterest(personId: string, formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;
  const detail = String(formData.get("detail") ?? "").trim() || null;
  const supabase = await createClient();
  await supabase
    .from("person_interests")
    .insert({ person_id: personId, label, detail });
  revalidatePath(`/people/${personId}`);
}

export async function deletePersonInterest(personId: string, interestId: string) {
  const supabase = await createClient();
  await supabase.from("person_interests").delete().eq("id", interestId);
  revalidatePath(`/people/${personId}`);
}
