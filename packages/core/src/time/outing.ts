const DEFAULT_ZONE = "Asia/Shanghai";

function hourInZone(now: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);
  const raw = parts.find((p) => p.type === "hour")?.value;
  const h = raw !== undefined ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(h) ? h : 12;
}

function addUtcDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 86_400_000);
}

function formatZhFullDate(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);
}

function formatZhTimeHm(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}

/** 给出「今日 / 明日」文案与凌晨 3 点前的叙事口径（国内默认可用上海时区）。 */
export type OutingDateContext = {
  timeZone: string;
  localNowZh: string;
  calendarTodayZh: string;
  calendarTomorrowZh: string;
  /** 当地时间 0–2 点为 true：以更「活在当下」的语气优先围绕「今日」来定调行程 */
  isBeforeThreeAM: boolean;
  /** 可直接贴进模型的日期策略说明句 */
  datePolicyLineZh: string;
};

export function getOutingDateContext(
  now = new Date(),
  timeZone = DEFAULT_ZONE,
): OutingDateContext {
  const isBeforeThreeAM = hourInZone(now, timeZone) < 3;

  const calendarTodayZh = formatZhFullDate(now, timeZone);
  const calendarTomorrowZh = formatZhFullDate(addUtcDays(now, 1), timeZone);

  const datePolicyLineZh = isBeforeThreeAM
    ? "当前为当地凌晨 3 点前：和用户聊「啥时候玩」时，以「今天就冲 / 天亮后就能安排」来定主叙事；明日晴雨仍可参考下面预报做穿衣与雨具建议。"
    : "已过当地凌晨 3 点：以「明天怎么玩」作主时间轴来写推荐，并结合明日晴雨把期待感说清楚。";

  return {
    timeZone,
    localNowZh: `${calendarTodayZh} ${formatZhTimeHm(now, timeZone)}`,
    calendarTodayZh,
    calendarTomorrowZh,
    isBeforeThreeAM,
    datePolicyLineZh,
  };
}
