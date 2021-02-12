import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { PromiseHandler } from './types'
import withMiddlewares from './withMiddlewares'

type UserContext = Context & { user: { username: string; email: string } }
type CountContext = Context & { count: number }

const USERNAME = 'user'
const EMAIL = 'user@example.com'

// === MOCK HELPER FUNCTIONS ===================================================
const authenticate = async () => ({ username: USERNAME, email: EMAIL })

// === MOCK MIDDLEWARE =========================================================
const authMiddleware = async <TEvent, TResult>(event: TEvent, context: Context, next: PromiseHandler<TEvent, TResult>): Promise<TResult> => {
  const user = await authenticate()
  const userContext: UserContext = { ...context, user }
  return await next(event, userContext)
}

const incrementMiddleware = async <TEvent, TResult>(event: TEvent, context: Context, next: PromiseHandler<TEvent, TResult>): Promise<TResult> => {
  const countContext: CountContext = { ...context, count: ((context as CountContext).count ?? 0) + 1 }
  return await next(event, countContext)
}

const exitEarlyMiddleware = async <TEvent, TResult>(event: TEvent, context: Context, next: PromiseHandler<TEvent, TResult>): Promise<TResult> => {
  const numberOfKeys = [...Object.keys(event), ... Object.keys(context)].length
  if (numberOfKeys < 5 ) {
    return { statusCode: 400, body: JSON.stringify({ message: 'There were less than 5 keys.' }) } as unknown as TResult
  }

  return await next(event, context)
}

// === MOCK HANDLERS ===========================================================
const createApiHandlerForContextKey = (key: string) =>
  async (_: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    return { statusCode: 200, body: JSON.stringify((context as any)[key]) }
  }

describe('WithMiddlewares', () => {
  test('should pipe the request through a middleware for authenticaiton', async () => {
    const event = ({} as unknown) as APIGatewayProxyEvent
    const context = {} as Context
    const apiHandler = createApiHandlerForContextKey('user')
    const handler = withMiddlewares([authMiddleware], apiHandler)

    const result = await handler(event, context)
    const body = JSON.parse(result.body)

    expect(result.statusCode).toBe(200)
    expect(body).toStrictEqual({ username: USERNAME, email: EMAIL })
  })

  test('should pipe the request through several middlewares that increment the count', async () => {
    const event = ({} as unknown) as APIGatewayProxyEvent
    const context = {} as Context
    const apiHandler = createApiHandlerForContextKey('count')
    const handler = withMiddlewares([incrementMiddleware, incrementMiddleware], apiHandler)

    const result = await handler(event, context)
    const body = JSON.parse(result.body)
    expect(result.statusCode).toBe(200)
    expect(body).toBe(2)
  })

  test('middlewares should be able to exit early based on any condition', async () => {
    const event = ({} as unknown) as APIGatewayProxyEvent
    const context = {} as Context
    const spy = jest.fn()
    const handler = withMiddlewares([exitEarlyMiddleware], spy)

    const result = (await handler(event, context)) as { body: string, statusCode: number }
    const body = JSON.parse(result.body)
    expect(result.statusCode).toBe(400)
    expect(body).toStrictEqual({ message: 'There were less than 5 keys.' })
  })
})
