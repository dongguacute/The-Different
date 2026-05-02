"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { type apiConfig } from "@the-different/core";
import { 
  LuSettings, 
  LuKey, 
  LuLink, 
  LuCpu, 
  LuArrowLeft, 
  LuCheck, 
  LuSave 
} from "react-icons/lu";

export default function SettingsPage() {
  const [apiSettings, setApiSettings] = useState<apiConfig>({
    baseURL: "",
    apiKey: "",
    model: "",
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    const savedApi = localStorage.getItem("apiSettings");
    if (savedApi) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setApiSettings(JSON.parse(savedApi));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("apiSettings", JSON.stringify(apiSettings));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-[#121212] py-12 px-4 sm:px-6 lg:px-8 transition-colors flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/50">
              <LuSettings className="h-6 w-6 text-zinc-900 dark:text-zinc-100" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                模型设置
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                配置您的 API 密钥和模型信息，以启用 AI 功能
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 transition-all hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-[#1a1a1a] dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 shadow-sm"
          >
            <LuArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            返回聊天
          </Link>
        </div>

        {/* Form Card */}
        <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/80 p-8 shadow-sm backdrop-blur-xl dark:border-zinc-800/80 dark:bg-[#1a1a1a]/80">
          <div className="space-y-6">
            {/* Base URL */}
            <div>
              <label htmlFor="baseURL" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                API 地址 (Base URL)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <LuLink className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  type="text"
                  name="baseURL"
                  id="baseURL"
                  value={apiSettings.baseURL || ""}
                  onChange={(e) => setApiSettings({ ...apiSettings, baseURL: e.target.value })}
                  className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-3 text-sm text-zinc-900 transition-colors focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:border-white dark:focus:bg-zinc-900 dark:focus:ring-white"
                  placeholder="例如：https://api.openai.com/v1"
                />
              </div>
            </div>

            {/* API Key */}
            <div>
              <label htmlFor="apiKey" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                API 密钥 (API Key)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <LuKey className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  type="password"
                  name="apiKey"
                  id="apiKey"
                  value={apiSettings.apiKey || ""}
                  onChange={(e) => setApiSettings({ ...apiSettings, apiKey: e.target.value })}
                  className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-3 text-sm text-zinc-900 transition-colors focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:border-white dark:focus:bg-zinc-900 dark:focus:ring-white"
                  placeholder="sk-..."
                />
              </div>
            </div>

            {/* Model */}
            <div>
              <label htmlFor="model" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                模型名称 (Model)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <LuCpu className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  type="text"
                  name="model"
                  id="model"
                  value={apiSettings.model || ""}
                  onChange={(e) => setApiSettings({ ...apiSettings, model: e.target.value })}
                  className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-3 text-sm text-zinc-900 transition-colors focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:border-white dark:focus:bg-zinc-900 dark:focus:ring-white"
                  placeholder="例如：gpt-4o"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className={`group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-3 text-sm font-medium text-white transition-all ${
                isSaved 
                  ? "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600" 
                  : "bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              }`}
            >
              {isSaved ? (
                <>
                  <LuCheck className="h-4 w-4" />
                  已保存
                </>
              ) : (
                <>
                  <LuSave className="h-4 w-4 transition-transform group-hover:scale-110" />
                  保存设置
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
