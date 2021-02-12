import { Context } from 'aws-lambda'

export type LambdaPromiseHandler<TEvent, TResult> = (event: TEvent, context: Context) => Promise<TResult>

export type Middleware<TEvent, TResult> = (
  event: TEvent,
  context: Context,
  next: LambdaPromiseHandler<TEvent, TResult>,
) => Promise<TResult>
