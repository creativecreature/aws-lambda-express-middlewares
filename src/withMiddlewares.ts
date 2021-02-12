import { Context } from 'aws-lambda'

import { LambdaPromiseHandler, Middleware } from './types'

const withMiddlewares = <TEvent, TResult>(
  middlewares: Middleware<TEvent, TResult>[],
  handler: LambdaPromiseHandler<TEvent, TResult>,
): LambdaPromiseHandler<TEvent, TResult> => {
  return middlewares.reverse().reduce<LambdaPromiseHandler<TEvent, TResult>>((acc, f) => {
    return (event: TEvent, context: Context): Promise<TResult> => f(event, context, acc)
  }, handler)
}

export default withMiddlewares
