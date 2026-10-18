import { NextResponse } from "next/server";
import { chooseNextQuestion } from "@/lib/adaptive/engine";

export async function GET() {
  const skills = [
    { topicId:"dp", topicName:"Dynamic Programming", skill:38, recentAccuracy:45, solved:8 },
    { topicId:"graph", topicName:"Graph", skill:51, recentAccuracy:55, solved:14 }
  ];

  const candidates = [
    { id:"q1", topicId:"dp", topicName:"Dynamic Programming", difficulty:"easy" as const, solvedByUser:false, timesSeen:0 },
    { id:"q2", topicId:"dp", topicName:"Dynamic Programming", difficulty:"medium" as const, solvedByUser:false, timesSeen:0 },
    { id:"q3", topicId:"graph", topicName:"Graph", difficulty:"medium" as const, solvedByUser:false, timesSeen:0 }
  ];

  return NextResponse.json({ question: chooseNextQuestion(skills, candidates) });
}