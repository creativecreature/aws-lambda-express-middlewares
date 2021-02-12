import { Context } from 'aws-lambda'

export type PromiseHandler<TEvent, TResult> = (event: TEvent, context: Context) => Promise<TResult>

export type Middleware<TEvent, TResult> = (
  event: TEvent,
  context: Context,
  next: PromiseHandler<TEvent, TResult>,
) => Promise<TResult>
