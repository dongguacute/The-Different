"use client";

import React, { useState, useRef, useEffect } from "react";
import { LuSend, LuPaperclip, LuMic } from "react-icons/lu";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [content]);

  const handleSend = () => {
    if (!content.trim() || isLoading) return;
    onSend(content);
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 pb-6 pt-2 sm:px-6">
      <div className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm focus-within:ring-1 focus-within:ring-black dark:border-zinc-700 dark:bg-[#1a1a1a] dark:focus-within:ring-white">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="有什么我可以帮你的？"
          className="max-h-[200px] w-full resize-none border-0 bg-transparent py-4 pl-4 pr-12 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0 dark:text-zinc-100"
          rows={1}
        />
        
        {/* 底部工具栏 */}
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-1">
            <button
              title="附加文件"
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <LuPaperclip size={18} />
            </button>
            <button
              title="语音输入"
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <LuMic size={18} />
            </button>
          </div>

          <button
            onClick={handleSend}
            disabled={!content.trim() || isLoading}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              content.trim() && !isLoading
                ? "bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
            }`}
          >
            <LuSend size={16} />
          </button>
        </div>
      </div>
      <div className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
        AI 生成的内容可能存在误差，请自行核实。
      </div>
    </div>
  );
}
