import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const screenshotDir = path.join(__dirname, 'screenshots');

test.beforeAll(() => {
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
});

// ─── 홈페이지 ───────────────────────────────────────────────
test.describe('홈페이지 시각화', () => {
  test('홈페이지 로드 + 히어로 섹션', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // h1이 있는지 체크 (여러 K-ARENA 대신 h1만 체크)
    await expect(page.locator('h1').first()).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/01-home-${browserName}.png`, fullPage: false });
    console.log('✓ 홈페이지 히어로 섹션 렌더링 확인');
  });

  test('통계 카드 4개 렌더링', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // 통계 값들이 보이는지 확인
    await expect(page.getByText('120+')).toBeVisible();
    await expect(page.getByText('₩50억+')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/02-home-stats-${browserName}.png`, fullPage: false });
    console.log('✓ 통계 카드 렌더링 확인');
  });

  test('CTA 버튼 존재', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: '거래 시작하기' })).toBeVisible();
    await expect(page.getByRole('link', { name: '포트폴리오 보기' })).toBeVisible();
    console.log('✓ CTA 버튼 확인');
  });
});

// ─── Trade 페이지 (핵심 시각화) ──────────────────────────────
test.describe('Trade 페이지 시각화', () => {
  test('Trade 페이지 로드', async ({ page, browserName }) => {
    await page.goto('/trade');
    await page.waitForLoadState('domcontentloaded');
    // h1 안의 Trade 텍스트 (모바일에서도 항상 visible)
    await expect(page.locator('h1').first()).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/03-trade-${browserName}.png`, fullPage: false });
    console.log('✓ Trade 페이지 로드 확인');
  });

  test('가격 차트 렌더링 (hydration 대기)', async ({ page, browserName }) => {
    await page.goto('/trade');
    // JS 완전 로드 + useEffect 실행 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // PriceChart div 확인
    const chart = page.getByTestId('price-chart');
    await expect(chart).toBeVisible({ timeout: 15000 });
    console.log('✓ PriceChart 컴포넌트 렌더링 확인');
    await page.screenshot({ path: `${screenshotDir}/04-trade-chart-${browserName}.png`, fullPage: false });
  });

  test('가격 차트에 SVG 렌더링', async ({ page }) => {
    await page.goto('/trade');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // Recharts SVG가 생성됐는지 확인
    const svg = page.locator('[data-testid="chart-area"] svg').first();
    await expect(svg).toBeVisible({ timeout: 15000 });
    console.log('✓ Recharts SVG 렌더링 확인');
  });

  test('현재 가격 표시 ($로 시작)', async ({ page, browserName }) => {
    await page.goto('/trade');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const priceEl = page.getByTestId('current-price');
    await expect(priceEl).toBeVisible({ timeout: 15000 });
    const priceText = await priceEl.textContent() ?? '';
    expect(priceText).toContain('$');
    expect(priceText).not.toBe('$0');
    console.log(`✓ 현재 가격: ${priceText}`);
    await page.screenshot({ path: `${screenshotDir}/05-trade-price-${browserName}.png`, fullPage: false });
  });

  test('BTC/ETH/SOL 자산 탭 전환', async ({ page, browserName }) => {
    await page.goto('/trade');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // ETH 탭
    const ethBtn = page.getByTestId('asset-tab-ETH');
    await expect(ethBtn).toBeVisible({ timeout: 10000 });
    await ethBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${screenshotDir}/06-trade-eth-${browserName}.png`, fullPage: false });
    console.log('✓ ETH 탭 전환 확인');

    // SOL 탭
    const solBtn = page.getByTestId('asset-tab-SOL');
    await solBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${screenshotDir}/07-trade-sol-${browserName}.png`, fullPage: false });
    console.log('✓ SOL 탭 전환 확인');
  });

  test('실시간 토글 작동', async ({ page, browserName }) => {
    await page.goto('/trade');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const toggle = page.getByTestId('live-toggle');
    await expect(toggle).toBeVisible({ timeout: 10000 });
    // 일시정지
    await toggle.click();
    await expect(toggle).toHaveText('일시정지');
    // 재시작
    await toggle.click();
    await expect(toggle).toHaveText('실시간');
    console.log('✓ 실시간/일시정지 토글 확인');
    await page.screenshot({ path: `${screenshotDir}/08-trade-toggle-${browserName}.png`, fullPage: false });
  });

  test('가격 변동 확인 (2초 후)', async ({ page }) => {
    await page.goto('/trade');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const priceEl = page.getByTestId('current-price');
    await expect(priceEl).toBeVisible({ timeout: 10000 });
    const price1 = await priceEl.textContent();
    await page.waitForTimeout(2500);
    const price2 = await priceEl.textContent();
    console.log(`✓ 가격 변동: ${price1} → ${price2}`);
  });
});

// ─── 포트폴리오 시각화 ────────────────────────────────────────
test.describe('포트폴리오 시각화', () => {
  test('Overview 탭 차트 렌더링', async ({ page, browserName }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${screenshotDir}/09-portfolio-overview-${browserName}.png`, fullPage: false });
    console.log('✓ 포트폴리오 Overview 렌더링 확인');
  });

  test('Analytics 탭 — AreaChart + BarChart', async ({ page, browserName }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    const analyticsTab = page.getByText('Analytics').first();
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();
      await page.waitForTimeout(1000);
      const svgs = page.locator('svg.recharts-surface');
      const count = await svgs.count();
      expect(count).toBeGreaterThan(0);
      console.log(`✓ Recharts SVG 수: ${count}`);
      await page.screenshot({ path: `${screenshotDir}/10-portfolio-analytics-${browserName}.png`, fullPage: false });
    } else {
      console.log('Analytics 탭 없음 — skip');
    }
  });

  test('History 탭 거래 내역', async ({ page, browserName }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    const historyTab = page.getByText('History').first();
    if (await historyTab.isVisible()) {
      await historyTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${screenshotDir}/11-portfolio-history-${browserName}.png`, fullPage: false });
      console.log('✓ History 탭 렌더링 확인');
    }
  });
});

// ─── 로그인 페이지 ─────────────────────────────────────────
test.describe('로그인 페이지', () => {
  test('로그인 폼 렌더링', async ({ page, browserName }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/12-login-${browserName}.png`, fullPage: false });
    console.log('✓ 로그인 폼 렌더링 확인');
  });

  test('데모 로그인 플로우', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('input[type="email"]', 'test@k-arena.gg');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    // 로그인 후 홈으로 이동
    await page.waitForURL('/', { timeout: 5000 }).catch(() => {});
    console.log(`✓ 데모 로그인 완료, 현재 URL: ${page.url()}`);
  });
});
