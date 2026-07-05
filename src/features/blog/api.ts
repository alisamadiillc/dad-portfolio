import { supabase } from "@/lib/supabase";

import type { Post, PostInput } from "./types";

const TABLE = "posts";

export async function listPublishedPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listAllPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPostById(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createPost(input: PostInput): Promise<Post> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePost(
  id: string,
  input: Partial<PostInput>
): Promise<Post> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
