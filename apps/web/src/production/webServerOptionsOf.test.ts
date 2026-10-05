import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { type Server, serve } from 'srvx'
import { afterAll, describe, expect, it } from 'vitest'
import { webServerOptionsOf } from './webServerOptionsOf'

const hashedScript = 'console.log("built")'.repeat(200)
const artImage = 'not really a png'

async function builtClient(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'mygame-web-client-'))
  await mkdir(join(directory, 'assets'))
  await mkdir(join(directory, 'art'))
  await writeFile(join(directory, 'assets', 'index-abc123.js'), hashedScript)
  await writeFile(join(directory, 'art', 'barracks-1.png'), artImage)
  return directory
}

const clientDirectory = await builtClient()

interface RenderingServer {
  readonly server: Server
  readonly renderedPaths: ReadonlyArray<string>
}

function webServerOn(environment: NodeJS.ProcessEnv): RenderingServer {
  const renderedPaths: Array<string> = []
  const options = webServerOptionsOf(environment, {
    clientDirectory,
    render: (request) => {
      const { pathname } = new URL(request.url)
      renderedPaths.push(pathname)
      return new Response('<!DOCTYPE html>', {
        status: pathname === '/sign-in' ? 200 : 404,
        headers: { 'content-type': 'text/html' },
      })
    },
  })
  const server = serve({ ...options, manual: true, silent: true, gracefulShutdown: false })
  return { server, renderedPaths }
}

function get(server: Server, path: string, headers: HeadersInit = {}): Promise<Response> {
  return Promise.resolve(server.fetch(new Request(`http://localhost${path}`, { headers })))
}

describe('webServerOptionsOf', () => {
  afterAll(async () => {
    await rm(clientDirectory, { recursive: true, force: true })
  })

  it('refuses to start without WEB_PORT', () => {
    expect(() => webServerOptionsOf({}, { clientDirectory, render: () => new Response() })).toThrow(
      'WEB_PORT must be an integer from 1 to 65535, got undefined',
    )
  })

  it('refuses a WEB_PORT that is not a port', () => {
    expect(() =>
      webServerOptionsOf({ WEB_PORT: '70000' }, { clientDirectory, render: () => new Response() }),
    ).toThrow('WEB_PORT must be an integer from 1 to 65535, got 70000')
  })

  it('listens on WEB_PORT', () => {
    const options = webServerOptionsOf(
      { WEB_PORT: '3001' },
      { clientDirectory, render: () => new Response() },
    )

    expect(options.port).toBe(3001)
  })

  it('serves a static file before the server render', async () => {
    const { server, renderedPaths } = webServerOn({ WEB_PORT: '3001' })

    const response = await get(server, '/assets/index-abc123.js')

    expect(response.status).toBe(200)
    expect(await response.text()).toBe(hashedScript)
    expect(renderedPaths).toEqual([])
  })

  it('hands a path with no static file to the server render', async () => {
    const { server, renderedPaths } = webServerOn({ WEB_PORT: '3001' })

    const response = await get(server, '/sign-in')

    expect(response.status).toBe(200)
    expect(renderedPaths).toEqual(['/sign-in'])
  })

  it('marks a hashed asset immutable for a year', async () => {
    const { server } = webServerOn({ WEB_PORT: '3001' })

    const response = await get(server, '/assets/index-abc123.js')

    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
  })

  it('caches an unhashed art image for a day', async () => {
    const { server } = webServerOn({ WEB_PORT: '3001' })

    const response = await get(server, '/art/barracks-1.png')

    expect(response.headers.get('cache-control')).toBe('public, max-age=86400')
  })

  it('leaves a missing asset uncached', async () => {
    const { server } = webServerOn({ WEB_PORT: '3001' })

    const response = await get(server, '/assets/index-gone.js')

    expect(response.status).toBe(404)
    expect(response.headers.get('cache-control')).toBeNull()
  })

  it('leaves the server render uncached', async () => {
    const { server } = webServerOn({ WEB_PORT: '3001' })

    const response = await get(server, '/sign-in')

    expect(response.headers.get('cache-control')).toBeNull()
  })

  it('serves a static file uncompressed when the browser accepts brotli or gzip', async () => {
    const { server } = webServerOn({ WEB_PORT: '3001' })

    const response = await get(server, '/assets/index-abc123.js', {
      'accept-encoding': 'br, gzip',
    })

    expect(response.headers.get('content-encoding')).toBeNull()
    expect(response.headers.get('content-length')).toBe(String(hashedScript.length))
    expect(await response.text()).toBe(hashedScript)
  })
})
