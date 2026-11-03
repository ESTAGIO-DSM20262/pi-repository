export type TechnologyKind = 'language' | 'tool'

export interface TechnologyEntry {
  name: string
  kind: TechnologyKind
  group: string
  aliases?: string[]
}

export const TECHNOLOGY_CATALOG: TechnologyEntry[] = [
  { name: 'JavaScript', kind: 'language', group: 'Linguagens', aliases: ['js', 'ecmascript'] },
  { name: 'TypeScript', kind: 'language', group: 'Linguagens', aliases: ['ts'] },
  { name: 'Python', kind: 'language', group: 'Linguagens', aliases: ['py', 'python3'] },
  { name: 'Java', kind: 'language', group: 'Linguagens' },
  { name: 'Kotlin', kind: 'language', group: 'Linguagens', aliases: ['kt'] },
  { name: 'C#', kind: 'language', group: 'Linguagens', aliases: ['csharp', 'c sharp'] },
  { name: 'C', kind: 'language', group: 'Linguagens' },
  { name: 'C++', kind: 'language', group: 'Linguagens', aliases: ['cpp', 'cplusplus'] },
  { name: 'PHP', kind: 'language', group: 'Linguagens' },
  { name: 'Go', kind: 'language', group: 'Linguagens', aliases: ['golang'] },
  { name: 'Rust', kind: 'language', group: 'Linguagens' },
  { name: 'Swift', kind: 'language', group: 'Linguagens' },
  { name: 'Dart', kind: 'language', group: 'Linguagens' },
  { name: 'Ruby', kind: 'language', group: 'Linguagens', aliases: ['rb'] },
  { name: 'Scala', kind: 'language', group: 'Linguagens' },
  { name: 'R', kind: 'language', group: 'Linguagens', aliases: ['linguagem r'] },
  { name: 'Lua', kind: 'language', group: 'Linguagens' },
  { name: 'SQL', kind: 'language', group: 'Linguagens' },
  { name: 'PL/SQL', kind: 'language', group: 'Linguagens', aliases: ['plsql'] },
  { name: 'HTML', kind: 'language', group: 'Linguagens', aliases: ['html5'] },
  { name: 'CSS', kind: 'language', group: 'Linguagens', aliases: ['css3'] },
  { name: 'Shell Script', kind: 'language', group: 'Linguagens', aliases: ['bash', 'shell', 'sh'] },

  { name: 'React', kind: 'tool', group: 'Front-end', aliases: ['reactjs', 'react js'] },
  { name: 'Next.js', kind: 'tool', group: 'Front-end', aliases: ['next', 'nextjs'] },
  { name: 'Vue.js', kind: 'tool', group: 'Front-end', aliases: ['vue', 'vuejs'] },
  { name: 'Nuxt', kind: 'tool', group: 'Front-end', aliases: ['nuxtjs', 'nuxt.js'] },
  { name: 'Angular', kind: 'tool', group: 'Front-end', aliases: ['angularjs'] },
  { name: 'Svelte', kind: 'tool', group: 'Front-end', aliases: ['sveltekit'] },
  { name: 'Vite', kind: 'tool', group: 'Front-end' },
  { name: 'Tailwind CSS', kind: 'tool', group: 'Front-end', aliases: ['tailwind', 'tailwindcss'] },
  { name: 'Bootstrap', kind: 'tool', group: 'Front-end' },
  { name: 'Sass', kind: 'tool', group: 'Front-end', aliases: ['scss'] },
  { name: 'Material UI', kind: 'tool', group: 'Front-end', aliases: ['mui', 'material-ui'] },
  { name: 'React Native', kind: 'tool', group: 'Mobile', aliases: ['reactnative', 'rn'] },
  { name: 'Expo', kind: 'tool', group: 'Mobile', aliases: ['expo go'] },
  { name: 'Flutter', kind: 'tool', group: 'Mobile' },
  { name: 'Android Studio', kind: 'tool', group: 'Mobile', aliases: ['androidstudio'] },
  { name: 'Jetpack Compose', kind: 'tool', group: 'Mobile', aliases: ['compose'] },

  { name: 'Node.js', kind: 'tool', group: 'Back-end', aliases: ['node', 'nodejs', 'node js'] },
  { name: 'Express', kind: 'tool', group: 'Back-end', aliases: ['expressjs', 'express.js'] },
  { name: 'NestJS', kind: 'tool', group: 'Back-end', aliases: ['nest', 'nest.js', 'nestjs'] },
  { name: 'Spring Boot', kind: 'tool', group: 'Back-end', aliases: ['springboot', 'spring'] },
  { name: 'Django', kind: 'tool', group: 'Back-end' },
  { name: 'Flask', kind: 'tool', group: 'Back-end' },
  { name: 'FastAPI', kind: 'tool', group: 'Back-end', aliases: ['fast api'] },
  { name: 'Laravel', kind: 'tool', group: 'Back-end' },
  { name: '.NET', kind: 'tool', group: 'Back-end', aliases: ['dotnet', 'net core', 'dotnet core'] },
  { name: 'ASP.NET Core', kind: 'tool', group: 'Back-end', aliases: ['aspnet', 'asp.net'] },
  { name: 'REST API', kind: 'tool', group: 'Back-end', aliases: ['rest', 'restful', 'api rest'] },
  { name: 'GraphQL', kind: 'tool', group: 'Back-end' },
  { name: 'Swagger', kind: 'tool', group: 'Back-end', aliases: ['openapi'] },

  { name: 'PostgreSQL', kind: 'tool', group: 'Banco de dados', aliases: ['postgres', 'psql'] },
  { name: 'MySQL', kind: 'tool', group: 'Banco de dados' },
  { name: 'MariaDB', kind: 'tool', group: 'Banco de dados' },
  { name: 'SQLite', kind: 'tool', group: 'Banco de dados' },
  { name: 'MongoDB', kind: 'tool', group: 'Banco de dados', aliases: ['mongo'] },
  { name: 'Redis', kind: 'tool', group: 'Banco de dados' },
  { name: 'Firebase', kind: 'tool', group: 'Banco de dados' },
  { name: 'Supabase', kind: 'tool', group: 'Banco de dados' },
  { name: 'Neon', kind: 'tool', group: 'Banco de dados', aliases: ['neon db', 'neondb'] },
  { name: 'Drizzle ORM', kind: 'tool', group: 'Banco de dados', aliases: ['drizzle'] },
  { name: 'Prisma', kind: 'tool', group: 'Banco de dados', aliases: ['prisma orm'] },
  { name: 'TypeORM', kind: 'tool', group: 'Banco de dados' },
  { name: 'Hibernate', kind: 'tool', group: 'Banco de dados', aliases: ['jpa'] },

  { name: 'Docker', kind: 'tool', group: 'DevOps e nuvem', aliases: ['docker compose'] },
  { name: 'Kubernetes', kind: 'tool', group: 'DevOps e nuvem', aliases: ['k8s'] },
  { name: 'AWS', kind: 'tool', group: 'DevOps e nuvem', aliases: ['amazon web services'] },
  { name: 'Azure', kind: 'tool', group: 'DevOps e nuvem', aliases: ['microsoft azure'] },
  { name: 'Google Cloud', kind: 'tool', group: 'DevOps e nuvem', aliases: ['gcp'] },
  { name: 'Vercel', kind: 'tool', group: 'DevOps e nuvem' },
  { name: 'Netlify', kind: 'tool', group: 'DevOps e nuvem' },
  { name: 'Render', kind: 'tool', group: 'DevOps e nuvem' },
  { name: 'Heroku', kind: 'tool', group: 'DevOps e nuvem' },
  { name: 'Nginx', kind: 'tool', group: 'DevOps e nuvem' },
  { name: 'Linux', kind: 'tool', group: 'DevOps e nuvem' },
  { name: 'GitHub Actions', kind: 'tool', group: 'DevOps e nuvem', aliases: ['actions'] },

  { name: 'Git', kind: 'tool', group: 'Colaboração e gestão' },
  { name: 'GitHub', kind: 'tool', group: 'Colaboração e gestão' },
  { name: 'GitLab', kind: 'tool', group: 'Colaboração e gestão' },
  { name: 'Figma', kind: 'tool', group: 'Colaboração e gestão' },
  { name: 'Jira', kind: 'tool', group: 'Colaboração e gestão' },
  { name: 'Trello', kind: 'tool', group: 'Colaboração e gestão' },
  { name: 'Notion', kind: 'tool', group: 'Colaboração e gestão' },
  { name: 'Postman', kind: 'tool', group: 'Colaboração e gestão' },
  {
    name: 'VS Code',
    kind: 'tool',
    group: 'Colaboração e gestão',
    aliases: ['vscode', 'visual studio code'],
  },
  { name: 'IntelliJ IDEA', kind: 'tool', group: 'Colaboração e gestão', aliases: ['intellij'] },

  { name: 'Vitest', kind: 'tool', group: 'Testes', aliases: ['vi test'] },
  { name: 'Jest', kind: 'tool', group: 'Testes' },
  { name: 'Cypress', kind: 'tool', group: 'Testes' },
  { name: 'Playwright', kind: 'tool', group: 'Testes' },
  { name: 'Selenium', kind: 'tool', group: 'Testes' },
  { name: 'JUnit', kind: 'tool', group: 'Testes', aliases: ['junit5'] },
  { name: 'Mockito', kind: 'tool', group: 'Testes' },
  {
    name: 'Testing Library',
    kind: 'tool',
    group: 'Testes',
    aliases: ['react testing library', 'rtl'],
  },

  { name: 'Pandas', kind: 'tool', group: 'Dados e IA' },
  { name: 'NumPy', kind: 'tool', group: 'Dados e IA' },
  { name: 'TensorFlow', kind: 'tool', group: 'Dados e IA' },
  { name: 'scikit-learn', kind: 'tool', group: 'Dados e IA', aliases: ['sklearn', 'scikit learn'] },
  { name: 'Power BI', kind: 'tool', group: 'Dados e IA', aliases: ['powerbi'] },
  { name: 'Tableau', kind: 'tool', group: 'Dados e IA' },
  { name: 'Jupyter', kind: 'tool', group: 'Dados e IA', aliases: ['jupyter notebook'] },
  { name: 'Unity', kind: 'tool', group: 'Jogos e IoT', aliases: ['unity3d'] },
  { name: 'Arduino', kind: 'tool', group: 'Jogos e IoT' },
  {
    name: 'Raspberry Pi',
    kind: 'tool',
    group: 'Jogos e IoT',
    aliases: ['raspberry', 'raspberrypi'],
  },
]

export const MAX_TECHNOLOGY_NAME_LENGTH = 60

export function technologyKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9+#/]/g, '')
}

const CATALOG_BY_KEY = (() => {
  const map = new Map<string, TechnologyEntry>()
  for (const entry of TECHNOLOGY_CATALOG) {
    map.set(technologyKey(entry.name), entry)
  }
  for (const entry of TECHNOLOGY_CATALOG) {
    for (const alias of entry.aliases ?? []) {
      const key = technologyKey(alias)
      if (!map.has(key)) map.set(key, entry)
    }
  }
  return map
})()

export function findCatalogTechnology(value: string): TechnologyEntry | null {
  const key = technologyKey(value)
  return key ? (CATALOG_BY_KEY.get(key) ?? null) : null
}

export function canonicalTechnologyName(value: string) {
  const cleaned = value.replace(/\s+/g, ' ').trim().slice(0, MAX_TECHNOLOGY_NAME_LENGTH)
  if (!cleaned) return ''
  return findCatalogTechnology(cleaned)?.name ?? cleaned
}

export function normalizeTechnologyList(values: string[], limit: number) {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const name = canonicalTechnologyName(value)
    const key = technologyKey(name) || name.toLowerCase()
    if (!name || seen.has(key)) continue
    seen.add(key)
    result.push(name)
    if (result.length >= limit) break
  }
  return result
}

export function suggestTechnologies(
  query: string,
  kind: TechnologyKind,
  selected: string[],
  limit = 8,
): TechnologyEntry[] {
  const selectedKeys = new Set(selected.map((item) => technologyKey(item)))
  const key = technologyKey(query)
  const entries = TECHNOLOGY_CATALOG.filter(
    (entry) => entry.kind === kind && !selectedKeys.has(technologyKey(entry.name)),
  )
  if (!key) return entries.slice(0, limit)

  const exact: TechnologyEntry[] = []
  const starts: TechnologyEntry[] = []
  const contains: TechnologyEntry[] = []
  for (const entry of entries) {
    const keys = [entry.name, ...(entry.aliases ?? [])].map((item) => technologyKey(item))
    if (keys.includes(key)) exact.push(entry)
    else if (keys.some((item) => item.startsWith(key))) starts.push(entry)
    else if (keys.some((item) => item.includes(key))) contains.push(entry)
  }
  return [...exact, ...starts, ...contains].slice(0, limit)
}

export function popularTechnologies(kind: TechnologyKind, selected: string[], limit = 10) {
  return suggestTechnologies('', kind, selected, limit)
}
