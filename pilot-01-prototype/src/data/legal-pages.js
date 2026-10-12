import { localizedPath } from "./locale-routing.js";

export const LEGAL_PAGE_PATHS = Object.freeze(["/privacy", "/terms", "/contact"]);
export const LEGAL_LOCALES = Object.freeze(["en", "zh-Hans"]);
export const LEGAL_EFFECTIVE_DATE = "2026-10-12";
export const legalLocale = (locale) => ["zh-Hans", "zh-CN"].includes(locale) ? "zh-Hans" : "en";
export const isLegalPagePath = (path) => LEGAL_PAGE_PATHS.includes(path);
export const LEGAL_COPY = {
  "/privacy": {
    "en": {
      "title": "Privacy Policy",
      "lead": "How NexuAlpha handles information when you use our website and linked services.",
      "sections": [
        {
          "title": "Operator and scope",
          "body": "NexuAlpha operates nexualpha.com. Contact Bestberlin@nexualpha.com with privacy questions. The public website has no visitor accounts, accepts no payments or deposits, and does not collect payment details or custody funds."
        },
        {
          "title": "Click attribution and first-party analytics",
          "body": "We measure page views, decision interactions, referral button visibility and clicks, and Telegram handoffs to understand site use. First-party event records can include a random session ID, event ID, time, page path, language, source, platform, placement, device category, selected market/product/account-stage/funding context, campaign/publisher tags and experiment bucket. These selections describe your research, not bank or payment credentials. The separate CTA click beacon and /go/ redirects record time, partner, source tags (such as src=…), the clicked site path (beacon) or referring hostname (/go/), and an experiment bucket when active; those click records do not contain IP addresses or visitor account IDs. IP addresses may be used temporarily for rate limiting."
        },
        {
          "title": "Cookies and browser storage",
          "body": "The language preference cookie PARAGLIDE_LOCALE lasts up to 400 days. When the home copy experiment is enabled, nx_hero stores only an a/b bucket for 30 days. These are first-party cookies; the site code does not add advertising cookies. Local storage remembers language and an anonymous decision-resume snapshot; session storage keeps comparison choices, readiness checks, dismissed prompts and a random analytics session/source. You can clear them in your browser. The separate Telegram Mini App may keep beginner-village progress and preferences; its implementation is outside this website repository, so we cannot specify its storage or server retention here. Ask us for details before using it."
        },
        {
          "title": "Server logs and messages",
          "body": "Hosting and server infrastructure may process request metadata such as IP address, user agent, requested URL, time and response status for delivery, security and troubleshooting. Our application error monitor records request/event IDs, time, generalized route, build and error/status codes. If you email us, we receive the address and message you provide. Do not send private keys, passwords or payment credentials."
        },
        {
          "title": "Third parties and Telegram",
          "body": "Partner exchanges handle outbound referral visits and any registration under their own privacy policies. YouTube embeds contact Google/YouTube and may allow them to process device information and cookies under their policies. Telegram processes channel, bot and Mini App interactions under its own policy, including information you choose to send. Website handoff analytics do not collect Telegram user IDs. This repository contains channel-posting tools, not the separate interactive bot database; we cannot confirm that bot’s server-side storage or retention from this code. Hosting providers process requests to serve the site. No Google Analytics or other third-party analytics tracker was found in the website code; first-party analytics are described above."
        },
        {
          "title": "YouTube API Services",
          "body": "NexuAlpha uses YouTube API Services to manage its own YouTube channel’s videos and metadata and to display/embed videos. By using the YouTube features, users agree to be bound by the YouTube Terms of Service. The channel management tool is for the NexuAlpha channel owner only; visitors are not asked to authorize access to their YouTube accounts. We do not access, store or share YouTube user data of site visitors through the API. Google/YouTube may collect information directly through embeds, as described in the Google Privacy Policy. The channel owner who grants API access can revoke it through Google security settings, and can contact us to request deletion of stored authorized data. Ordinary visitors do not grant that channel-management access."
        },
        {
          "title": "Retention and your choices",
          "body": "Browser cookies expire as stated above; local storage remains until cleared, and session storage normally lasts for the tab session. Server event and access logs follow operational rotation; the code does not establish a fixed deletion schedule. The collector’s 30-day duplicate-event lookback is not a deletion period. Email Bestberlin@nexualpha.com to request access, correction or deletion of information we can identify, or ask about retention. We may need enough information to verify the request. Records without identifying information may not be traceable to you. You can clear browser storage and avoid third-party features. The first-party analytics module respects Do Not Track and Global Privacy Control; these controls do not disable all separate click or infrastructure logs."
        },
        {
          "title": "Children and changes",
          "body": "NexuAlpha is not directed at anyone under 18. Please contact us if you believe a child has provided personal information. We will publish changes on this page with an updated effective date. Effective date: 2026-10-12."
        }
      ]
    },
    "zh-Hans": {
      "title": "隐私政策",
      "lead": "了解 NexuAlpha 网站及相关服务如何处理信息。",
      "sections": [
        {
          "title": "运营方与范围",
          "body": "NexuAlpha 运营 nexualpha.com。如有隐私问题，请联系 Bestberlin@nexualpha.com。公开网站不提供访客账户，不接受付款或存款，不收集支付资料，也不托管资产。"
        },
        {
          "title": "点击归因与第一方分析",
          "body": "我们统计页面浏览、决策操作、合作按钮展示与点击及 Telegram 跳转，以了解网站使用情况。第一方事件记录可包含随机会话标识、事件标识、时间、页面路径、语言、来源、平台、位置、设备类别、所选市场／产品／开户阶段／入金方式、活动及发布方标签和实验分组。这些选项描述您的研究条件，不是银行或支付凭证。独立 CTA 点击信标和 /go/ 跳转记录时间、合作方、来源标签（如 src=…）、信标的点击站内路径或 /go/ 的来源主机名，以及启用时的实验分组；这些点击记录不含 IP 地址或访客账户标识。IP 地址可临时用于限流。"
        },
        {
          "title": "Cookie 与浏览器存储",
          "body": "语言偏好 Cookie PARAGLIDE_LOCALE 最长保存 400 天。首页文案实验启用时，nx_hero 保存 a/b 分组 30 天。它们是第一方 Cookie；网站代码没有添加广告 Cookie。本地存储保存语言及匿名决策恢复信息；会话存储保存比较选项、准备检查、已关闭提示和随机分析会话／来源。您可以通过浏览器清除这些数据。独立 Telegram Mini App 可能保存新手村进度与偏好；其实现不在本网站代码库中，因此这里无法确定其存储方式或服务器保留期限。使用前可向我们查询详情。"
        },
        {
          "title": "服务器日志与来信",
          "body": "托管及服务器基础设施可处理 IP 地址、浏览器信息、请求网址、时间与响应状态等请求元数据，用于提供服务、安全及故障排查。应用错误监控记录请求／事件标识、时间、概括化路径、版本和错误／状态代码。您向我们发邮件时，我们会收到您提供的邮箱地址与消息。请勿发送私钥、密码或支付凭证。"
        },
        {
          "title": "第三方与 Telegram",
          "body": "合作交易所根据各自隐私政策处理推荐链接访问与注册。YouTube 嵌入播放器连接 Google／YouTube，它们可依其政策处理设备信息与 Cookie。Telegram 根据其政策处理频道、机器人及 Mini App 交互，包括您主动发送的信息。网站跳转分析不收集 Telegram 用户标识。本代码库包含频道发布工具，不包含独立交互机器人的数据库；无法据此确认该机器人的服务器存储或保留期限。托管服务商处理请求以提供网站服务。网站代码中未发现 Google Analytics 或其他第三方分析追踪器；第一方分析如上所述。"
        },
        {
          "title": "YouTube API 服务",
          "body": "NexuAlpha 使用 YouTube API Services 管理自有 YouTube 频道的视频与元数据，并展示／嵌入视频。使用 YouTube 功能即表示用户同意受 YouTube 服务条款约束。频道管理工具仅供 NexuAlpha 频道所有者使用，不要求访客授权访问其 YouTube 账户。我们不会通过 API 访问、存储或共享网站访客的 YouTube 用户数据。Google／YouTube 可通过嵌入播放器直接收集信息，详情见 Google 隐私政策。授予 API 访问权限的频道所有者可通过 Google 安全设置撤销权限，也可联系我们请求删除已存储的授权数据。普通访客不会授予该频道管理权限。"
        },
        {
          "title": "保留期限与您的选择",
          "body": "浏览器 Cookie 按上述期限到期；本地存储保留至您清除，会话存储通常持续至标签页会话结束。服务器事件与访问日志按运维轮转处理；代码未规定固定删除周期。分析收集器回看 30 天以去重，并不代表 30 天后删除。您可通过 Bestberlin@nexualpha.com 请求访问、更正或删除我们能识别的信息，或询问保留期限。我们可能需要必要信息核验请求。无身份信息的记录可能无法关联到您。您可清除浏览器存储并避免使用第三方功能。第一方分析模块尊重 Do Not Track 与 Global Privacy Control，但这些设置不会关闭所有独立点击记录或基础设施日志。"
        },
        {
          "title": "未成年人及政策变更",
          "body": "NexuAlpha 不面向未满 18 岁的用户。如您认为未成年人提供了个人信息，请联系我们。政策变更将在本页公布，并更新生效日期。生效日期：2026-10-12。"
        }
      ]
    }
  },
  "/terms": {
    "en": {
      "title": "Terms of Use",
      "lead": "Conditions for using NexuAlpha’s independent research and comparison website.",
      "sections": [
        {
          "title": "Information and risk",
          "body": "NexuAlpha provides independent directory data, fee comparisons and official-source references for educational and informational purposes. This is not investment, financial, tax or legal advice. Digital assets and leveraged products carry substantial risk, including loss of principal. Evaluate your own circumstances and verify current terms on official platforms."
        },
        {
          "title": "Affiliate disclosure and no custody",
          "body": "NexuAlpha is independent of exchanges. Some partner links may earn an affiliate commission at no extra cost to you. We do not operate an exchange, open accounts on your behalf, take deposits, handle private keys or custody funds. Registration, payments and trading occur with third-party platforms under their own terms."
        },
        {
          "title": "YouTube features",
          "body": "NexuAlpha uses YouTube API Services for its own channel and video features. By using these features, you agree to be bound by the YouTube Terms of Service. Our Privacy Policy explains Google/YouTube processing and channel-owner authorization."
        },
        {
          "title": "Availability and liability",
          "body": "Information and services are provided as available. We do not guarantee completeness, accuracy, uninterrupted access or trading outcomes. To the extent permitted by applicable law, NexuAlpha is not liable for losses arising from reliance on site information or third-party services. Nothing here excludes liability or rights that applicable law does not permit us to exclude. Do not misuse the site or interfere with its security."
        },
        {
          "title": "Questions and changes",
          "body": "Contact Bestberlin@nexualpha.com about these terms or disputes. Applicable mandatory law remains in force; no specific governing jurisdiction is designated here. Updated terms will appear on this page. The service is intended for adults aged 18 or older. Effective date: 2026-10-12."
        }
      ]
    },
    "zh-Hans": {
      "title": "使用条款",
      "lead": "使用 NexuAlpha 独立研究与比较网站的条件。",
      "sections": [
        {
          "title": "信息与风险",
          "body": "NexuAlpha 提供独立平台资料、费率比较及官方来源参考，仅供教育与信息用途，不构成投资、财务、税务或法律建议。数字资产及杠杆产品风险很高，可造成本金损失。请独立评估自身情况，并在官方平台核验最新条件。"
        },
        {
          "title": "合作披露与无资产托管",
          "body": "NexuAlpha 独立于交易所。部分合作链接可产生佣金，不增加您的成本。我们不运营交易所、不代办开户、不接受存款、不接触私钥，也不托管资产。注册、付款及交易由第三方平台依其条款处理。"
        },
        {
          "title": "YouTube 功能",
          "body": "NexuAlpha 使用 YouTube API Services 提供自有频道及视频功能。使用这些功能即表示您同意受 YouTube 服务条款约束。我们的隐私政策说明 Google／YouTube 信息处理及频道所有者授权。"
        },
        {
          "title": "可用性与责任",
          "body": "信息及服务按现有可用状态提供，不保证完整、准确、不中断或任何交易结果。在适用法律允许的范围内，NexuAlpha 不对依赖网站信息或第三方服务产生的损失承担责任。本条款不排除适用法律不允许排除的责任或权利。请勿滥用网站或干扰其安全。"
        },
        {
          "title": "联系与变更",
          "body": "有关条款或争议，请联系 Bestberlin@nexualpha.com。适用的强制性法律仍然有效；本条款未指定特定管辖地区。更新条款将在本页公布。服务面向年满 18 岁的成年人。生效日期：2026-10-12。"
        }
      ]
    }
  },
  "/contact": {
    "en": {
      "title": "Contact NexuAlpha",
      "lead": "Questions, corrections and privacy requests can be sent to our contact email.",
      "sections": [
        {
          "title": "Get in touch",
          "body": "For access or deletion requests, describe the information or interaction you want us to review. Never send passwords, private keys or payment credentials."
        }
      ]
    },
    "zh-Hans": {
      "title": "联系 NexuAlpha",
      "lead": "问题、更正建议及隐私请求可发送至联系邮箱。",
      "sections": [
        {
          "title": "联系我们",
          "body": "如需访问或删除信息，请描述需要我们核查的信息或交互。请勿发送密码、私钥或支付凭证。"
        }
      ]
    }
  }
};

export function legalPageSeo(path, requestedLocale = "en") {
  const locale = legalLocale(requestedLocale);
  const copy = LEGAL_COPY[path][locale];
  const canonical = `https://nexualpha.com${localizedPath(path, locale)}`;
  const schema = { "@context": "https://schema.org", "@type": path === "/contact" ? "ContactPage" : "WebPage", name: copy.title, url: canonical, inLanguage: locale, dateModified: LEGAL_EFFECTIVE_DATE };
  return { status: 200, ogType: "website", title: `${copy.title} — NexuAlpha`, description: copy.lead, canonical, locale, htmlLocale: locale, robots: LEGAL_LOCALES.includes(requestedLocale) ? "index,follow" : "noindex,follow", alternates: [...LEGAL_LOCALES, "x-default"].map((code) => ({ hreflang: code, href: `https://nexualpha.com${localizedPath(path, code === "x-default" ? "en" : code)}` })), schema, schemas: [schema] };
}
