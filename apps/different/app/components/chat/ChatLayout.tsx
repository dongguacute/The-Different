"use client";

import React, { useState, useEffect } from "react";
import { ChatSidebar, Session } from "./ChatSidebar";
import { ChatMessage, Message } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatForm, type ChatFormData } from "./ChatForm";
import { LuPanelLeftOpen, LuBot } from "react-icons/lu";

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const handleSend = async (content: string, isPlanSelection = false, location?: string) => {
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

    try {
      const savedApi = localStorage.getItem("apiSettings");
      let apiSettings = undefined;
      if (savedApi) {
        try {
          apiSettings = JSON.parse(savedApi);
        } catch {
          // ignore
        }
      }

      // 获取当前会话的历史消息
      const currentMessages = allMessages[finalSessionId] || [];
      const messagesToSend = [...currentMessages, newMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/chat/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: messagesToSend, 
          apiSettings,
          action: isPlanSelection ? "plan_selected" : "chat",
          location: location
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let accumulatedContent = "";

      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: accumulatedContent,
      };

      setAllMessages(prev => {
        const currentMessages = prev[finalSessionId] || [];
        return {
          ...prev,
          [finalSessionId]: [...currentMessages, responseMessage]
        };
      });

      setIsLoading(false);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          accumulatedContent += decoder.decode(value, { stream: true });
          
          setAllMessages(prev => {
            const currentMessages = prev[finalSessionId] || [];
            const newMessages = [...currentMessages];
            const lastIndex = newMessages.length - 1;
            if (lastIndex >= 0 && newMessages[lastIndex].id === responseMessage.id) {
               newMessages[lastIndex] = { ...newMessages[lastIndex], content: accumulatedContent };
            }
            return {
              ...prev,
              [finalSessionId]: newMessages
            };
          });
        }
      }
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "请求出错，请检查网络或环境变量配置。",
      };
      setAllMessages(prev => {
        const currentMessages = prev[finalSessionId] || [];
        return {
          ...prev,
          [finalSessionId]: [...currentMessages, errorMessage]
        };
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = (plan: { name: string; location: string }) => {
    handleSend(`我选择了方案：${plan.name}。请帮我搜索相关地点（${plan.location}）需不需要门票并总结信息，精选评价和攻略。`, true, plan.location);
  };

  const handleFormSubmit = async (formData: ChatFormData) => {
    const content = formData.text || "帮我规划一下行程";
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `[行程需求] 城市: ${formData.city} | 人数: ${formData.numberOfPeople} ${formData.relationship ? `(${formData.relationship})` : ""} | 年龄: ${formData.age} | 想法: ${content}`,
    };

    let activeSessionId = currentSessionId;

    if (!activeSessionId) {
      activeSessionId = Date.now().toString();
      const newSession: Session = {
        id: activeSessionId,
        title: formData.city + "出行规划",
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

    try {
      const savedApi = localStorage.getItem("apiSettings");
      let apiSettings = undefined;
      if (savedApi) {
        try {
          apiSettings = JSON.parse(savedApi);
        } catch {
          // ignore
        }
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, apiSettings }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let accumulatedContent = "";

      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: accumulatedContent,
      };

      setAllMessages(prev => {
        const currentMessages = prev[finalSessionId] || [];
        return {
          ...prev,
          [finalSessionId]: [...currentMessages, responseMessage]
        };
      });

      setIsLoading(false); // 收到流响应后关闭 loading

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          accumulatedContent += decoder.decode(value, { stream: true });
          
          setAllMessages(prev => {
            const currentMessages = prev[finalSessionId] || [];
            const newMessages = [...currentMessages];
            const lastIndex = newMessages.length - 1;
            if (lastIndex >= 0 && newMessages[lastIndex].id === responseMessage.id) {
               newMessages[lastIndex] = { ...newMessages[lastIndex], content: accumulatedContent };
            }
            return {
              ...prev,
              [finalSessionId]: newMessages
            };
          });
        }
      }
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "请求出错，请检查网络或环境变量配置。",
      };
      setAllMessages(prev => {
        const currentMessages = prev[finalSessionId] || [];
        return {
          ...prev,
          [finalSessionId]: [...currentMessages, errorMessage]
        };
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 避免在客户端挂载前渲染内容，防止与服务器端渲染的内容不匹配（SSR Hydration 错误）
  if (!isMounted) return null;

  // 当前会话的消息列表
  const messages = currentSessionId ? (allMessages[currentSessionId] || []) : [];

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-zinc-50/50 dark:bg-[#121212]">
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
      <main className="relative flex flex-1 flex-col min-w-0 overflow-hidden bg-zinc-50/30 transition-all duration-300 dark:bg-[#121212]">
        {/* 背景网格/点阵图案 */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50 dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]" />
        {/* 顶部导航 (移动端) */}
        <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-zinc-200/50 bg-white/50 px-4 backdrop-blur-md dark:border-zinc-800/50 dark:bg-[#121212]/50 md:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
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
            className="rounded-xl border border-zinc-200/80 bg-white/80 p-2.5 text-zinc-500 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-[#1a1a1a]/80 dark:text-zinc-400 dark:hover:bg-[#1a1a1a] dark:hover:text-zinc-100"
            title="打开侧边栏"
          >
            <LuPanelLeftOpen size={20} />
          </button>
        </div>

        {/* 聊天内容滚动区 */}
        <div className="relative z-10 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-8 sm:px-6 md:py-12">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col justify-center py-4 animate-in fade-in duration-500">
                <ChatForm onSubmit={handleFormSubmit} isLoading={isLoading} />
              </div>
            ) : (
              <div className="flex flex-col space-y-2 pb-20">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} onSelectPlan={handleSelectPlan} />
                ))}
                {isLoading && (
                  <div className="flex w-full justify-start mb-6">
                    <div className="flex max-w-[85%] md:max-w-[75%] gap-3 flex-row">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
                        <LuBot size={18} />
                      </div>
                      <div className="flex flex-col gap-2 min-w-0 items-start">
                        <div className="rounded-3xl px-5 py-4 bg-white text-zinc-900 shadow-sm border border-zinc-200/50 dark:bg-[#1a1a1a] dark:text-zinc-100 dark:border-zinc-800/50 rounded-tl-sm flex items-center h-[44px]">
                          <div className="flex space-x-1.5">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></div>
                          </div>
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
        {messages.length > 0 && (
          <div className="relative z-10 shrink-0 bg-linear-to-t from-zinc-50/80 via-zinc-50/80 to-transparent pt-6 backdrop-blur-sm dark:from-[#121212] dark:via-[#121212]">
            <ChatInput onSend={(c) => handleSend(c)} isLoading={isLoading} />
          </div>
        )}
      </main>
    </div>
  );
}
