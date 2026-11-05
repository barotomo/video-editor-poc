import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function syncSpecPlugin(): Plugin {
  return {
    name: 'sync-spec-plugin',
    configureServer(server) {
      server.middlewares.use('/api/sync-spec', (req, res, next) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const { projectId, spec } = JSON.parse(body)
              if (!spec) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'spec is required' }))
                return
              }

              // プロジェクトIDの判定
              let targetProject = projectId || ''
              if (!targetProject) {
                const specStr = JSON.stringify(spec)
                if (specStr.includes('/0002/') || spec.title === '0002') {
                  targetProject = '0002'
                } else if (specStr.includes('sakuragi')) {
                  targetProject = '0001'
                } else {
                  targetProject = '0002'
                }
              }

              // 1. public/manga/{targetProject}/spec.json を保存
              const publicDir = path.resolve(__dirname, 'public', 'manga', targetProject)
              if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true })
              }
              const specJsonPath = path.join(publicDir, 'spec.json')
              fs.writeFileSync(specJsonPath, JSON.stringify(spec, null, 2), 'utf-8')

              // 2. TypeScript ソースファイルへ書き込み
              let savedTsPath = ''
              if (targetProject === '0002' || targetProject.includes('0002')) {
                savedTsPath = path.resolve(__dirname, 'src', 'types', 'yofukashiEditorialSpec.ts')
                const tsContent = `import type { VideoSpec } from './videoSpec';\n\n/**\n * プロジェクト0002「よふかしのうた」風 漫画紹介ショート動画\n * ワークスペース同期済みスペック\n */\nexport const yofukashiMangaEditorialSpec: VideoSpec = ${JSON.stringify(spec, null, 2)};\n`
                fs.writeFileSync(savedTsPath, tsContent, 'utf-8')
              } else if (targetProject === '0001' || targetProject.includes('sakuragi')) {
                const genDir = path.resolve(__dirname, 'src', 'types', 'generated')
                if (!fs.existsSync(genDir)) fs.mkdirSync(genDir, { recursive: true })
                savedTsPath = path.join(genDir, '0001_sakuragi.ts')
                const tsContent = `import type { VideoSpec } from '../videoSpec';\n\nexport const sakuragiMangaEditorialSpec: VideoSpec = ${JSON.stringify(spec, null, 2)};\n`
                fs.writeFileSync(savedTsPath, tsContent, 'utf-8')
              } else {
                const genDir = path.resolve(__dirname, 'src', 'types', 'generated')
                if (!fs.existsSync(genDir)) fs.mkdirSync(genDir, { recursive: true })
                savedTsPath = path.join(genDir, `${targetProject}.ts`)
                const tsContent = `import type { VideoSpec } from '../videoSpec';\n\nexport const spec_${targetProject}: VideoSpec = ${JSON.stringify(spec, null, 2)};\n`
                fs.writeFileSync(savedTsPath, tsContent, 'utf-8')
              }

              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  success: true,
                  targetProject,
                  savedTsPath,
                  specJsonPath,
                  message: `プロジェクト（${targetProject}）に正常に同期保存しました！`
                })
              )
            } catch (err: any) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message }))
            }
          })
        } else {
          next()
        }
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), syncSpecPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/thumbnails': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/outputs': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})