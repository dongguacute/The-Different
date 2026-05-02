"use client";

import React from "react";
import Link from "next/link";
import { LuMessageSquare, LuPlus, LuSettings, LuTrash2, LuPanelLeftClose } from "react-icons/lu";

export interface Session {
  id: string;
  title: string;
  date: string;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: Session[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

export function ChatSidebar({ 
  isOpen, 
  onToggle, 
  sessions, 
  currentSessionId, 
  onNewChat, 
  onSelectSession,
  onDeleteSession
}: ChatSidebarProps) {
  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-white/80 backdrop-blur-xl border-r border-zinc-200/80 transition-all duration-300 ease-in-out dark:bg-[#1a1a1a]/80 dark:border-zinc-800/80 md:relative ${
        isOpen ? "translate-x-0" : "-translate-x-full md:-ml-64"
      }`}
    >
      {/* 头部区域 */}
      <div className="flex h-16 shrink-0 items-center justify-between px-4">
        <span className="text-lg font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
          The Different
        </span>
        <button
          onClick={onToggle}
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
          title="收起侧边栏"
        >
          <LuPanelLeftClose size={20} />
        </button>
      </div>

      {/* 新建对话按钮 */}
      <div className="px-4 py-2 shrink-0">
        <button 
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-medium text-white shadow-sm transition-all hover:scale-[1.02] hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          <LuPlus size={18} />
          新建对话
        </button>
      </div>

      {/* 历史记录列表 */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-3 px-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          近期对话
        </div>
        <div className="space-y-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`group flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all ${
                currentSessionId === session.id
                  ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/50 dark:bg-zinc-800/80 dark:text-zinc-100 dark:ring-zinc-700/50"
                  : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100"
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectSession(session.id);
                }
              }}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <LuMessageSquare size={16} className={`shrink-0 ${currentSessionId === session.id ? "text-black dark:text-white" : "opacity-70"}`} />
                <span className="truncate font-medium">{session.title}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="flex items-center justify-center rounded-lg p-1.5 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                title="删除对话"
              >
                <LuTrash2 size={14} className="shrink-0" />
              </button>
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="text-center py-4 text-sm text-zinc-400 dark:text-zinc-500">
              暂无对话记录
            </div>
          )}
        </div>
      </div>

      {/* 底部设置区 */}
      <div className="shrink-0 border-t border-zinc-200 p-4 dark:border-zinc-800">
        <Link href="/settings" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition-all hover:bg-white hover:text-zinc-900 hover:shadow-sm hover:ring-1 hover:ring-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100 dark:hover:ring-zinc-700/50">
          <LuSettings size={18} />
          <span>设置</span>
        </Link>
      </div>
    </div>
  );
}
