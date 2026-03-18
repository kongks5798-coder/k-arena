/**
 * K-Arena Marketing Automation Agent
 * - Monitors HN, GitHub for relevant MCP/AI agent discussions
 * - Generates comment templates for each opportunity
 * - Logs results to /api/marketing-log
 */

const BASE_URL = process.env.KARENA_URL ?? 'https://karena.fieldnine.io'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? ''

// ─── Types ───────────────────────────────────────────────────────────────────

interface HNItem {
  id: number
  title?: string
  url?: string
  score: number
  descendants?: number
  time: number
  type: string
  text?: string
}

interface HNSearchHit {
  objectID: string
  title: string
  url?: string
  points: number
  num_comments: number
  created_at: string
  story_text?: string
}

interface GitHubRepo {
  full_name: string
  html_url: string
  description: string | null
  stargazers_count: number
  open_issues_count: number
  topics: string[]
}

interface GitHubIssue {
  number: number
  title: string
  html_url: string
  body: string | null
  state: string
}

interface MarketingOpportunity {
  platform: 'hackernews' | 'github'
  type: 'hn_post' | 'hn_comment_thread' | 'github_issue' | 'github_repo'
  title: string
  url: string
  relevance_score: number
  comment_template: string
  metadata: Record<string, unknown>
}

// ─── HN Monitoring ───────────────────────────────────────────────────────────

const HN_KEYWORDS = ['MCP', 'model context protocol', 'AI agent', 'autonomous trading', 'agentic finance']

async function searchHackerNews(): Promise<MarketingOpportunity[]> {
  const opportunities: MarketingOpportunity[] = []

  for (const keyword of HN_KEYWORDS) {
    const encoded = encodeURIComponent(keyword)
    const url = `https://hn.algolia.com/api/v1/search?query=${encoded}&tags=story&hitsPerPage=10&numericFilters=created_at_i>${Math.floor(Date.now() / 1000) - 86400 * 3}`

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) continue
      const data = await res.json()
      const hits: HNSearchHit[] = data.hits ?? []

      for (const hit of hits) {
        const score = scoreHNRelevance(hit, keyword)
        if (score < 2) continue

        opportunities.push({
          platform: 'hackernews',
          type: 'hn_post',
          title: hit.title,
          url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
          relevance_score: score,
          comment_template: buildHNComment(hit, keyword),
          metadata: {
            hn_id: hit.objectID,
            points: hit.points,
            num_comments: hit.num_comments,
            keyword,
            created_at: hit.created_at,
          },
        })
      }
    } catch (e) {
      console.error(`[HN] keyword="${keyword}" error:`, e)
    }
  }

  // Deduplicate by hn_id
  const seen = new Set<string>()
  return opportunities.filter(o => {
    const id = String((o.metadata as { hn_id: string }).hn_id)
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

function scoreHNRelevance(hit: HNSearchHit, keyword: string): number {
  let score = 0
  const text = `${hit.title} ${hit.story_text ?? ''} ${hit.url ?? ''}`.toLowerCase()
  const kw = keyword.toLowerCase()

  if (text.includes(kw)) score += 3
  if (hit.title.toLowerCase().includes(kw)) score += 2
  if (hit.points >= 50) score += 2
  if (hit.points >= 10) score += 1
  if (hit.num_comments >= 10) score += 1

  // Bonus keywords indicating finance + AI overlap
  const bonusTerms = ['exchange', 'trading', 'finance', 'defi', 'token', 'agent economy', 'mcp server']
  for (const t of bonusTerms) {
    if (text.includes(t)) score += 1
  }

  return score
}

function buildHNComment(hit: HNSearchHit, keyword: string): string {
  const isMCP = keyword.toLowerCase().includes('mcp') || keyword.toLowerCase().includes('model context')
  const isTrading = keyword.toLowerCase().includes('trading') || keyword.toLowerCase().includes('finance')

  if (isMCP) {
    return `Interesting timing — I've been building K-Arena (https://karena.fieldnine.io), an MCP-native financial exchange for autonomous AI agents. The whole exchange is exposed as 7 MCP tools (get_exchange_rates, execute_trade, get_market_signals, etc.) so Claude or any MCP-compatible agent can trade XAU/BTC/ETH with a one-line config.

The thing I find underappreciated about MCP: AI agents get semantic tool understanding, not just a REST endpoint. The agent knows it's calling \`execute_trade\`, not parsing a POST response. That semantic layer matters for autonomous finance.

npx k-arena-mcp if you want to try it.`
  }

  if (isTrading) {
    return `The infrastructure problem here is real. I built K-Arena (https://karena.fieldnine.io) specifically because AI agents have no exchange to actually *execute* on — every existing exchange assumes a human on the other side (KYC, CAPTCHA, 2FA).

K-Arena is MCP-native: AI agents connect via Model Context Protocol and trade XAU/BTC/ETH in <200ms. No human touchpoints.

Currently at 0.1% fee with a Genesis 999 program (zero fees forever for the first 999 agents). Would love your thoughts on where the actual risks are.`
  }

  return `Related: I built K-Arena (https://karena.fieldnine.io), an exchange designed from scratch for autonomous AI agents. Agents connect via MCP (Model Context Protocol) and trade gold, BTC, ETH autonomously. Might be relevant to your work here — happy to discuss the architecture.`
}

// ─── GitHub Monitoring ───────────────────────────────────────────────────────

const GITHUB_TOPICS = ['mcp-server', 'model-context-protocol', 'ai-agent', 'langchain']
const GITHUB_ISSUE_KEYWORDS = ['trading', 'finance', 'exchange', 'crypto', 'stock', 'portfolio']

async function searchGitHub(): Promise<MarketingOpportunity[]> {
  const opportunities: MarketingOpportunity[] = []
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`

  // 1. Find repos by topic
  for (const topic of GITHUB_TOPICS.slice(0, 2)) { // limit API calls
    try {
      const res = await fetch(
        `https://api.github.com/search/repositories?q=topic:${topic}&sort=stars&order=desc&per_page=10`,
        { headers, signal: AbortSignal.timeout(8000) }
      )
      if (!res.ok) continue
      const data = await res.json()
      const repos: GitHubRepo[] = data.items ?? []

      for (const repo of repos.slice(0, 5)) {
        // Check open issues for finance-related ones
        const issues = await fetchRepoIssues(repo.full_name, headers)
        const relevant = issues.filter(i => isFinanceRelated(i))

        for (const issue of relevant.slice(0, 2)) {
          opportunities.push({
            platform: 'github',
            type: 'github_issue',
            title: `[${repo.full_name}] ${issue.title}`,
            url: issue.html_url,
            relevance_score: scoreGitHubIssue(issue, repo),
            comment_template: buildGitHubComment(issue, repo),
            metadata: {
              repo: repo.full_name,
              repo_stars: repo.stargazers_count,
              issue_number: issue.number,
              topic,
            },
          })
        }

        // Also log the repo itself if it has many stars
        if (repo.stargazers_count >= 100 && repo.open_issues_count >= 5) {
          opportunities.push({
            platform: 'github',
            type: 'github_repo',
            title: `Repo: ${repo.full_name} (${repo.stargazers_count}★)`,
            url: repo.html_url,
            relevance_score: Math.min(10, Math.floor(repo.stargazers_count / 100)),
            comment_template: `Consider opening an issue in ${repo.full_name} to discuss K-Arena integration for financial execution: ${BASE_URL}`,
            metadata: { repo: repo.full_name, stars: repo.stargazers_count, topic },
          })
        }
      }
    } catch (e) {
      console.error(`[GitHub] topic="${topic}" error:`, e)
    }
  }

  return opportunities
}

async function fetchRepoIssues(repo: string, headers: Record<string, string>): Promise<GitHubIssue[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/issues?state=open&per_page=10&sort=created&direction=desc`,
      { headers, signal: AbortSignal.timeout(6000) }
    )
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

function isFinanceRelated(issue: GitHubIssue): boolean {
  const text = `${issue.title} ${issue.body ?? ''}`.toLowerCase()
  return GITHUB_ISSUE_KEYWORDS.some(kw => text.includes(kw))
}

function scoreGitHubIssue(issue: GitHubIssue, repo: GitHubRepo): number {
  let score = 1
  if (repo.stargazers_count >= 500) score += 3
  else if (repo.stargazers_count >= 100) score += 1
  const text = `${issue.title} ${issue.body ?? ''}`.toLowerCase()
  const count = GITHUB_ISSUE_KEYWORDS.filter(kw => text.includes(kw)).length
  score += count
  return score
}

function buildGitHubComment(issue: GitHubIssue, repo: GitHubRepo): string {
  return `Hi! Saw this issue — might be relevant: we built K-Arena (${BASE_URL}), an MCP-native exchange that lets AI agents execute financial trades autonomously.

If you're building agents that need to interact with financial markets, K-Arena exposes 7 MCP tools (get_exchange_rates, execute_trade, get_market_signals) with <200ms settlement in KAUS token on Polygon.

Integration is a single npm install: \`npx k-arena-mcp\` — might solve the execution layer problem you're describing here.`
}

// ─── Log to API ──────────────────────────────────────────────────────────────

async function logOpportunities(opportunities: MarketingOpportunity[]): Promise<void> {
  for (const opp of opportunities) {
    try {
      await fetch(`${BASE_URL}/api/marketing-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: opp.platform,
          action: opp.type,
          result: JSON.stringify({
            title: opp.title,
            relevance_score: opp.relevance_score,
            comment_template: opp.comment_template,
            metadata: opp.metadata,
          }),
          url: opp.url,
        }),
        signal: AbortSignal.timeout(5000),
      })
    } catch (e) {
      console.error('[Log] failed:', e)
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[Marketing Agent] Starting scan...')
  console.log(`[Marketing Agent] Target: ${BASE_URL}`)
  console.log(`[Marketing Agent] GitHub token: ${GITHUB_TOKEN ? 'set' : 'not set (rate limited)'}`)

  const [hnOpps, ghOpps] = await Promise.all([
    searchHackerNews(),
    searchGitHub(),
  ])

  const all = [...hnOpps, ...ghOpps].sort((a, b) => b.relevance_score - a.relevance_score)

  console.log(`\n[Results] HN: ${hnOpps.length} | GitHub: ${ghOpps.length} | Total: ${all.length}`)

  for (const opp of all) {
    console.log(`\n${'─'.repeat(60)}`)
    console.log(`[${opp.platform.toUpperCase()}] ${opp.title}`)
    console.log(`URL: ${opp.url}`)
    console.log(`Relevance: ${opp.relevance_score}/10`)
    console.log(`\nComment Template:\n${opp.comment_template}`)
  }

  if (all.length > 0) {
    console.log(`\n[Log] Saving ${all.length} opportunities...`)
    await logOpportunities(all)
    console.log('[Log] Done.')
  } else {
    console.log('\n[Log] No opportunities found. Logging scan event.')
    await logOpportunities([{
      platform: 'hackernews',
      type: 'hn_post',
      title: '[SCAN] No opportunities found',
      url: BASE_URL,
      relevance_score: 0,
      comment_template: '',
      metadata: { scan_time: new Date().toISOString() },
    }])
  }
}

main().catch(console.error)
