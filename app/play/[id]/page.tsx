import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { GameRow } from "@/lib/types";
import ColoringCanvas from "./coloring-canvas";
import FindItGame from "./find-it-game";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS guarantees the row is returned only to its owner.
  const { data } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();
  const game = data as GameRow;

  return game.type === "coloring" ? (
    <ColoringCanvas game={game} />
  ) : (
    <FindItGame game={game} />
  );
}
