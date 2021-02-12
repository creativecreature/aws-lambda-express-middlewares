import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { PromiseHandler } from './types'
import withMiddlewares from './withMiddlewares'

type UserContext = Context & { user: { username: string; email: string } }

const USERNAME = 'user'
const EMAIL = 'user@example.com'

const authenticate = async () => ({ username: USERNAME, email: EMAIL })

const authMiddleware = async <TEvent, TResult>(
  event: TEvent,
  context: Context,
  next: PromiseHandler<TEvent, TResult>,
): Promise<TResult> => {
  const user = await authenticate()
  const userContext: UserContext = { ...context, user }
  return await next(event, userContext)
}

const apiHandler = async (_: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return { statusCode: 200, body: JSON.stringify((context as UserContext).user) }
}

describe('WithMiddlewares', () => {
  test('should pipe the request through a middleware for authenticaiton', async () => {
    const event = ({} as unknown) as APIGatewayProxyEvent
    const context = {} as Context
    const handler = withMiddlewares([authMiddleware], apiHandler)

    const result = await handler(event, context)
    const body = JSON.parse(result.body)

    expect(result.statusCode).toBe(200)
    expect(body).toStrictEqual({ username: USERNAME, email: EMAIL })
  })
})
