import test from "node:test";
import assert from "node:assert/strict";
import { calculateReadingStatistics } from "../src/services/calculation/reading-statistics.js";

test("calculates inclusive page statistics and reports matching median/extreme days", () => {
  const days = [
    { day: 1, startPage: 1, endPage: 1 },
    { day: 2, startPage: 2, endPage: 3 },
    { day: 3, startPage: 4, endPage: 5 },
    { day: 4, startPage: 6, endPage: 8 },
    { day: 5, startPage: 9, endPage: 12 },
    { day: 6, startPage: 13, endPage: 16 },
  ];

  assert.deepEqual(calculateReadingStatistics(days), {
    average: 16 / 6,
    median: 2.5,
    minimum: 1,
    maximum: 4,
    medianDays: [2, 3, 4],
    minimumDays: [1],
    maximumDays: [5, 6],
  });
});

test("rejects empty or invalid page ranges", () => {
  assert.throws(() => calculateReadingStatistics([]), RangeError);
  assert.throws(() => calculateReadingStatistics([
    { day: 1, startPage: 8, endPage: 7 },
  ]), RangeError);
});
