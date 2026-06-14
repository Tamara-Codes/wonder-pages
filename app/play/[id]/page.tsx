import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { GameRow } from "@/lib/types";
import ColoringCanvas from "./coloring-canvas";
import FindItGame from "./find-it-game";
import SpotDifferenceGame from "./spot-difference-game";

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

  switch (game.type) {
    case "coloring":
      return <ColoringCanvas game={game} />;
    case "spot-difference":
      return <SpotDifferenceGame game={game} />;
    default:
      return <FindItGame game={game} />;
  }
}
