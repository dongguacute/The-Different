"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { type apiConfig } from "@the-different/core";

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
    <div className="min-h-screen bg-zinc-50 dark:bg-[#121212] py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">设置 (Settings)</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              配置您的 API 密钥和模型信息。
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-zinc-300 dark:border-zinc-700 shadow-sm text-sm font-medium rounded-md text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            返回聊天
          </Link>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] shadow sm:rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-zinc-900 dark:text-zinc-100">
              API 配置
            </h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="baseURL" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Base URL
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="baseURL"
                    id="baseURL"
                    value={apiSettings.baseURL || ""}
                    onChange={(e) => setApiSettings({ ...apiSettings, baseURL: e.target.value })}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-zinc-300 dark:border-zinc-700 rounded-md p-2 border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="apiKey" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  API Key
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    name="apiKey"
                    id="apiKey"
                    value={apiSettings.apiKey || ""}
                    onChange={(e) => setApiSettings({ ...apiSettings, apiKey: e.target.value })}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-zinc-300 dark:border-zinc-700 rounded-md p-2 border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="model" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Model
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="model"
                    id="model"
                    value={apiSettings.model || ""}
                    onChange={(e) => setApiSettings({ ...apiSettings, model: e.target.value })}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-zinc-300 dark:border-zinc-700 rounded-md p-2 border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                    placeholder="gpt-4o"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {isSaved ? "已保存!" : "保存设置"}
          </button>
        </div>
      </div>
    </div>
  );
}
