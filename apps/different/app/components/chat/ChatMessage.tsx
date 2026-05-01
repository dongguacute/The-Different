"use client";

import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LuBot, LuUser, LuNavigation } from "react-icons/lu";

export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [isNavigating, setIsNavigating] = useState(false);

  // 提取 AI 回复中的方案名字和落脚点
  const plans = useMemo(() => {
    if (isUser) return [];
    // 匹配 "### 方案：XXX | 导航至：YYY" 或者兼容旧的 "### 方案：XXX"
    const regex = /###\s*方案[:：]\s*([^\|\n]+)(?:(?:\||｜)\s*导航至[:：]\s*([^\n\*]+))?/g;
    const matches = [];
    let match;
    while ((match = regex.exec(message.content)) !== null) {
      const name = match[1].trim();
      const location = (match[2] || name).trim(); // 如果没有导航至，回退使用路线名本身
      matches.push({ name, location });
    }
    return matches;
  }, [message.content, isUser]);

  const handlePlanClick = (plan: { name: string; location: string }) => {
    setIsNavigating(true);
    
    const fallbackSearch = () => {
      window.open(`https://www.amap.com/search?query=${encodeURIComponent(plan.location)}`, "_blank");
      setIsNavigating(false);
    };

    if (!navigator.geolocation) {
      alert("您的浏览器不支持获取地理位置");
      fallbackSearch();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://www.amap.com/dir?from[name]=我的位置&from[lnglat]=${longitude},${latitude}&to[name]=${encodeURIComponent(plan.location)}`;
        window.open(url, "_blank");
        setIsNavigating(false);
      },
      (error) => {
        console.error("获取位置失败", error);
        alert("获取地理位置失败，将为您直接搜索该地点");
        fallbackSearch();
      },
      { timeout: 5000 }
    );
  };

  return (
    <div
      className={`flex w-full ${
        isUser ? "justify-end" : "justify-start"
      } mb-6`}
    >
      <div
        className={`flex max-w-[85%] gap-4 rounded-2xl p-4 md:max-w-[75%] ${
          isUser
            ? "bg-black text-white dark:bg-zinc-200 dark:text-black rounded-br-sm"
            : "bg-white text-zinc-900 shadow-sm border border-zinc-100 dark:bg-[#1a1a1a] dark:text-zinc-100 dark:border-zinc-800 rounded-bl-sm"
        }`}
      >
        {!isUser && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <LuBot size={18} />
          </div>
        )}
        <div className="flex-1 space-y-2 overflow-hidden px-1">
          <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed text-inherit">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content || ""}
            </ReactMarkdown>
          </div>
          
          {plans.length > 0 && (
            <div className="mt-4 flex flex-col gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                可快捷导航的方案：
              </span>
              <div className="flex flex-wrap gap-2">
                {plans.map((plan, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePlanClick(plan)}
                    disabled={isNavigating}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-black focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white disabled:opacity-50"
                  >
                    <LuNavigation size={14} className={isNavigating ? "animate-pulse" : ""} />
                    {plan.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {isUser && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 dark:bg-zinc-300 dark:text-black text-white">
            <LuUser size={18} />
          </div>
        )}
      </div>
    </div>
  );
}
