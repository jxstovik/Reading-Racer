/**
 * speechMatch.js — fuzzy matching for child speech verification
 * Per plan §5: normalize, Levenshtein, WER threshold 80%
 */

export function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text) {
  const n = normalizeText(text);
  return n ? n.split(" ") : [];
}

// Levenshtein distance (word-level or char-level depending on input arrays)
export function levenshtein(a, b) {
  // a, b are arrays (words) or strings (chars handled as arrays)
  const aArr = Array.isArray(a) ? a : a.split("");
  const bArr = Array.isArray(b) ? b : b.split("");
  const m = aArr.length;
  const n = bArr.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = aArr[i - 1] === bArr[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

export function wordErrorRate(expected, recognized) {
  const expWords = tokenize(expected);
  const recWords = tokenize(recognized);
  if (expWords.length === 0) return recWords.length === 0 ? 0 : 1;
  const dist = levenshtein(expWords, recWords);
  return dist / expWords.length;
}

export function charAccuracy(expected, recognized) {
  const e = normalizeText(expected);
  const r = normalizeText(recognized);
  if (!e) return r ? 0 : 1;
  const dist = levenshtein(e.split(""), r.split(""));
  return Math.max(0, 1 - dist / Math.max(e.length, 1));
}

/**
 * Main scoring function.
 * Returns { score, wer, charAcc, matchedWords, wordResults }
 * score 0..1 (higher better)
 */
export function scoreReading(expected, recognized) {
  const expWords = tokenize(expected);
  const recWords = tokenize(recognized);
  const wer = wordErrorRate(expected, recognized);
  const cAcc = charAccuracy(expected, recognized);

  // Word-level alignment via greedy LCS-like approach
  const wordResults = analyzeWords(expWords, recWords);

  const correctCount = wordResults.filter((w) => w.status === "correct").length;
  const wordScore = expWords.length ? correctCount / expWords.length : 0;

  // Blend wordScore (0.6), charAcc (0.2), (1-wer) (0.2)
  const score = wordScore * 0.6 + cAcc * 0.2 + Math.max(0, 1 - wer) * 0.2;

  return {
    score: Math.min(1, Math.max(0, score)),
    wer,
    charAcc: cAcc,
    wordScore,
    correctCount,
    totalWords: expWords.length,
    wordResults,
    recognized: normalizeText(recognized),
    expected: normalizeText(expected),
  };
}

function analyzeWords(expectedWords, recognizedWords) {
  // Simple alignment: for each expected word, check if it exists in recognized within edit distance 1
  const recSet = new Set(recognizedWords);
  // Also track which rec words have been matched
  const used = new Array(recognizedWords.length).fill(false);

  return expectedWords.map((ew) => {
    // exact match
    const idx = recognizedWords.findIndex((rw, i) => !used[i] && rw === ew);
    if (idx !== -1) {
      used[idx] = true;
      return { word: ew, status: "correct" };
    }
    // fuzzy: edit distance 1
    const fuzzyIdx = recognizedWords.findIndex(
      (rw, i) => !used[i] && levenshtein(ew.split(""), rw.split("")) <= 1,
    );
    if (fuzzyIdx !== -1) {
      used[fuzzyIdx] = true;
      return { word: ew, status: "correct" }; // treat phonetic close as correct for encouragement
    }
    // check if word appears anywhere (even if already used) -> consider correct but duplicate
    if (recSet.has(ew)) {
      return { word: ew, status: "correct" };
    }
    // else missed
    return { word: ew, status: "missed" };
  });
}

export function gradeFromScore(score, settings = {}) {
  const threshold = settings.passThreshold ?? 0.8;
  const goodThreshold = settings.goodThreshold ?? 0.6;
  if (score >= threshold) return "perfect"; // 10 fuel
  if (score >= goodThreshold) return "good"; // 7 fuel
  if (score >= 0.35) return "try-again"; // gentle retry, 3 fuel consolation
  return "needs-help";
}

export function fuelForGrade(grade) {
  switch (grade) {
    case "perfect":
      return 10;
    case "good":
      return 7;
    case "try-again":
      return 3;
    default:
      return 0;
  }
}

// For testing / parent review
export function formatFeedback(expected, recognized) {
  const r = scoreReading(expected, recognized);
  const grade = gradeFromScore(r.score);
  return { ...r, grade, fuel: fuelForGrade(grade) };
}
