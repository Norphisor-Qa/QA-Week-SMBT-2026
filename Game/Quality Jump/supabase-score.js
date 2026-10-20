"use strict";

const SUPABASE_URL =
  "https://pglstqfawauvxvezyigc.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_YaLtd-n5jALpGOUYSJriQA_h_9X_OLY";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

async function saveScore(score) {

  try {

    const { error } =
      await supabaseClient.rpc(
        "save_best_score",
        {
          p_game_id: "quality-jump",
          p_score: score
        }
      );

    if (error) {

      console.error(
        "Erreur Supabase",
        error
      );

      return false;
    }

    console.log(
      "Score enregistré :",
      score
    );

    return true;

  } catch (err) {

    console.error(
      "Erreur saveScore",
      err
    );

    return false;

  }
}
