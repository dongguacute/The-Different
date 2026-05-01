"use client";

import React, { useState, useEffect } from "react";
import { ChatSidebar, Session } from "./ChatSidebar";
import { ChatMessage, Message } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { LuPanelLeftOpen } from "react-icons/lu";

export function ChatLayout() {
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 状态：所有会话、当前选中的会话ID、所有会话的消息记录（通过会话ID映射）
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({});

  // 初始加载：从 localStorage 读取数据，并根据屏幕宽度决定侧边栏初始状态
  useEffect(() => {
    setIsMounted(true);
    
    try {
      const savedSessions = localStorage.getItem("chat_sessions");
      const savedMessages = localStorage.getItem("chat_messages");
      
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions));
      }
      if (savedMessages) {
        setAllMessages(JSON.parse(savedMessages));
      }
    } catch (e) {
      console.error("Failed to parse chat data from localStorage", e);
    }

    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  }, []);

  // 持久化 sessions 到 localStorage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("chat_sessions", JSON.stringify(sessions));
    }
  }, [sessions, isMounted]);

  // 持久化所有 messages 到 localStorage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("chat_messages", JSON.stringify(allMessages));
    }
  }, [allMessages, isMounted]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setAllMessages((prev) => {
      const newMessages = { ...prev };
      delete newMessages[id];
      return newMessages;
    });
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const handleSend = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };
    
    let activeSessionId = currentSessionId;

    // 如果当前没有选中的会话（新建对话状态），则创建一个新会话
    if (!activeSessionId) {
      activeSessionId = Date.now().toString();
      const newSession: Session = {
        id: activeSessionId,
        title: content.slice(0, 15) + (content.length > 15 ? "..." : ""),
        date: new Date().toLocaleDateString()
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(activeSessionId);
    }

    const finalSessionId = activeSessionId;

    setAllMessages(prev => {
      const currentMessages = prev[finalSessionId] || [];
      return {
        ...prev,
        [finalSessionId]: [...currentMessages, newMessage]
      };
    });
    
    setIsLoading(true);

    // 模拟AI回复
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "这是一个模拟的 AI 回复。你可以根据自己的需求在这里进行更多的定制化设计。",
      };
      
      setAllMessages(prev => {
        const currentMessages = prev[finalSessionId] || [];
        return {
          ...prev,
          [finalSessionId]: [...currentMessages, response]
        };
      });
      setIsLoading(false);
    }, 1500);
  };

  // 避免在客户端挂载前渲染内容，防止与服务器端渲染的内容不匹配（SSR Hydration 错误）
  if (!isMounted) return null;

  // 当前会话的消息列表
  const messages = currentSessionId ? (allMessages[currentSessionId] || []) : [];

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-white dark:bg-[#121212]">
      {/* 侧边栏 */}
      <ChatSidebar 
        isOpen={isSidebarOpen} 
        onToggle={toggleSidebar}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* 移动端侧边栏展开时的遮罩 */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 主聊天区域 */}
      <main className="relative flex flex-1 flex-col min-w-0 overflow-hidden transition-all duration-300">
        {/* 顶部导航 (移动端) */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800 md:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <LuPanelLeftOpen size={20} />
            </button>
            <span className="font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
              The Different
            </span>
          </div>
        </header>

        {/* 桌面端切换侧边栏按钮 (悬浮) */}
        <div 
          className={`absolute left-4 top-4 z-20 hidden transition-all duration-300 md:block ${
            isSidebarOpen ? "opacity-0 pointer-events-none -translate-x-4" : "opacity-100 translate-x-0"
          }`}
        >
          <button
            onClick={toggleSidebar}
            className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-500 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-[#1a1a1a] dark:text-zinc-400 dark:hover:bg-zinc-800"
            title="打开侧边栏"
          >
            <LuPanelLeftOpen size={20} />
          </button>
        </div>

        {/* 聊天内容滚动区 */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-8 sm:px-6 md:py-12">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                <div className="mb-6 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800">
                  <span className="text-4xl">👋</span>
                </div>
                <h2 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
                  欢迎使用 The Different
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400">
                  你可以问我任何问题，或者让我帮你处理各种任务
                </p>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 pb-20">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="flex w-full justify-start mb-6">
                    <div className="flex max-w-[85%] gap-4 rounded-2xl bg-white p-4 text-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 dark:bg-[#1a1a1a] dark:text-zinc-100 rounded-bl-sm md:max-w-[75%]">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <span className="animate-pulse text-lg">⋯</span>
                      </div>
                      <div className="flex items-center">
                        <div className="flex space-x-1.5">
                          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]"></div>
                          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]"></div>
                          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 底部输入框 */}
        <div className="shrink-0 bg-linear-to-t from-white via-white to-transparent pt-6 dark:from-[#121212] dark:via-[#121212]">
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}
