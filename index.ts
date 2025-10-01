import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const locationSchema = z.object({
	latitude: z.number(),
	longitude: z.number(),
})

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

Requires running https://github.com/RhetTbull/locationator on the device on port 8000.
		`.trim(),
	},
)

server.registerTool(
	'get_current_location',
	{
		title: 'Get Current Location',
		description: `Returns the latitude and longitude of the user's device.`,
		outputSchema: { latitude: z.number(), longitude: z.number() },
		annotations: {
			readOnlyHint: true,
		},
	},
	async () => {
		const response = await fetch('http://localhost:8000/current_location')
		const data = await response.json()

		const location = locationSchema.parse(data)
		const structuredContent = {
			latitude: location.latitude,
			longitude: location.longitude,
		}
		return {
			structuredContent,
			content: [
				{
					type: 'text',
					text: `Latitude: ${location.latitude}\nLongitude: ${location.longitude}`,
				},
			],
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
