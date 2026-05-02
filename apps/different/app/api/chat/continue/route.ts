import { NextRequest, NextResponse } from "next/server";
import { createOpenAICompatibleClient, searchDouyinInspirationHints } from "@the-different/core";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, apiSettings, location, action } = body;

    // Prefer frontend API settings, then environment variables, then dummy key
    const client = createOpenAICompatibleClient({
      apiKey: apiSettings?.apiKey || process.env.OPENAI_API_KEY || "sk-dummy",
      baseURL: apiSettings?.baseURL || process.env.OPENAI_BASE_URL,
    });

    if (client.apiKey === "sk-dummy" && (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-dummy")) {
      const mockText = `[模拟生成] 收到你的消息。\n\n由于当前未配置真实的 OPENAI_API_KEY（请在设置页面配置），这里返回模拟数据。\n\n${
        action === "plan_selected"
          ? `关于【${location}】：\n- 门票：免费\n- 评价：非常棒，值得一去\n- 攻略：建议早上早点去，避开人流。\n\n### 导航至：${location}`
          : "这是一条普通的模拟回复。"
      }`;
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

    const finalMessages = [...messages];

    // If this is a plan selection action, we can fetch some real-time info and inject it as a system prompt
    if (action === "plan_selected" && location) {
      try {
        const hits = await searchDouyinInspirationHints({
          city: location,
          extraHints: "门票 攻略 评价",
          maxResults: 5,
        });

        let searchContext = "";
        if (hits.length > 0) {
          searchContext = hits.map((h, i) => `${i + 1}. ${h.title}\n摘要: ${h.snippet}`).join("\n");
        } else {
          searchContext = "暂无最新搜索结果。";
        }

        const systemInstruction = `\n\n【系统提示：请根据以下最新的抖音搜索摘要，总结该地点是否需要门票、精选评价和游玩攻略。】
搜索摘要：
${searchContext}

要求：
1. 语气保持活泼、像朋友一样。
2. 明确说明门票情况、精选评价和攻略。
3. **必须**在回答的最后一行输出：\`### 导航至：${location}\`，以便前端提取并显示“立即出发”按钮。`;

        // Append the instruction to the last user message
        const lastMessage = finalMessages[finalMessages.length - 1];
        if (lastMessage && lastMessage.role === "user") {
          lastMessage.content += systemInstruction;
        }
      } catch (e) {
        console.error("Failed to search douyin info:", e);
      }
    }

    const completion = await client.chat.completions.create({
      model: apiSettings?.model || process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages: finalMessages,
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
