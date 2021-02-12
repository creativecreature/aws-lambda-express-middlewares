import { Context } from 'aws-lambda'

import { PromiseHandler, Middleware } from './types'

const withMiddlewares = <TEvent, TResult>(
  middlewares: Middleware<TEvent, TResult>[],
  handler: PromiseHandler<TEvent, TResult>,
): PromiseHandler<TEvent, TResult> => {
  return middlewares.reverse().reduce<PromiseHandler<TEvent, TResult>>((acc, f) => {
    return (event: TEvent, context: Context): Promise<TResult> => f(event, context, acc)
  }, handler)
}

export default withMiddlewares
