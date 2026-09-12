// 最小 OpenAI 兼容上游（联调用）：GET /v1/models + POST /v1/chat/completions(SSE)
// 用法：node scripts/mock-openai-relay.mjs [port]
import http from 'node:http'

const port = Number(process.argv[2] || 9099)
const MODEL_IDS = ['echo-primary', 'echo-backup', 'shared-name']

const srv = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  if (url.pathname === '/v1/models') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ object: 'list', data: MODEL_IDS.map((id) => ({ id, object: 'model' })) }))
  }
  if (url.pathname === '/v1/chat/completions' && req.method === 'POST') {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      const payload = JSON.parse(body || '{}')
      if (!MODEL_IDS.includes(payload.model)) {
        // 真实中转站对未知路由名会报 404，联调时能验证错误归类是否到位
        res.writeHead(404, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({
          error: { message: `The model '${payload.model}' does not exist`, type: 'invalid_request_error', code: 'model_not_found' },
        }))
      }
      const text = [
        `mock-reply from ${payload.model}`,
        ` (max_tokens=${payload.max_tokens}`,
        payload.reasoning_effort ? `, effort=${payload.reasoning_effort}` : '',
        payload.temperature !== undefined ? `, temp=${payload.temperature}` : '',
        `)`,
      ].join('')
      if (!payload.stream) {
        // 非流式（后端「测试连接」用的就是这条路径）
        res.writeHead(200, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({
          id: 'mock',
          object: 'chat.completion',
          model: payload.model,
          choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 8, completion_tokens: 12, total_tokens: 20 },
        }))
      }
      res.writeHead(200, { 'Content-Type': 'text/event-stream' })
      for (const t of [text.slice(0, 12), text.slice(12)]) {
        res.write('data: ' + JSON.stringify({ choices: [{ delta: { content: t } }] }) + '\n\n')
      }
      res.write('data: [DONE]\n\n')
      res.end()
    })
    return
  }
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: { message: 'no route ' + url.pathname, type: 'invalid_request_error' } }))
})

srv.listen(port, () => console.log('mock relay on', port))
