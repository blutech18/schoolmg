import crypto from 'crypto'

const SCRYPT_PREFIX = 'scrypt$'

export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.randomBytes(16)
  const saltB64 = salt.toString('base64')
  const key = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(plain, salt, 64, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(derivedKey as Buffer)
    })
  })
  const hashB64 = key.toString('base64')
  return `${SCRYPT_PREFIX}${saltB64}$${hashB64}`
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  try {
    if (stored.startsWith(SCRYPT_PREFIX)) {
      const [, saltB64, hashB64] = stored.split('$')
      const salt = Buffer.from(saltB64, 'base64')
      const expected = Buffer.from(hashB64, 'base64')
      const key = await new Promise<Buffer>((resolve, reject) => {
        crypto.scrypt(plain, salt, expected.length, (err, derivedKey) => {
          if (err) return reject(err)
          resolve(derivedKey as Buffer)
        })
      })
      return crypto.timingSafeEqual(key, expected)
    }
    if (stored.startsWith('sha256$')) {
      const [, salt, hexHash] = stored.split('$')
      const h = crypto.createHash('sha256').update(plain + salt, 'utf8').digest('hex').toUpperCase()
      return h === hexHash
    }
    // Fallback: no hash (plaintext or other), compare directly
    return plain === stored
  } catch {
    return false
  }
}

export function isHashed(password: string | null | undefined): boolean {
  if (!password) return false
  // Check for scrypt, bcrypt, and legacy sha256 hashes
  return password.startsWith(SCRYPT_PREFIX) || 
         password.startsWith('$2') || 
         password.startsWith('sha256$')
}


