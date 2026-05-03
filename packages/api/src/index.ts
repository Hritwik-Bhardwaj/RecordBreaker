import 'dotenv/config'
import Fastify, { FastifyRequest, FastifyReply } from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import exerciseRoutes from './routes/exercises'
import leaderboardRoutes from './routes/leaderboards'
import healthRoutes from './routes/health'
import adminRoutes from './routes/admin'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

const app = Fastify({ logger: true })

async function build() {
  await app.register(cors, { origin: true })
  await app.register(jwt, { secret: process.env.JWT_SECRET ?? 'dev-secret-change-me' })

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })

  app.setErrorHandler((error: Error & { statusCode?: number }, _req, reply) => {
    const statusCode = error.statusCode ?? 500
    reply.status(statusCode).send({ error: error.message, statusCode })
  })

  await app.register(healthRoutes)
  await app.register(exerciseRoutes, { prefix: '/api/v1' })
  await app.register(leaderboardRoutes, { prefix: '/api/v1' })
  await app.register(adminRoutes, { prefix: '/api/v1' })

  return app
}

async function start() {
  const server = await build()
  const port = parseInt(process.env.PORT ?? '3000', 10)

  try {
    await server.listen({ port, host: '0.0.0.0' })
    console.log(`Server running on port ${port}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

process.on('SIGTERM', async () => {
  await app.close()
  process.exit(0)
})

start()
