import * as util from './util.js'
import {chainRequest, chainExample} from './util-pcolib.js'
import * as T from './typings/index.js'
import { URL } from 'url'
import axios from 'axios'

class Pcolib {
	private collection: Record< string, any > = {}
	private variables: Record< string, any > = {}
	private global: T.InputNormData = {}

	constructor (options: T.Options) {
		const { collection, variables, global } = options
		this.collection = collection
		if (variables) this.variables = variables
		if (global) this.global = global
	}
	
	/**
	 * Gets usable, normalized data to make
	 * request.
	 *
	 * If `request` and
	 * `example` are omitted, then takes data by
	 * method-chaining.
	 */
	get (folder:T.FolderOrReq):ReturnType<typeof chainRequest>
	get (folder: T.FolderOrReq, request: T.FolderOrReq): ReturnType<typeof chainExample>
	get (folder: T.FolderOrReq, request:T.FolderOrReq, example:T.Example|T.ExampleArray):T.NormData

	get (folder: T.FolderOrReq, request?: T.FolderOrReq, example?: T.Example) {
		// TODO chain folder??
		const parentFolder = Pcolib.pinpointFolder(this.collection, folder)

		// If request not mentioned,
		// have a chain to take request.
		if (!request) return chainRequest(parentFolder)
		const parentRequest = Pcolib.pinpointRequest(parentFolder, request)

		// If example not mentioned,
		// have a chain to take example, or custom data.
		if (!example) return chainExample(parentRequest)
		const data = Pcolib.pinpointExample(parentRequest, example)

		// If all mentioned, then it's good for us.
		return data
	}

	public static pinpointFolder (
		collection: Record< string, any >,
		folder: T.FolderOrReq
	) {
		let item
		util.log.debug('folder: '+folder)
		switch (typeof folder) {
			case 'string':
				item = util.next_where(collection.item, folder)
				util.check(item, 'Folder')
				break
			case 'number':
				item = item.item[folder]
				util.check(item, 'Folder')
				break
		}
		return item
	}

	public static pinpointRequest (parentFolder, request: T.FolderOrReq) {
		let ret
		util.log.debug('request: '+request)
		switch (typeof request) {
			case 'string':
				ret = util.next_where(parentFolder.item, request)
				util.check(ret, 'Request')
				break
			case 'number':
				ret = parentFolder.item[request]
				util.check(ret, 'Request')
				break
		}
		return ret
	}

	public static pinpointExample (parentRequest, example: T.Example) {
		let data
		util.log.debug('example: '+example)
		switch (typeof example) {
			case 'string': {
				if (!example.includes('dev: '))
					throw Error(`Example name must begin with "dev: "`)
				const _item = util.next_where(parentRequest.response, example)
				util.check(_item, 'Example')
				data = (_item as Record< string, any >).originalRequest
				break
			}
			case 'number': {
				const _item = parentRequest.response[example]
				util.check(_item, 'Example')
				data = _item.originalRequest
				break
			}
			case 'undefined': {
				data = parentRequest.request
				break
			}
		}
		return util.normalize(data)
	}

	async run (
		folder: T.FolderOrReq,
		request: T.FolderOrReq,
		data: T.Example | T.ExampleArray = undefined
	) {
		let normalizedData

		const parentFolder = Pcolib.pinpointFolder(this.collection, folder)

		const parentRequest = Pcolib.pinpointRequest(parentFolder, request)

		// Custom easily-normizable data.
		if (Array.isArray(data)) {
			const query = data[0] || {}
			const params = data[1] || {}
			const body = data[2] || {}
			const headers = data[3] || {}
			normalizedData = { query, params, body, headers }
		}
		else normalizedData = Pcolib.pinpointExample(parentRequest, data)

		const ret = await this.fireRequest(
			parentRequest.request,
			normalizedData
		)
		return ret
	}

	/**
	 * Given request info & normalized data,
	 * fires a HTTP request.
	 *
	 * @returns - HTTP response body.
	 */
	private async fireRequest (obj, data: T.NormData) {
		let out: any

		const method: 'get' | 'body' | 'delete' | 'put' | 'post' =
			obj.method.toLowerCase()
		const { query, params, body } = data
		// for headers, local being
		// over-ridden by global.
		const headers = { ...data.headers, ...this.global.headers }

		let url = obj.url.raw
		url = util.replace_path_var(url, params)
		url = util.replace_postman_var(url, this.collection.variable)
		url = new URL(url)
		const { pathname } = url
		url = url.origin + pathname

		const interf = axios[method]
		switch (method) {
			case 'delete':
			case 'get':
				out = await interf(url, { params: query, headers })
				break
			case 'put':
			case 'post':
				out = await interf(url, body, { params: query, headers })
				break
			default:
				throw Error(`Found an unhandled "${method}" request!`)
		}
		return out?.data
	}
}

export default Pcolib
