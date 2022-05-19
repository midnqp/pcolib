import * as util from './util.js'
import {chainRequest, chainExample, fireRequest} from './util-pcolib.js'
import * as T from './typings/index.js'
import axios from 'axios'
import psdk from 'postman-collection'

class Pcolib {
	private collection: Record<string, any> = {}
	private variables: Record<string, any> = {}
	private global: T.InputNormData = {}

	constructor (options: T.Options) {
		const {collection, variables, global} = options
		if (variables) this.variables = variables
		if (global) this.global = global

		if (collection && !psdk.Collection.isCollection(collection))
			throw Error('Pcolib Error: Expected Postman collection schema.')
	}

	/**
	 * @param info postman collection info
	 * @param {string} info.id - postman collection id
	 * @param {string} info.apikey - postman api key
	 */
	async fetchCollection (info: {id: string; apikey: string}) {
		const {id, apikey} = info
		try {
			const url = 'https://api.getpostman.com/collections/' + id
			const opts = {headers: {'x-api-key': apikey}}
			const res = await axios.get(url, opts)
			this.collection = res.data.collection
		} catch (err: any) {
			let msg = 'Pcolib Error: Collection could not be downloaded.'
			if (err?.response?.data) {
				msg += '\nResponse: ' + util.expand(err.response.data)
			}
			throw Error(msg)
		}
	}

	/**
	 * Gets usable, normalized data to make
	 * request.
	 *
	 * If `request` and
	 * `example` are omitted, then takes data by
	 * method-chaining.
	 */
	get (folder: T.FolderOrReq): T.ChainedRequest
	get (folder: T.FolderOrReq, request: T.FolderOrReq): T.ChainedExample
	get (
		folder: T.FolderOrReq,
		request: T.FolderOrReq,
		example: T.Example | T.ExampleArray
	): T.NormData

	get (folder: T.FolderOrReq, request?: T.FolderOrReq, example?: T.Example) {
		// TODO chain folder??
		const parentFolder = Pcolib.pinpointFolder(this.collection, folder)

		// If request not mentioned,
		// have a chain to take request.
		if (!request) return chainRequest(parentFolder)
		const parentRequest = Pcolib.pinpointRequest(parentFolder, request)

		// If example not mentioned,
		// have a chain to take example, or custom data.
		if (!example) return chainExample.call(this, parentRequest)
		const data = Pcolib.pinpointExample(parentRequest, example)

		// If all mentioned, then it's good for us.
		return data
	}

	public static pinpointFolder (collection: Record<string, any>, folder: T.FolderOrReq) {
		let item
		util.log.debug('folder: ' + folder)
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
		util.log.debug('request: ' + request)
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
		util.log.debug('example: ' + example)
		switch (typeof example) {
			case 'string': {
				if (!example.includes('dev: ')) throw Error(`Example name must begin with "dev: "`)
				const _item = util.next_where(parentRequest.response, example)
				util.check(_item, 'Example')
				data = (_item as Record<string, any>).originalRequest
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

		if (!Array.isArray(data)) normalizedData = Pcolib.pinpointExample(parentRequest, data)
		else {
			// Custom easily-normizable data.
			const query = data[0] || {}
			const params = data[1] || {}
			const body = data[2] || {}
			const headers = data[3] || {}
			normalizedData = {query, params, body, headers}
		}

		const ret = await fireRequest({
			requestData: parentRequest.request,
			normalizedData,
			variables: this.variables,
			globals: this.global,
		})
		return ret
	}

	/**
	 * Given request info & normalized data,
	 * fires a HTTP request.
	 *
	 * @returns - HTTP response body.
	 */
	private async fireRequest (requestData, data: T.NormData) {
		return fireRequest({
			requestData,
			normalizedData: data,
			variables: this.variables,
			globals: this.global,
		})
	}
}

export default Pcolib
