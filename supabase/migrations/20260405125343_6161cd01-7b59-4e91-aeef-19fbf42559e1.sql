-- Tighten llm_referrer_log INSERT policy: restrict to known sources, add length limits
DROP POLICY IF EXISTS "Public referrer log insert" ON public.llm_referrer_log;

CREATE POLICY "Validated referrer log insert"
  ON public.llm_referrer_log FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    referrer_source IS NOT NULL
    AND page_path IS NOT NULL
    AND char_length(referrer_source) <= 100
    AND char_length(page_path) <= 500
    AND char_length(COALESCE(user_agent, '')) <= 500
    AND referrer_source IN (
      'ChatGPT', 'Perplexity', 'Gemini', 'Claude', 'Copilot',
      'You.com', 'Phind', 'GPTBot', 'PerplexityBot', 'ClaudeBot',
      'GoogleBot', 'BingBot'
    )
  );