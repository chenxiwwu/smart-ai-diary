/**
 * 中国黄历服务
 * 提供天干地支、宜忌等黄历信息
 */

// 天干
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
// 地支
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
// 生肖
const SHENG_XIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

// 宜事项
const YI_ITEMS = [
  '婚嫁', '出行', '搬家', '开业', '动土', '祭祀', '祈福', '求嗣',
  '纳采', '开光', '安床', '修造', '入宅', '安葬', '破土', '启钻',
  '移柩', '订盟', '纳财', '开市', '立券', '交易', '挂匾', '栽种',
  '斋醮', '出火', '拆卸', '起基', '竖柱', '上梁', '放水', '解除',
  '沐浴', '冠笄', '裁衣', '会友', '进人口', '嫁娶', '经络', '酝酿',
];

// 忌事项
const JI_ITEMS = [
  '婚嫁', '出行', '搬家', '开业', '动土', '安葬', '破土', '启钻',
  '入宅', '修造', '栽种', '安床', '开仓', '纳畜', '置产', '造桥',
  '伐木', '作灶', '行丧', '词讼', '探病', '求医', '造庙', '造船',
  '掘井', '开池', '上梁', '竖柱', '盖屋', '祈福', '祭祀', '开市',
  '立券', '交易', '纳财', '出火', '移徙', '分居', '合帐', '冠笄',
];

export interface AlmanacInfo {
  tianGan: string;       // 天干
  diZhi: string;         // 地支
  ganZhi: string;        // 干支纪日
  shengXiao: string;     // 生肖（年）
  yi: string[];          // 宜
  ji: string[];          // 忌
}

/**
 * 计算干支纪日
 * 基准日：2000年1月7日为甲子日
 */
function getGanZhiDay(date: Date): { tianGan: string; diZhi: string } {
  const baseDate = new Date(2000, 0, 7); // 2000-01-07 甲子日
  const diffTime = date.getTime() - baseDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const ganIndex = ((diffDays % 10) + 10) % 10;
  const zhiIndex = ((diffDays % 12) + 12) % 12;
  return {
    tianGan: TIAN_GAN[ganIndex],
    diZhi: DI_ZHI[zhiIndex],
  };
}

/**
 * 计算年份生肖
 */
function getShengXiao(year: number): string {
  return SHENG_XIAO[(year - 4) % 12];
}

/**
 * 基于日期的确定性 hash，确保同一天结果一致
 */
function dateHash(dateStr: string, seed: number = 0): number {
  let hash = seed;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * 从数组中基于 hash 确定性选取 n 个不重复项
 */
function pickItems(items: string[], hash: number, count: number): string[] {
  const shuffled = [...items];
  let h = hash;
  for (let i = shuffled.length - 1; i > 0; i--) {
    h = ((h * 1103515245 + 12345) & 0x7fffffff);
    const j = h % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

/**
 * 获取指定日期的黄历信息
 */
export function getAlmanacInfo(date: Date): AlmanacInfo {
  const dateStr = date.toISOString().split('T')[0];
  const { tianGan, diZhi } = getGanZhiDay(date);
  const shengXiao = getShengXiao(date.getFullYear());

  const yiHash = dateHash(dateStr, 42);
  const jiHash = dateHash(dateStr, 137);

  // 每天宜 3~5 项，忌 3~5 项
  const yiCount = 3 + (yiHash % 3);
  const jiCount = 3 + (jiHash % 3);

  const yi = pickItems(YI_ITEMS, yiHash, yiCount);
  let ji = pickItems(JI_ITEMS, jiHash, jiCount);

  // 确保宜和忌不重复
  ji = ji.filter(item => !yi.includes(item));
  if (ji.length < 3) {
    const extra = pickItems(
      JI_ITEMS.filter(item => !yi.includes(item) && !ji.includes(item)),
      jiHash + 999,
      3 - ji.length
    );
    ji = [...ji, ...extra];
  }

  return {
    tianGan,
    diZhi,
    ganZhi: `${tianGan}${diZhi}`,
    shengXiao,
    yi,
    ji,
  };
}
