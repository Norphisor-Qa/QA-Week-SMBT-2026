"use strict";
const SUPABASE_URL = "https://pglstqfawauvxvezyigc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YaLtd-n5jALpGOUYSJriQA_h_9X_OLY";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

window.qualityJumpScores = (() => {
  const GAME_ID = "quality-jump";
  function checkScore(value) {
    if (!Number.isInteger(value) || value < 0 || value > 2147483647) {
      throw new Error("Score invalide.");
    }
    return value;
  }
  async function requireSession() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    if (!data?.session?.user) {
      const error = new Error("Session absente ou expirée.");
      error.code = "AUTH_REQUIRED";
      throw error;
    }
    return data.session.user;
  }
  async function loadBestScore() {
    const user = await requireSession();
    const { data, error } = await supabaseClient.from("scores")
      .select("score").eq("user_id", user.id).eq("game_id", GAME_ID).maybeSingle();
    if (error) throw error;
    return data ? checkScore(data.score) : 0;
  }
  async function saveBestScore(score) {
    checkScore(score);
    await requireSession();
    const { data, error } = await supabaseClient.rpc("save_best_score", {
      p_game_id: GAME_ID, p_score: score
    });
    if (error) throw error;
    // La fonction SQL fournie retourne directement un entier.
    return checkScore(data);
  }
  return Object.freeze({ requireSession, loadBestScore, saveBestScore });
})();
