const fs = require('fs')
const os = require('os')
const path = require('path')

const state = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.expo', 'state.json'), 'utf8'))
const session = state?.auth?.sessionSecret
if (!session) {
  console.error('no session')
  process.exit(1)
}

async function gql(query, variables) {
  const r = await fetch('https://api.expo.dev/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'expo-session': session },
    body: JSON.stringify({ query, variables }),
  })
  const j = await r.json()
  if (j.errors) throw new Error(JSON.stringify(j.errors))
  return j.data
}

;(async () => {
  const data = await gql(
    `query($fullName: String!) {
      app {
        byFullName(fullName: $fullName) {
          id
          androidAppCredentials(filter: { applicationIdentifier: "com.mamaplus.mobile", legacyOnly: false }) {
            id
            googleServiceAccountKeyForFcmV1 {
              id
              clientEmail
              projectIdentifier
            }
          }
        }
      }
    }`,
    { fullName: '@alengasteven/mamaplus-mobile' }
  )
  const cred = data?.app?.byFullName?.androidAppCredentials?.[0]
  console.log(
    JSON.stringify(
      {
        hasAndroidCreds: !!cred,
        hasFcmV1: !!cred?.googleServiceAccountKeyForFcmV1,
        clientEmail: cred?.googleServiceAccountKeyForFcmV1?.clientEmail || null,
        projectIdentifier: cred?.googleServiceAccountKeyForFcmV1?.projectIdentifier || null,
      },
      null,
      2
    )
  )
})().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
