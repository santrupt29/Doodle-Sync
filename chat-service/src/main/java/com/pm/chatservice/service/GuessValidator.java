package com.pm.chatservice.service;

import org.springframework.stereotype.Service;

@Service
public class GuessValidator {

    public enum Result{
        CORRECT, CLOSE, WRONG
    }

    public Result validate(String guess, String answer) {
        if(guess == null || answer == null) return Result.WRONG;

        String g = normalize(guess);
        String a = normalize(answer);

        if (g.equals(a))  return Result.CORRECT;
        if (editDistance(g, a) <= 1)  return Result.CLOSE;
        return Result.WRONG;
    }

    private String normalize(String s) {
        return s.trim()
                .toLowerCase()
                .replaceAll("[^a-z0-9]", "");
    }

    // Levenshtein distance — "elefant" vs "elephant" = 1 → CLOSE
    private int editDistance(String a, String b) {
        int[][] dp = new int[a.length()+1][b.length()+1];
        for (int i = 0; i <= a.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= b.length(); j++) dp[0][j] = j;
        for (int i = 1; i <= a.length(); i++)
            for (int j = 1; j <= b.length(); j++)
                dp[i][j] = a.charAt(i-1) == b.charAt(j-1)
                        ? dp[i-1][j-1]
                        : 1 + Math.min(dp[i-1][j-1],
                        Math.min(dp[i-1][j], dp[i][j-1]));
        return dp[a.length()][b.length()];
    }

    // The Levenshtein distance of ≤ 1 catches single-letter typos like "elefant" for "elephant" — a common scenario in fast-paced guessing.

}
