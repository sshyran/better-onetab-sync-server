const jwt = require('jsonwebtoken')
const conf = require('@cnwangjie/conf')
const User = require('./schema/user')
const jwtHeader = conf.jwt_header
const genTokenForUser = (user, payload = {}) => {
  return jwt.sign(payload, conf.jwt_secret, {
    subject: user.uid,
    expiresIn: 24 * 60 * 60,
  })
}

const verifyToken = token => {
  try {
    jwt.verify(token, conf.jwt_secret)
    return true
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError
      && error.message.startsWith('jwt expired')
      && payload.iat + 30 * 24 * 60 * 60 < Date.now() / 1000) {
      return true
    }
  }
  return false
}

const getUserFromToken = token => {
  return User.findOne({uid: jwt.decode(token).sub})
}

const authMiddleware = async (ctx, next) => {
  if (ctx.header[jwtHeader]) {
    const token = ctx.header[jwtHeader]
    if (verifyToken(token)) {
      ctx.user = await getUserFromToken(token)
    }
  }
  await next()
  if (ctx.user) {
    ctx.res.setHeader(jwtHeader, genTokenForUser(ctx.user))
  }
}

module.exports = {
  genTokenForUser,
  verifyToken,
  getUserFromToken,
  authMiddleware,
}