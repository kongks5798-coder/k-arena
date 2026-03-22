/**
 * K-Arena Key Vault — AES-256-GCM 기반 로컬 키 암호화
 * 프라이빗 키를 평문으로 저장하지 않고 암호화된 형태로 보관
 *
 * 사용법:
 *   encrypt: npx tsx lib/key-vault.ts encrypt <privateKey> <password>
 *   decrypt: npx tsx lib/key-vault.ts decrypt <encryptedKey> <password>
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LEN = 32
const IV_LEN = 16
const SALT_LEN = 32
const TAG_LEN = 16

export function encryptKey(plaintext: string, password: string): string {
  const salt = randomBytes(SALT_LEN)
  const iv = randomBytes(IV_LEN)
  const key = scryptSync(password, salt, KEY_LEN)

  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  // Format: salt(32) + iv(16) + tag(16) + encrypted → hex
  const result = Buffer.concat([salt, iv, tag, encrypted])
  return result.toString('hex')
}

export function decryptKey(encryptedHex: string, password: string): string {
  const buf = Buffer.from(encryptedHex, 'hex')

  const salt = buf.slice(0, SALT_LEN)
  const iv = buf.slice(SALT_LEN, SALT_LEN + IV_LEN)
  const tag = buf.slice(SALT_LEN + IV_LEN, SALT_LEN + IV_LEN + TAG_LEN)
  const encrypted = buf.slice(SALT_LEN + IV_LEN + TAG_LEN)

  const key = scryptSync(password, salt, KEY_LEN)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  return decipher.update(encrypted) + decipher.final('utf8')
}

/** 런타임에서 암호화된 키를 복호화하여 ethers.js에 전달 */
export function getDeployerKey(): string {
  const encrypted = process.env.DEPLOYER_PRIVATE_KEY_ENCRYPTED
  const password = process.env.KEY_VAULT_PASSWORD

  if (encrypted && password) {
    return decryptKey(encrypted, password)
  }

  // 폴백: 평문 키 (개발용, 프로덕션에서는 암호화된 키 사용 권장)
  const plain = process.env.DEPLOYER_PRIVATE_KEY
  if (plain) return plain.startsWith('0x') ? plain : '0x' + plain

  throw new Error('No deployer key found. Set DEPLOYER_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY_ENCRYPTED + KEY_VAULT_PASSWORD')
}

// CLI 사용
if (process.argv[2] === 'encrypt' && process.argv[3] && process.argv[4]) {
  const result = encryptKey(process.argv[3], process.argv[4])
  console.log('DEPLOYER_PRIVATE_KEY_ENCRYPTED=' + result)
} else if (process.argv[2] === 'decrypt' && process.argv[3] && process.argv[4]) {
  const result = decryptKey(process.argv[3], process.argv[4])
  console.log('Decrypted:', result.slice(0, 8) + '...')
}
