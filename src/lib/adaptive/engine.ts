export type Difficulty = "easy" | "medium" | "hard";

export type TopicSkill = {
  topicId: string;
  topicName: string;
  skill: number;          // 0..100
  recentAccuracy: number; // 0..100
  solved: number;
};

export type CandidateQuestion = {
  id: string;
  topicId: string;
  topicName: string;
  difficulty: Difficulty;
  solvedByUser: boolean;
  timesSeen: number;
};

function difficultyValue(d: Difficulty) {
  return d === "easy" ? 30 : d === "medium" ? 60 : 90;
}

function targetDifficulty(skill: number): Difficulty {
  if (skill < 40) return "easy";
  if (skill < 70) return "medium";
  return "hard";
}

export function chooseNextQuestion(
  skills: TopicSkill[],
  candidates: CandidateQuestion[]
): CandidateQuestion | null {
  if (!candidates.length) return null;

  const weakest = [...skills].sort((a, b) => a.skill - b.skill)[0];
  if (!weakest) return candidates.find(q => !q.solvedByUser) ?? candidates[0];

  const target = targetDifficulty(weakest.skill);

  const scored = candidates.map(q => {
    const weaknessMatch = q.topicId === weakest.topicId ? 50 : 0;
    const difficultyMatch = 30 - Math.abs(difficultyValue(q.difficulty) - difficultyValue(target)) / 2;
    const unseenBonus = q.timesSeen === 0 ? 15 : 0;
    const solvedPenalty = q.solvedByUser ? -40 : 0;

    return {
      q,
      score: weaknessMatch + difficultyMatch + unseenBonus + solvedPenalty
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].q;
}

export function updateSkill(
  oldSkill: number,
  correct: boolean,
  difficulty: Difficulty,
  timeRatio = 1
): number {
  const difficultyWeight =
    difficulty === "easy" ? 0.7 :
    difficulty === "medium" ? 1.0 : 1.3;

  const baseChange = correct ? 5 : -6;
  const timeAdjustment = correct ? Math.max(0.5, Math.min(1.25, 1 / timeRatio)) : 1;

  const next = oldSkill + baseChange * difficultyWeight * timeAdjustment;
  return Math.max(0, Math.min(100, Math.round(next)));
}