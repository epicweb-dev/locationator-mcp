#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const locationSchema = z
	.object({
		latitude: z.number(),
		longitude: z.number(),
	})
	.passthrough()

// Create server instance
const server = new McpServer(
	{
		name: 'locationator',
		version: '1.0.0',
		capabilities: {
			tools: {},
		},
	},
	{
		instructions: `
This gives the user the location of their device.

Requires running https://github.com/RhetTbull/locationator on the device.
		`.trim(),
	},
)

server.tool(
	'get_current_location',
	`
Returns the latitude and longitude of the user's device.
	`.trim(),
	async () => {
		try {
			const response = await fetch('http://localhost:8000/current_location')
			const data = await response.json()

			const location = locationSchema.parse(data)
			return {
				content: [
					{
						type: 'text',
						text: `Latitude: ${location.latitude}\nLongitude: ${location.longitude}`,
					},
				],
			}
		} catch (error) {
			return {
				isError: true,
				content: [{ type: 'text', text: getErrorMessage(error) }],
			}
		}
	},
)

async function main() {
	const transport = new StdioServerTransport()
	await server.connect(transport)
	console.error('locationator MCP Server running on stdio')
}

main().catch((error) => {
	console.error('Fatal error in main():', error)
	process.exit(1)
})

export function getErrorMessage(error) {
	if (typeof error === 'string') return error
	if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof error.message === 'string'
	) {
		return error.message
	}
	console.error('Unable to get error message for error', error)
	return 'Unknown Error'
}
