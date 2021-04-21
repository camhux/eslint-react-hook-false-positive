# eslint-react-hook-false-positive

This repository demonstrates an esoteric reproduction of an issue encountered in real code, where a specific structure of expressions causes `eslint-plugin-react-hooks/rules-of-hooks` to incorrectly flag a hook for being called conditionally.

`yarn repro` runs the lint and demonstrates the false positive. It's trivial to inspect the structure of `repro.tsx` and see that its hook is not called conditionally.

This specific example of this issue can be reproduced with either `@typescript-eslint/parser @ >=4` or `@babel/eslint-parser` (and probably any other parser that supports `??` and `?.` tokenization).

## Explanation

The `rules-of-hooks` logic counts the individual codepaths through a given function, then compares the number of paths a given hook appears in with the total count of paths. If the hook does not appear in every path, it is flagged as a "conditional call".

This reproduction case produces a total number of codepaths that exceeds `Number.MAX_SAFE_INTEGER`, causing imprecision in the path calculations. Here is some debug output of `countPathsToEnd.cache` in this case:

```
's2_10' => 4503599627370496, // = 2**52
's2_7' => 4503599627370497, // HOOK SEGMENT = 2**52 +1
's2_6' => 4503599627370497,
's2_5' => 9007199254740994, // = 2**53 +2 = 2 * s2_7 ; EXCEEDS MAX_SAFE_INTEGER
's2_4' => 13510798882111492,
's2_3' => 13510798882111492,
's2_2' => 27021597764222984,
's2_1' => 40532396646334480 // Total counted
```

There are 9 paths to segment `s2_7`, so the hook exists on `9n * 4503599627370497n == 40532396646334473n` codepaths in reality. Multiplying these as `number`s instead of `BigInts` gives `40532396646334470`, whereas the recursive addition in `countPathsToEnd` for the initial segment gives `40532396646334480`. It's the inequality of these two truncated numbers that flags the hook as "called conditionally."

## Fix

Modifying `countPathsFromStart` and `countPathsToEnd` in `react/packages/eslint-plugin-react-hooks/src/RulesOfHooks.js` to count in `BigInt` rather than `number` seems to fix this issue.
