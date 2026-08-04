import api from './api';
import { AskEndpoints } from '../constants/endpoint';

export function getRelativeDay(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return "Today";
  if (diffDays === 2) return "Yesterday";
  return `${diffDays} days ago`;
}

export async function voteOnAnswer(
  answerId: string,
  voteType: "UP" | "DOWN",
  setQuestions: React.Dispatch<React.SetStateAction<any[]>>,
) {
  try {
    const res = await api.post(AskEndpoints.voteAnswer(answerId), { voteType });
    if (res.status === 200) {
      const updatedAnswer = res.data;
      setQuestions((prev) =>
        prev.map((q) => {
          const updatedAnswers = q.answers.map((a: any) =>
            a.id === answerId ? { ...a, upvotes: updatedAnswer.upvotes, downvotes: updatedAnswer.downvotes } : a
          );
          return { ...q, answers: updatedAnswers };
        })
      );
    }
  } catch (err) {
    console.error("Failed to vote:", err);
  }
}
