import { readFileSync, writeFileSync } from 'fs'

const map = JSON.parse(readFileSync('scripts/bilibili-videos.json', 'utf8'))
const seedPath = 'backend/src/main/resources/seed/algorithms-content.json'
const seed = JSON.parse(readFileSync(seedPath, 'utf8'))

const knownIds = new Set(seed.map((d) => d.id))
let filled = 0
for (const doc of seed) {
  const videos = map[doc.id]
  if (Array.isArray(videos) && videos.length) {
    doc.videos = videos
    filled += 1
  } else {
    doc.videos = []
  }
}
writeFileSync(seedPath, JSON.stringify(seed, null, 2))

const updates = Object.entries(map)
  .filter(([id, v]) => Array.isArray(v) && knownIds.has(id))
  .map(([id, videos]) =>
    `db.algorithm_content.updateOne({_id:${JSON.stringify(id)}},{$set:{videos:${JSON.stringify(videos)}}});`)
writeFileSync('/tmp/opencode/update-videos.js', updates.join('\n') + '\n')

const unmatched = Object.keys(map).filter((k) => !k.startsWith('_') && !knownIds.has(k))
console.log(`seed docs: ${seed.length} | filled: ${filled} | empty: ${seed.length - filled}`)
console.log('unmatched ids in map:', unmatched.length ? unmatched : 'none')
