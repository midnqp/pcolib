export type PcolibResponse = {headers: any, body: any, status: number, statusText: string}

export type ChainedExample = {
	readonly data: NormData;
	query(value: Record<string, any>):ChainedExample;
	body(value: Record<string, any>):ChainedExample;
	params(value: Record<string, any>):ChainedExample;
	headers(value: Record<string,any>):ChainedExample;
	example(exmp: Example):ChainedExample;
	run():Promise<PcolibResponse>
}

export type ChainedRequest = {
	request: (nameOrIdx: FolderOrReq) => ChainedExample;
}

export interface Options {
	/** Collection object, or the URL. */
	collection?: Record< string, any >

	/** Variables, with values. */
	variables?: Record<string, any>

	/** Global request overhead. */
	global?: InputNormData 
}

/**
 * Normalized data structure to make requests,
 * and to return responses.
 */
export type NormData = {
	query: Record< string, any >
	params: Record< string, any >
	body: Record< string, any >
	headers: Record< string, any >
}

/**
 * Data structure that is possible to 
 * be normalized.
 */
export type InputNormData = {
	url?: { variable: object[]; query: object[] }
	query?: object
	params?: object
	body?: { raw: object } | Record< string, any >
	headers?: object
}

/**
 * Represents a postman folder, or a request.
 *
 * - string: Folder/request's name
 * - number: Zero-based index under folder, or from root
 */
export type FolderOrReq = string | number

/**
 * Represents postman example.
 *
 * - string: Example's name
 * - number: Zero-based index under a request
 * - undefined: Use the request's own data, without
 *   using data from examples
 */
export type Example = string | number | undefined

export type ExampleArray = [query?: object, params?: object, body?: object, headers?: object]
