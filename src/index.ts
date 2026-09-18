/**
 * fastify-type-provider-arktype
 *
 * A Fastify type provider for ArkType (https://arktype.io).
 *
 * Wires up ArkType `Type` schemas as Fastify's validator + serializer
 * compilers, and exposes typed FastifyInstance/FastifyRequest/FastifyReply
 * helpers so route handlers get full type inference and autocomplete on
 * `request.body`, `request.query`, etc.
 *
 * Peer dependencies: `fastify` (^5.x), `arktype` (^2.x)
 */

import { type, type Type } from "arktype";
import {
	type ContextConfigDefault,
	type FastifyBaseLogger,
	type FastifyInstance,
	type FastifyReply,
	type FastifyRequest,
	type FastifySchema,
	type FastifySchemaCompiler,
	type FastifySerializerCompiler,
	type FastifyTypeProvider,
	type RawReplyDefaultExpression,
	type RawRequestDefaultExpression,
	type RawServerDefault,
	type RouteGenericInterface,
} from "fastify";

// ---------------------------------------------------------------------------
// Type provider
// ---------------------------------------------------------------------------

/**
 * Maps an ArkType `Type` schema to its inferred TypeScript type for both
 * request validation (`validator`) and response serialization (`serializer`).
 *
 * Falls back to `unknown` (not `never`) so it stays substitutable with
 * `FastifyTypeProviderDefault`, as required by Fastify's contravariant
 * generics on `FastifyInstance`.
 */

export interface ArkTypeProvider extends FastifyTypeProvider {
	validator: this["schema"] extends Type<infer T> ? T : unknown;
	serializer: this["schema"] extends Type<infer T> ? T : unknown;
}

/**
 * Validates request data (body/params/querystring/headers) against an
 * ArkType schema.
 *
 * Register with: `app.setValidatorCompiler(validatorCompiler)`
 */
export function validatorCompiler(routeSchema: Parameters<FastifySchemaCompiler<Type>>[0]): ReturnType<FastifySchemaCompiler<Type>> {
	const { schema } = routeSchema;

	function validate(data: unknown) {
		const result = schema(data);
		if (result instanceof type.errors) {
			return { error: new Error(result.summary) };
		}
		return { value: result };
	}

	return validate;
}

/**
 * Validates and serializes response data against an ArkType schema.
 *
 * Register with: `app.setSerializerCompiler(serializerCompiler)`
 *
 * Throws (rather than returning `{ error }`) on failure, since a response
 * that doesn't match its own schema indicates a handler bug, not a bad
 * client request.
 */
export function serializerCompiler(
	routeSchema: Parameters<FastifySerializerCompiler<Type>>[0],
): ReturnType<FastifySerializerCompiler<Type>> {
	const { schema } = routeSchema;

	function serialize(data: unknown) {
		const result = schema(data);
		if (result instanceof type.errors) {
			throw new TypeError(`Response failed schema validation: ${result.summary}`);
		}
		return JSON.stringify(result);
	}

	return serialize;
}

// ---------------------------------------------------------------------------
// instance / request / reply types
// ---------------------------------------------------------------------------

export type FastifyInstanceArkType = FastifyInstance<
	RawServerDefault,
	RawRequestDefaultExpression,
	RawReplyDefaultExpression,
	FastifyBaseLogger,
	ArkTypeProvider
>;

export type FastifyRequestArkType<TSchema extends FastifySchema> = FastifyRequest<
	RouteGenericInterface,
	RawServerDefault,
	RawRequestDefaultExpression,
	TSchema,
	ArkTypeProvider
>;

export type FastifyReplyArkType<TSchema extends FastifySchema> = FastifyReply<
	RouteGenericInterface,
	RawServerDefault,
	RawRequestDefaultExpression,
	RawReplyDefaultExpression,
	ContextConfigDefault,
	TSchema,
	ArkTypeProvider
>;
