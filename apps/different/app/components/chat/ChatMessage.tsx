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
  onSelectPlan?: (plan: { name: string; location: string }) => void;
}

export function ChatMessage({ message, onSelectPlan }: ChatMessageProps) {
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

  // 提取 AI 回复中的单独导航点（用于“立即出发”按钮）
  const navigateTo = useMemo(() => {
    if (isUser) return null;
    const regex = /###\s*导航至[:：]\s*([^\n\*]+)/;
    const match = regex.exec(message.content);
    if (match) {
      return match[1].trim();
    }
    return null;
  }, [message.content, isUser]);

  const handleNavigate = (location: string) => {
    setIsNavigating(true);
    
    const fallbackSearch = () => {
      window.open(`https://www.amap.com/search?query=${encodeURIComponent(location)}`, "_blank");
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
        const url = `https://www.amap.com/dir?from[name]=我的位置&from[lnglat]=${longitude},${latitude}&to[name]=${encodeURIComponent(location)}`;
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

  const handlePlanClick = (plan: { name: string; location: string }) => {
    if (onSelectPlan) {
      onSelectPlan(plan);
    } else {
      handleNavigate(plan.location);
    }
  };

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isUser
              ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              : "bg-black text-white dark:bg-white dark:text-black"
          }`}
        >
          {isUser ? <LuUser size={18} /> : <LuBot size={18} />}
        </div>

        <div className={`flex flex-col gap-2 min-w-0 ${isUser ? "items-end" : "items-start"}`}>
          <div
            className={`rounded-3xl px-5 py-3.5 ${
              isUser
                ? "bg-black text-white dark:bg-zinc-200 dark:text-black rounded-tr-sm"
                : "bg-white text-zinc-900 shadow-sm border border-zinc-200/50 dark:bg-[#1a1a1a] dark:text-zinc-100 dark:border-zinc-800/50 rounded-tl-sm"
            }`}
          >
            <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed text-inherit">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content || ""}
              </ReactMarkdown>
            </div>
          </div>

          {plans.length > 0 && (
            <div className="mt-1 flex flex-col gap-2">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">
                选择你喜欢的方案：
              </span>
              <div className="flex flex-wrap gap-2">
                {plans.map((plan, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePlanClick(plan)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:text-black focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white"
                  >
                    {plan.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {navigateTo && (
            <div className="mt-1 flex flex-col gap-2">
              <button
                onClick={() => handleNavigate(navigateTo)}
                disabled={isNavigating}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:bg-white dark:text-black dark:hover:bg-zinc-200 disabled:opacity-50"
              >
                <LuNavigation size={16} className={isNavigating ? "animate-pulse" : ""} />
                立即出发 ({navigateTo})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
