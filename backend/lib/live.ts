/**
 * The deployment binds a Durable Object class named `Live` for the platform's `/live` socket.
 * This app does not use live table notifications (its pages re-read after every write), so the
 * class only exists to satisfy the binding and answers that live updates are not enabled.
 */
export class Live {
  constructor(_state: unknown, _env: unknown) {}

  async fetch(): Promise<Response> {
    return new Response(JSON.stringify({ message: 'Live updates are not enabled for this app.' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
