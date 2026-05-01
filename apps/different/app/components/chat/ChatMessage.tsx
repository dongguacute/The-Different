"use client";

import React from "react";
import { LuBot, LuUser } from "react-icons/lu";

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
            {message.content}
          </div>
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
