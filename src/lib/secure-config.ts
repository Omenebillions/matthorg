// lib/secure-config.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

export class SecureConfig {
  private static instance: SecureConfig
  private encryptionKey: Buffer
  
  private constructor() {
    // Load key from environment or KMS
    const key = process.env.ENCRYPTION_KEY
    if (!key) throw new Error('Encryption key missing')
    this.encryptionKey = Buffer.from(key, 'hex')
  }

  static getInstance() {
    if (!SecureConfig.instance) {
      SecureConfig.instance = new SecureConfig()
    }
    return SecureConfig.instance
  }

  // Encrypt sensitive data at rest
  encrypt(text: string): string {
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Store IV + AuthTag + Encrypted data
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  // Decrypt sensitive data
  decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':')
    
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}