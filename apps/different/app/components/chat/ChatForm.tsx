"use client";

import React, { useState } from "react";
import { 
  LuMapPin, 
  LuUser, 
  LuUsers, 
  LuHeart, 
  LuText, 
  LuSparkles, 
  LuWand 
} from "react-icons/lu";

export type ChatFormData = {
  text: string;
  city: string;
  age: number;
  gender: "male" | "female" | undefined;
  numberOfPeople: number;
  relationship?: string;
};

interface ChatFormProps {
  onSubmit: (data: ChatFormData) => void;
  isLoading?: boolean;
}

export function ChatForm({ onSubmit, isLoading }: ChatFormProps) {
  const [formData, setFormData] = useState<ChatFormData>({
    text: "",
    city: "北京",
    age: 25,
    gender: undefined,
    numberOfPeople: 1,
    relationship: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "age" || name === "numberOfPeople"
          ? parseInt(value) || 0
          : value === "undefined" && name === "gender"
          ? undefined
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="mx-auto w-full max-w-lg rounded-3xl border border-zinc-200/80 bg-white/80 p-8 shadow-xs backdrop-blur-xl dark:border-zinc-800/80 dark:bg-[#1a1a1a]/80">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/50">
          <LuSparkles className="h-6 w-6 text-zinc-900 dark:text-zinc-100" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          开启新旅程
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          告诉我一些基本信息，为你定制专属的出游计划
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            目的地
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <LuMapPin className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="text"
              name="city"
              required
              value={formData.city}
              onChange={handleChange}
              className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-3 text-sm text-zinc-900 transition-colors focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:border-white dark:focus:bg-zinc-900 dark:focus:ring-white"
              placeholder="例如：北京、上海、大理..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              年龄
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <LuUser className="h-4 w-4 text-zinc-400" />
              </div>
              <input
                type="number"
                name="age"
                required
                min="1"
                max="120"
                value={formData.age}
                onChange={handleChange}
                className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-3 text-sm text-zinc-900 transition-colors focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:border-white dark:focus:bg-zinc-900 dark:focus:ring-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              性别
            </label>
            <div className="relative">
              <select
                name="gender"
                value={formData.gender || "undefined"}
                onChange={handleChange}
                className="block w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-3.5 pr-10 text-sm text-zinc-900 transition-colors focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:border-white dark:focus:bg-zinc-900 dark:focus:ring-white"
              >
                <option value="undefined">保密 / 不限</option>
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                <LuUser className="h-4 w-4 text-zinc-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              出行人数
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <LuUsers className="h-4 w-4 text-zinc-400" />
              </div>
              <input
                type="number"
                name="numberOfPeople"
                required
                min="1"
                value={formData.numberOfPeople}
                onChange={handleChange}
                className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-3 text-sm text-zinc-900 transition-colors focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:border-white dark:focus:bg-zinc-900 dark:focus:ring-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              关系 <span className="font-normal text-zinc-400">(多人时)</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <LuHeart className="h-4 w-4 text-zinc-400" />
              </div>
              <input
                type="text"
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                disabled={formData.numberOfPeople < 2}
                className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-3 text-sm text-zinc-900 transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:border-white dark:focus:bg-zinc-900 dark:focus:ring-white"
                placeholder="例如：情侣、死党..."
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            想去干嘛 / 随便聊聊
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute top-3.5 left-0 flex pl-3.5">
              <LuText className="h-4 w-4 text-zinc-400" />
            </div>
            <textarea
              name="text"
              value={formData.text}
              onChange={handleChange}
              rows={3}
              className="block w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-3 text-sm text-zinc-900 transition-colors focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:border-white dark:focus:bg-zinc-900 dark:focus:ring-white"
              placeholder="想去拍照好看的地方，预算200内，或者是完全没头绪求推荐..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-black py-3.5 text-sm font-medium text-white transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-80 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {isLoading ? (
            <>
              <LuWand className="h-4 w-4 animate-spin" />
              正在施展魔法...
            </>
          ) : (
            <>
              <LuSparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
              生成灵感计划
            </>
          )}
        </button>
      </form>
    </div>
  );
}
