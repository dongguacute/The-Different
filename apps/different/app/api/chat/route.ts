import { NextRequest, NextResponse } from "next/server";
import { createOpenAICompatibleClient, buildOutingPlannerChatMessages } from "@the-different/core/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, city, age, gender, numberOfPeople, relationship, apiSettings } = body;

    // Prepare the messages using core logic
    const plannerMessages = await buildOutingPlannerChatMessages({
      messageSansWeather: {
        text: text || "",
        city: city || "北京",
        age: age || 25,
        gender: gender,
        numberOfPeople: numberOfPeople || 1,
        relationship: relationship,
      },
    });

    // Prefer frontend API settings, then environment variables, then dummy key
    const client = createOpenAICompatibleClient({
      apiKey: apiSettings?.apiKey || process.env.OPENAI_API_KEY || "sk-dummy",
      baseURL: apiSettings?.baseURL || process.env.OPENAI_BASE_URL,
    });

    // If the dummy key is used, mock the response to avoid 401 error
    if (client.apiKey === "sk-dummy" && (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-dummy")) {
      const mockText = `[模拟生成] 行程规划完毕。\n\n由于当前未配置真实的 OPENAI_API_KEY（请在设置页面配置），这里返回模拟数据。\n\n目的地：${city}\n人数：${numberOfPeople}\n\n建议行程：\n1. 早上：喝咖啡。\n2. 中午：吃饭。\n3. 晚上：睡觉。`;
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(mockText));
            controller.close();
          }
        }),
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    const completion = await client.chat.completions.create({
      model: apiSettings?.model || process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages: plannerMessages,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 }
    );
  }
}
