import { CsvData, FilterResult } from '../types';

// ────────────────────────────────────────────────────────────────────────────
// 基础判断积木 — 直接用这些函数组合筛选条件，不需要写 if/return
// ────────────────────────────────────────────────────────────────────────────

export function containsText(text: string | undefined, searchText: string): boolean {
  if (!text) return false;
  return text.includes(searchText);
}

/** 某字段包含指定文字 */
const has = (field: string, text: string) =>
  (row: CsvData) => containsText(row[field], text);

/** 某字段不包含指定文字 */
const no = (field: string, text: string) =>
  (row: CsvData) => !containsText(row[field], text);

/** 多个字段中，至少一个包含指定文字 */
const anyOf = (fields: string[], text: string) =>
  (row: CsvData) => fields.some(f => containsText(row[f], text));

/** 多个字段全部不包含指定文字 */
const noneOf = (fields: string[], text: string) =>
  (row: CsvData) => fields.every(f => !containsText(row[f], text));

/** 一个字段包含多个关键词中的任意一个 */
const hasAny = (field: string, keywords: string[]) =>
  (row: CsvData) => keywords.some(k => containsText(row[field], k));

/** 多个字段中，至少一个包含多个关键词中的任意一个 */
const anyKeyword = (fields: string[], keywords: string[]) =>
  (row: CsvData) => keywords.some(k => fields.some(f => containsText(row[f], k)));

/** 质检价格不为 0（绝大多数规则都需要这个条件） */
const priceNonZero = (row: CsvData) => parseFloat(row["质检价格"]) !== 0;

/** 将多个条件组合：全部满足才算命中（AND 逻辑） */
function all(...conditions: ((row: CsvData) => boolean)[]) {
  return (row: CsvData) => conditions.every(c => c(row));
}

// ────────────────────────────────────────────────────────────────────────────
// 筛选规则列表
//
// 新增规则：在对应分组末尾添加一项，参考已有写法即可。
// 格式：{ name: "规则名称", filter: all(条件1, 条件2, ...) }
//
// 常用条件速查：
//   has("字段", "文字")                      → 字段包含文字
//   no("字段", "文字")                       → 字段不包含文字
//   anyOf(["字段A","字段B"], "文字")          → 任意字段包含文字
//   noneOf(["字段A","字段B"], "文字")         → 所有字段均不包含文字
//   hasAny("字段", ["关键词1","关键词2"])      → 字段包含任意一个关键词
//   anyKeyword(["字段A","字段B"], ["词1","词2"]) → 任意字段包含任意关键词
//   priceNonZero                             → 质检价格不为 0
// ────────────────────────────────────────────────────────────────────────────
const FILTER_RULES: { name: string; filter: (row: CsvData) => boolean }[] = [

  // ── 贵金属材质 ───────────────────────────────────────────────────────────
  {
    name: "999筛选",
    filter: all(
      anyOf(["商品名称", "商品材质", "镶嵌材质"], "999"),
      priceNonZero,
      has("贵金属结论", "足金"),
      no("备注", "999"),
    ),
  },
  {
    name: "上错足金材质",
    filter: all(
      noneOf(["商品名称", "商品材质", "镶嵌材质", "配件材质"], "足金"),
      priceNonZero,
      has("贵金属结论", "足金"),
    ),
  },
  {
    name: "足金筛选",
    filter: all(
      anyOf(["商品名称", "商品材质", "配件材质"], "足金"),
      priceNonZero,
      no("贵金属结论", "足金"),
    ),
  },
  {
    name: "错误备注999",
    filter: all(
      no("贵金属结论", "足金"),
      priceNonZero,
      has("备注", "999"),
    ),
  },
  {
    name: "950筛选",
    filter: all(
      anyOf(["商品名称", "商品材质"], "950"),
      priceNonZero,
      no("贵金属结论", "950"),
    ),
  },
  {
    name: "K金筛选",
    filter: all(
      anyOf(["商品名称", "商品材质", "镶嵌材质"], "K金"),
      priceNonZero,
      no("贵金属结论", "K金"),
    ),
  },
  {
    name: "925筛选",
    filter: all(
      anyOf(["商品名称", "商品材质","镶嵌材质", "配件材质"], "925"),
      priceNonZero,
      no("贵金属结论", "925"),
      no("备注", "925"),
    ),
  },
  {
    name: "足银筛选",
    filter: all(
      anyOf(["商品名称", "商品材质"], "足银"),
      priceNonZero,
      no("贵金属结论", "足银"),
    ),
  },
  {
    name: "足铂筛选",
    filter: all(
      anyOf(["商品名称", "商品材质"], "足铂"),
      priceNonZero,
      no("贵金属结论", "足铂"),
    ),
  },
  {
    name: "铂筛选",
    filter: all(
      anyOf(["商品名称", "商品材质"], "铂"),
      priceNonZero,
      no("贵金属结论", "铂"),
    ),
  },

  // ── 宝玉石 ──────────────────────────────────────────────────────────────
  {
    name: "南红筛选",
    filter: all(
      anyKeyword(["商品名称", "商品材质","镶嵌材质", "配件材质"], ["保山红", "凉山红", "川料红", "瓦西", "九口红", "锦红", "南红"]),
      priceNonZero,
      no("备注", "南红"),
    ),
  },
  {
    name: "海水珍珠筛选",
    filter: all(
      anyKeyword(["商品名称", "商品材质","镶嵌材质", "配件材质"], ["海水珍珠", "海水珠"]),
      priceNonZero,
      no("宝玉石结论", "海水珍珠"),
    ),
  },
  {
    name: "珍珠筛选",
    filter: all(
      anyKeyword(["商品材质","镶嵌材质", "配件材质"], ["珍珠"]),
      priceNonZero,
      no("宝玉石结论", "珍珠"),
      no("备注", "珍珠"),
    ),
  },
  {
    name: "碧玉筛选",
    filter: all(
      anyKeyword(["商品材质","镶嵌材质", "配件材质"], ["碧玉"]),
      priceNonZero,
      no("宝玉石结论", "碧玉"),
    ),
  },
  {
    name: "合成碳硅石筛选",
    filter: all(
      anyKeyword(["商品材质","镶嵌材质", "配件材质"], ["合成碳硅石"]),
      priceNonZero,
      no("宝玉石结论", "合成碳硅石"),
    ),
  },
    {
    name: "合成立方氧化锆筛选",
    filter: all(
      anyKeyword(["商品材质","镶嵌材质", "配件材质"], ["合成立方氧化锆"]),
      priceNonZero,
      no("宝玉石结论", "合成立方氧化锆"),
      no("备注", "合成立方氧化锆"),
    ),
  },
  {
    name: "翡翠备注筛选",
    filter: all(
      has("宝玉石结论", "翡翠"),
      priceNonZero,
      no("备注", "A货翡翠"),
      no("备注", "翡翠A货"),
    ),
  },
    {
    name: "红色配珠未测筛选",
    filter: all(
      has("商品名称", "四叶草黄金手绳"),
      priceNonZero,
      no("宝玉石结论", "玛瑙"),
      no("备注", "红色配珠未测"),
    ),
  },

  // ── 饰品类型 ────────────────────────────────────────────────────────────
  {
    name: "饰品类型筛选",
    filter: (row: CsvData) => {
      const EXCLUDED_NAMES = ["金条", "金豆", "投资", "金钞", "金饼"];
      return (
        priceNonZero(row) &&
        !(row["饰品类型"] != null && row["饰品类型"].trim().length > 0) &&
        EXCLUDED_NAMES.every(n => !containsText(row["商品名称"], n))
      );
    },
  },

  // ── 重量与备注 ───────────────────────────────────────────────────────────
  {
    name: "净金重备注多余字段筛选",
    filter: (row: CsvData) => {
      if (!containsText(row["重量"], "净金重")) return false;
      // 把备注中所有已知允许字段全部去掉，剩余内容非空则命中
      const ALLOWED_PARTS = ["金含量≥999‰", "配银925链", "配链未测"];
      let remaining = row["备注"] || "";
      for (const part of ALLOWED_PARTS) {
        remaining = remaining.split(part).join("");
      }
      // 去掉所有标点符号和空白字符
      remaining = remaining.replace(/[\p{P}\p{S}\s]/gu, "").trim();
      return remaining.length > 0;
    },
  },
  {
    name: "检测备注漏含覆层筛选",
    filter: all(
      has("重量", "覆层"),
      no("备注", "贵金属纯度不包括表层"),
      priceNonZero,
    ),
  },
  {
    name: "重量单位筛选",
    filter: all(
      no("重量", "g"),
      priceNonZero,
    ),
  },
  {
    name: "覆层称重备注筛选",
    filter: all(
      no("重量", "含覆层"),
      no("重量", "总重"),
      has("备注", "贵金属纯度不包括表层"),
      priceNonZero,
    ),
  },
  {
    name: "赠链检测备注筛选",
    filter: all(
      has("重量", "不含链"),
      no("备注", "配链"),
      no("备注", "银925链"),
      no("备注", "配18K金链"),
      priceNonZero,
    ),
  },
  {
    name: "称重备注的不含链筛选",
    filter: all(
      no("重量", "不含链"),
      no("重量", "总重"),
      hasAny("备注", ["配链未测", "银925链", "18K金链", "足银链", "链"]),
      priceNonZero,
    ),
  },

  // ── 重量数值 ─────────────────────────────────────────────────────────────
  {
    name: "零重量筛选",
    filter: (row: CsvData) =>
      parseFloat(row["重量"]) === 0 && priceNonZero(row),
  },
  {
    name: "漏打净金重筛选（优化中）",
    filter: (row: CsvData) => {
      const weight = row["重量"] || "";
      const noChineseInWeight = !/[\u4e00-\u9fa5]/.test(weight);
      const noExcludedRemarks = !hasAny("备注", ["不包括", "未测", "功能性"])(row);
      const isEmptyGem = (row["宝玉石结论"] || "").trim().length === 0;
      return has("贵金属结论", "足金")(row) && priceNonZero(row) && noChineseInWeight && noExcludedRemarks && isEmptyGem;
    },
  },
  {
    name: "足金低重量筛选核查",
    filter: (row: CsvData) => {
      const match = (row["重量"] || "").match(/\d+(\.\d+)?/);
      const weightNum = match ? parseFloat(match[0]) : NaN;
      return has("贵金属结论", "足金")(row) && priceNonZero(row) && !isNaN(weightNum) && weightNum > 0 && weightNum < 0.2;
    },
  },
];

export function filterData(data: CsvData[]): FilterResult[] {
  return FILTER_RULES.map(rule => ({
    name: rule.name,
    data: data.filter(rule.filter),
  }));
}
