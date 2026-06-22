/**
 * Auto-match a bill record to an app category based on:
 * 1. Bill's own category field (e.g. Alipay 交易分类)
 * 2. Description + counterparty keyword matching
 * 3. Fallback to "其他" / "其他收入"
 *
 * Returns the app category NAME (not ID). Caller looks up the ID.
 */

// ========== Alipay 交易分类 → App Category ==========
const ALIPAY_CATEGORY_MAP: Record<string, string> = {
  '日用百货': '购物',
  '餐饮美食': '餐饮',
  '教育培训': '学习',
  '医疗健康': '医疗',
  '交通出行': '交通',
  '文化娱乐': '娱乐',
  '文化休闲': '娱乐',
  '美容美发': '其他',
  '家居家装': '其他',
  '家居装潢': '其他',
  '母婴亲子': '其他',
  '数码电器': '购物',
  '其他': '其他',
};

// ========== Bank 摘要 → App Category ==========
const BANK_SUMMARY_MAP: Record<string, string> = {
  '消费': '', // needs description (but bank descriptions are masked — fallback)
  '支付机构提现': '转账转入',
  '消费退货': '退款',
  '充值': '其他',
};

// ========== Keyword matching for expense categories ==========
// Checked against description + counterparty combined
interface KeywordRule {
  keywords: string[];
  category: string;
}

const EXPENSE_KEYWORDS: KeywordRule[] = [
  // 餐饮 — must be first as it has broad matches
  {
    keywords: [
      '食堂', '老食堂', '教工餐厅', '新食堂', '美食汇', '百佳超市',
      '餐饮', '餐厅', '饭店', '小吃', '汉堡', '炸鸡', '牛肉汤',
      '麻辣', '粥', '外卖', '咖啡', '奶茶', '霸王茶姬',
      'KFC', '肯德基', '禾香嫂', '三汤牛', '堡中霸',
      '便民服务点', '饮水支付', '饮水',
      '二维码', '扫码付款', '扫二维码',
      '美团', '大牌档', '东北菜', '南京菜', '大众点评',
      '拉扎斯', '饿了么', '凯路创新', 'U净', '小净', '曼玲粥',
      '麦当劳', 'Manner',
    ],
    category: '餐饮',
  },
  // 交通
  {
    keywords: [
      '地铁', '公交', '打车', '高德', '滴滴', '出行', '火车', '高铁',
      '7MA', 'T3特惠', 'T3出行',
      '地铁站', '公交站', '一卡通',
      '金维鸟',
    ],
    category: '交通',
  },
  // 购物
  {
    keywords: [
      '超市', '便利店', 'LAWSON', '罗森', '百货',
      '淘宝', '拼多多', '抖音电商', '京东',
      '烟酒', '赵一鸣', '先用后付',
      '购好', '日用',
      '一次性内裤', '马桶垫', '零食',
      '格物致品', '冰尚传媒', '吉利猫', '趣顽', '妇炎洁',
      '洗脸巾', '泡泡玛特', 'POPMART', 'Jellycat',
    ],
    category: '购物',
  },
  // 医疗
  {
    keywords: [
      '医院', '医疗', '门诊', '挂号', '药品', '药',
      '健康', '卫宁付', '医保', '卫生服务',
    ],
    category: '医疗',
  },
  // 学习
  {
    keywords: [
      '大学', '学校', '学院', '培训', '教育', '考试',
      'DeepSeek', 'API', '爱听写', '英语',
      '打印', '窝趣云打印',
    ],
    category: '学习',
  },
  // 娱乐
  {
    keywords: [
      '视频', '电竞', '游戏', '电影', '足浴', 'SPA', 'KTV',
      '腾讯视频', 'POPMART', '潮玩',
      '酒店', '华住', '全季', '广场',
      '文化', '娱乐', '休闲',
    ],
    category: '娱乐',
  },
  // 礼物
  {
    keywords: ['礼物', '礼盒', '公仔', '玩偶', '毛绒'],
    category: '礼物',
  },
];

// ========== Income category keywords ==========
const INCOME_KEYWORDS: KeywordRule[] = [
  { keywords: ['红包'], category: '红包' },
  { keywords: ['退款', '退货', '返现', '消费退货'], category: '退款' },
  { keywords: ['工资', '薪资', '薪酬'], category: '工资' },
  { keywords: ['奖金', '年终奖', '绩效'], category: '奖金' },
  { keywords: ['提现', '转入', '充值退回'], category: '转账转入' },
];

/**
 * Match a bill record to an app category name.
 * Always returns a category name — falls back to "其他" / "其他收入".
 */
export function matchCategory(
  description: string,
  counterparty: string,
  billCategory: string,
  type: 'expense' | 'income',
): string {
  const desc = (description || '').trim();
  const party = (counterparty || '').trim();
  const billCat = (billCategory || '').trim();
  let cleanDesc = desc;

  // --- 0. Platform routing based on 交易地点/附言 (CCB bank statements) ---
  // 抖音支付 → 购物（支出）/ 退款（收入）
  if (desc.startsWith('抖音支付')) {
    return type === 'income' ? '退款' : '购物';
  }

  // 微信零钱提现 → 转账转入（income: 微信零钱→银行卡）
  if (desc.startsWith('微信零钱提现')) return '转账转入';

  // 财付通-微信零钱充值 → 其他（expense: 银行卡→微信）
  if (desc.includes('财付通') && desc.includes('微信零钱充值')) return '其他';

  // 支付宝 → clean prefix and fall through to keyword matching
  if (desc.startsWith('支付宝')) {
    // Strip Alipay platform prefixes: 支付宝-淘宝-, 支付宝-天猫-, 支付宝-支付宝-消费-, etc.
    cleanDesc = desc
      .replace(/^支付宝-/, '')
      .replace(/^(淘宝|天猫|支付宝外部商户|支付宝)-/, '')
      .replace(/^(消费|充值|退货)-/, '');
  }

  const searchText = (cleanDesc + ' ' + party).toLowerCase();

  // --- 1. Direct bill category mapping (precise, high-confidence) ---

  // Bank 摘要
  if (BANK_SUMMARY_MAP[billCat]) {
    // 消费: fall through to keyword matching
    if (billCat === '消费') {
      // bank descriptions are masked, try keyword anyway
    } else {
      return BANK_SUMMARY_MAP[billCat];
    }
  }

  // --- 2. Keyword matching (description + counterparty take priority) ---
  if (type === 'income') {
    for (const rule of INCOME_KEYWORDS) {
      if (rule.keywords.some((kw) => searchText.includes(kw.toLowerCase()))) {
        return rule.category;
      }
    }
    // Don't return yet — fall through to Alipay/WeChat mappings below
  } else {
    for (const rule of EXPENSE_KEYWORDS) {
      if (rule.keywords.some((kw) => searchText.includes(kw.toLowerCase()))) {
        return rule.category;
      }
    }
  }

  // --- 3. Alipay 交易分类 (fallback: only used when keywords don't match) ---
  // Alipay's built-in categories are sometimes inaccurate (e.g. canteen→教育),
  // so we only use them as a fallback after keyword matching.
  if (ALIPAY_CATEGORY_MAP[billCat]) {
    if (billCat === '生活服务') {
      if (searchText.includes('饮水') || searchText.includes('水')) return '餐饮';
      return '其他';
    }
    if (billCat === '退款') return '退款';
    return ALIPAY_CATEGORY_MAP[billCat];
  }

  // --- 4. WeChat 交易类型 (fallback: structural types like 红包/提现/转账) ---
  // WeChat expense types that mean "spending" — keyword matching already handled above,
  // but strip generic prefixes like "扫二维码付款-" from desc to help keyword matching
  if (billCat === '微信红包') {
    return type === 'income' ? '红包' : '其他';
  }
  if (billCat.includes('退款')) return '退款';
  if (billCat === '零钱提现' || billCat === '零钱充值' || billCat === '转账') {
    return '转账转入';
  }
  if (billCat.includes('零钱通')) return '转账转入';
  // 群收款 → income
  if (billCat === '群收款' || billCat.includes('收款')) {
    return type === 'income' ? '红包' : '其他';
  }

  // Fallback
  return type === 'income' ? '其他收入' : '其他';
}
