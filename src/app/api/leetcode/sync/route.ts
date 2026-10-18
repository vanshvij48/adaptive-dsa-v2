import { NextRequest, NextResponse } from "next/server";

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

async function leetcodeQuery(
  query: string,
  variables: Record<string, unknown>
) {
  const response = await fetch(LEETCODE_GRAPHQL_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0",
      Referer: "https://leetcode.com/",
    },

    body: JSON.stringify({
      query,
      variables,
    }),

    cache: "no-store",
  });

  const text = await response.text();

  console.log("LeetCode HTTP:", response.status);
  console.log("LeetCode response:", text.substring(0, 2000));

  if (!response.ok) {
    throw new Error(
      `LeetCode returned HTTP ${response.status}`
    );
  }

  const result = JSON.parse(text);

  if (result.errors) {
    console.error(
      "LeetCode GraphQL errors:",
      result.errors
    );

    throw new Error(
      result.errors[0]?.message ||
        "LeetCode GraphQL request failed"
    );
  }

  return result.data;
}


// ==========================================
// PROFILE
// ==========================================

const profileQuery = `
  query userProfile($username: String!) {
    matchedUser(username: $username) {
      username

      profile {
        ranking
        realName
      }

      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
  }
`;


// ==========================================
// RECENT ACCEPTED SUBMISSIONS
// ==========================================

const submissionsQuery = `
  query recentAcSubmissions(
    $username: String!
    $limit: Int!
  ) {
    recentAcSubmissionList(
      username: $username
      limit: $limit
    ) {
      id
      title
      titleSlug
      timestamp
    }
  }
`;


// ==========================================
// PROBLEM DETAILS
// ==========================================

const problemQuery = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      title
      titleSlug
      difficulty

      topicTags {
        name
        slug
      }
    }
  }
`;


export async function POST(
  request: NextRequest
) {
  try {

    const body = await request.json();

    const username =
      body.username?.trim();

    if (!username) {
      return NextResponse.json(
        {
          error:
            "LeetCode username is required",
        },
        {
          status: 400,
        }
      );
    }


    // ========================================
    // 1. PROFILE
    // ========================================

    const profileData =
      await leetcodeQuery(
        profileQuery,
        {
          username,
        }
      );

    const user =
      profileData?.matchedUser;

    if (!user) {
      return NextResponse.json(
        {
          error:
            "LeetCode username not found",
        },
        {
          status: 404,
        }
      );
    }


    // ========================================
    // 2. RECENT ACCEPTED PROBLEMS
    // ========================================

    const submissionData =
      await leetcodeQuery(
        submissionsQuery,
        {
          username,

          // IMPORTANT:
          // Keep this <= 20
          limit: 20,
        }
      );


    const submissions =
      submissionData
        ?.recentAcSubmissionList || [];


    console.log(
      "Accepted submissions:",
      submissions.length
    );


    // ========================================
    // 3. REMOVE DUPLICATES
    // ========================================

    const uniqueProblems =
      new Map<string, any>();


    for (
      const submission of submissions
    ) {

      if (!submission.titleSlug) {
        continue;
      }

      if (
        !uniqueProblems.has(
          submission.titleSlug
        )
      ) {

        uniqueProblems.set(
          submission.titleSlug,
          submission
        );
      }
    }


    // ========================================
    // 4. GET PROBLEM DETAILS
    // ========================================

    const problems: any[] = [];


    for (
      const submission of
        uniqueProblems.values()
    ) {

      try {

        const data =
          await leetcodeQuery(
            problemQuery,
            {
              titleSlug:
                submission.titleSlug,
            }
          );


        const question =
          data?.question;


        if (!question) {
          continue;
        }


        problems.push({
  questionId: question.questionId,

  title: question.title,

  slug: question.titleSlug,

  difficulty: question.difficulty,

  topics:
    question.topicTags?.map(
      (tag: any) => tag.name
    ) || [],

  solved_at:
    submission.timestamp
      ? new Date(
          Number(submission.timestamp) * 1000
        ).toISOString()
      : null,
});

      } catch (error) {

        console.error(
          `Problem error: ${submission.titleSlug}`,
          error
        );

      }
    }


    // ========================================
    // 5. PROFILE COUNTS
    // ========================================

    const stats =
      user.submitStatsGlobal
        ?.acSubmissionNum || [];


    let totalSolved = 0;
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;


    for (
      const item of stats
    ) {

      const count =
        Number(item.count) || 0;


      if (
        item.difficulty === "All"
      ) {
        totalSolved = count;
      }


      if (
        item.difficulty === "Easy"
      ) {
        easySolved = count;
      }


      if (
        item.difficulty === "Medium"
      ) {
        mediumSolved = count;
      }


      if (
        item.difficulty === "Hard"
      ) {
        hardSolved = count;
      }
    }


    // ========================================
    // 6. RETURN
    // ========================================

    return NextResponse.json({

      success: true,

      profile: {

        username:
          user.username,

        ranking:
          user.profile?.ranking ??
          null,

        realName:
          user.profile?.realName ??
          null,

        totalSolved,

        easySolved,

        mediumSolved,

        hardSolved,
      },

      problems,

    });


  } catch (error) {

    console.error(
      "LeetCode sync error:",
      error
    );


    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}