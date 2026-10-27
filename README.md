# @azpect/fastify-type-provider-arktype

A [Fastify](https://fastify.dev) type provider for [ArkType](https://arktype.io).

Use ArkType schemas to validate requests and serialize responses, with full type inference on `request.body`, `request.query`,
`request.params`, `request.headers`, and `reply.send()`. No separate TypeScript interfaces, no duplicated definitions.

## Features

- Validator compiler for `body`, `querystring`, `params`, and `headers`
- Serializer compiler that checks responses against their schema before sending
- `ArkTypeProvider` type provider for inference in route handlers
- Typed helpers for instances, requests, and replies when you split handlers out of the route definition

## Installation

```bash
npm install @azpect/fastify-type-provider-arktype
```

`fastify` and `arktype` are peer dependencies, so install them alongside it if you haven't already:

```bash
npm install fastify arktype
```

| Peer dependency | Version |
| --------------- | ------- |
| `fastify`       | `^5.x`  |
| `arktype`       | `^2.x`  |

## Quick start

```ts
import { serializerCompiler, validatorCompiler, type ArkTypeProvider } from "@azpect/fastify-type-provider-arktype";
import { type } from "arktype";
import Fastify from "fastify";

const app = Fastify().withTypeProvider<ArkTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

const User = type({
	name: "string",
	email: "string.email",
	age: "number.integer >= 0",
});

app.post(
	"/users",
	{
		schema: {
			body: User,
			response: {
				201: type({ id: "string", name: "string" }),
			},
		},
	},
	async (request, reply) => {
		// request.body is typed as { name: string; email: string; age: number }
		const { name } = request.body;

		return reply.status(201).send({ id: crypto.randomUUID(), name });
	},
);

await app.listen({ port: 3000 });
```

## Validating requests

Pass an ArkType `Type` for any of the request parts Fastify validates. Each one is inferred independently:

```ts
app.get(
	"/users/:id",
	{
		schema: {
			params: type({ id: "string.uuid" }),
			querystring: type({ "include?": "'posts' | 'comments'" }),
			headers: type({ "x-api-key": "string" }),
		},
	},
	async (request) => {
		request.params.id; // string
		request.query.include; // "posts" | "comments" | undefined
		request.headers["x-api-key"]; // string
	},
);
```

If validation fails, the compiler returns an `Error` whose message is ArkType's error summary. Fastify turns that into a `400` response by
default. You can customize the shape with Fastify's [`setErrorHandler`](https://fastify.dev/docs/latest/Reference/Server/#seterrorhandler).

## Validating responses

Add schemas under `response`, keyed by status code:

```ts
app.get(
	"/health",
	{
		schema: {
			response: {
				200: type({ status: "'ok'" }),
			},
		},
	},
	async () => ({ status: "ok" as const }),
);
```

The serializer checks each response against its schema, then serializes it with `JSON.stringify`.

If a response does not match its schema, the serializer **throws** a `TypeError` instead of returning an error object. A mismatched response
is a bug in your handler, not a bad client request, so Fastify surfaces it as a server error (`500` by default).

## Typed helpers

When a handler lives outside the route definition, the typed helpers keep inference intact.

### `FastifyInstanceArkType`

A `FastifyInstance` preconfigured with `ArkTypeProvider`. Use it for plugins and route modules:

```ts
import type { FastifyInstanceArkType } from "@azpect/fastify-type-provider-arktype";

export async function userRoutes(app: FastifyInstanceArkType) {
	app.get("/users", { schema: { response: { 200: type("string[]") } } }, async () => []);
}
```

### `FastifyRequestArkType<TSchema>` and `FastifyReplyArkType<TSchema>`

Typed request and reply objects for a given schema:

```ts
import type { FastifyReplyArkType, FastifyRequestArkType } from "@azpect/fastify-type-provider-arktype";
import { type } from "arktype";
import type { FastifySchema } from "fastify";

const createUserSchema = {
	body: type({ name: "string" }),
	response: { 201: type({ id: "string" }) },
} satisfies FastifySchema;

export async function createUser(
	request: FastifyRequestArkType<typeof createUserSchema>,
	reply: FastifyReplyArkType<typeof createUserSchema>,
) {
	request.body.name; // string
	return reply.status(201).send({ id: crypto.randomUUID() });
}

app.post("/users", { schema: createUserSchema }, createUser);
```

## Notes

- Inferred types come from the ArkType `Type`'s output type. If a schema contains morphs (transformations), handlers receive the transformed
  value.
- `ArkTypeProvider` falls back to `unknown` rather than `never` for non-ArkType schemas. This keeps it substitutable with Fastify's default
  provider, which Fastify's generics require.
