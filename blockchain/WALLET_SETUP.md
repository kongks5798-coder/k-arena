# Field Nine — Wallet Setup Guide

## 필요한 지갑 2개

### 1. Treasury Wallet (금고)
- **역할**: 초기 KAUS 10M 보관, Genesis 판매금 수령
- **권장**: MetaMask (나중에 Gnosis Safe로 업그레이드)
- **네트워크**: Polygon Mainnet

### 2. Fee Collector Wallet (수수료 수금)
- **역할**: 모든 거래 0.1% 수수료 자동 수령
- **권장**: 별도 MetaMask 지갑 (Treasury와 분리)
- **네트워크**: Polygon Mainnet

---

## MetaMask 지갑 만들기

### 설치
1. https://metamask.io → "Download" → Chrome Extension
2. "Create a new wallet" 클릭
3. **시드 문구 12단어 반드시 오프라인 기록** (분실 시 복구 불가)
4. 완료 후 지갑 주소 복사 (0x로 시작하는 42자리)

### Polygon 네트워크 추가
MetaMask → 네트워크 선택 → "Add network manually":
```
Network Name: Polygon Mainnet
RPC URL:      https://polygon-rpc.com
Chain ID:     137
Symbol:       MATIC
Explorer:     https://polygonscan.com
```

### MATIC 충전 (가스비용)
- Binance/Upbit에서 MATIC 구매 후 Polygon 주소로 전송
- 필요량: ~10 MATIC (약 $5-8) — 배포 + 초기 트랜잭션 충분

---

## Gnosis Safe (멀티시그 — 추천)
더 안전한 Treasury 관리:
1. https://app.safe.global/new-safe
2. "Create new Safe" → 2/3 multisig 설정
3. 팀원 3명 지갑 주소 입력 → 2명 승인 필요
4. Safe 주소를 TREASURY_ADDRESS로 사용

---

## .env 설정

```bash
# blockchain/.env
DEPLOYER_PRIVATE_KEY=0x...  # 배포자 MetaMask private key
TREASURY_ADDRESS=0x...       # Treasury MetaMask/Gnosis Safe 주소
FEE_COLLECTOR_ADDRESS=0x...  # Fee Collector MetaMask 주소
POLYGONSCAN_API_KEY=...       # https://polygonscan.com/myapikey
```

## Private Key 찾는 방법 (MetaMask)
MetaMask → 계정 상세 → "Export private key" → 비밀번호 입력 → 복사

**⚠️ Private Key는 절대 타인에게 공유하지 마세요**

---

## 배포 후 수익 출금 방법

```
수수료 누적 확인:
  Polygonscan에서 FEE_COLLECTOR_ADDRESS 잔고 확인

KAUS → USDC 변환:
  QuickSwap (https://quickswap.exchange) Polygon
  KAUS → USDC 스왑

USDC → KRW:
  Binance: USDC 입금 → USDC/KRW 거래 → 원화 출금
  또는 Upbit: USDC 입금 → 원화 전환
```
