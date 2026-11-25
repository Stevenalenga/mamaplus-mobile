/**
 * Upload FCM V1 Google Service Account key to EAS (one-shot).
 * Does not print private key material.
 */
const fs = require('fs')
const path = require('path')
const os = require('os')

const PROJECT_FULL_NAME = '@alengasteven/mamaplus-mobile'
const ANDROID_PACKAGE = 'com.mamaplus.mobile'
const KEY_PATH = path.join(__dirname, '..', 'fcm-service-account.json')
const GRAPHQL_URL = 'https://api.expo.dev/graphql'

function loadSession() {
  if (process.env.EXPO_TOKEN) {
    return { type: 'token', value: process.env.EXPO_TOKEN }
  }
  const statePath = path.join(os.homedir(), '.expo', 'state.json')
  if (!fs.existsSync(statePath)) {
    throw new Error('Not logged in to Expo (no ~/.expo/state.json and no EXPO_TOKEN)')
  }
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'))
  const sessionSecret = state?.auth?.sessionSecret
  if (!sessionSecret) {
    throw new Error('Expo session missing — run: npx eas-cli login')
  }
  return { type: 'session', value: sessionSecret }
}

async function gql(auth, query, variables) {
  const headers = {
    'content-type': 'application/json',
    accept: 'application/json',
  }
  if (auth.type === 'token') {
    headers.authorization = `Bearer ${auth.value}`
  } else {
    headers['expo-session'] = auth.value
  }

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (!res.ok || json.errors?.length) {
    const msg = json.errors?.map((e) => e.message).join('; ') || res.statusText
    throw new Error(`Expo GraphQL error: ${msg}`)
  }
  return json.data
}

async function main() {
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error(`Missing ${KEY_PATH}`)
  }
  const jsonKey = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'))
  if (jsonKey.type !== 'service_account' || !jsonKey.private_key) {
    throw new Error('Invalid service account JSON')
  }

  const auth = loadSession()
  console.log('Authenticated with Expo, uploading FCM V1 key…')

  const appData = await gql(
    auth,
    `query($fullName: String!) {
      app {
        byFullName(fullName: $fullName) {
          id
          fullName
          ownerAccount { id name }
        }
      }
    }`,
    { fullName: PROJECT_FULL_NAME }
  )

  const app = appData?.app?.byFullName
  if (!app?.id || !app?.ownerAccount?.id) {
    throw new Error(`App not found: ${PROJECT_FULL_NAME}`)
  }
  console.log(`App: ${app.fullName}`)

  const created = await gql(
    auth,
    `mutation($googleServiceAccountKeyInput: GoogleServiceAccountKeyInput!, $accountId: ID!) {
      googleServiceAccountKey {
        createGoogleServiceAccountKey(
          googleServiceAccountKeyInput: $googleServiceAccountKeyInput
          accountId: $accountId
        ) { id }
      }
    }`,
    {
      accountId: app.ownerAccount.id,
      googleServiceAccountKeyInput: { jsonKey },
    }
  )

  const keyId = created?.googleServiceAccountKey?.createGoogleServiceAccountKey?.id
  if (!keyId) throw new Error('Failed to create Google Service Account Key on EAS')
  console.log(`Uploaded service account key id: ${keyId}`)

  const credsData = await gql(
    auth,
    `query($projectFullName: String!, $applicationIdentifier: String) {
      app {
        byFullName(fullName: $projectFullName) {
          id
          androidAppCredentials(filter: { applicationIdentifier: $applicationIdentifier, legacyOnly: false }) {
            id
          }
        }
      }
    }`,
    { projectFullName: PROJECT_FULL_NAME, applicationIdentifier: ANDROID_PACKAGE }
  )

  let androidCredsId = credsData?.app?.byFullName?.androidAppCredentials?.[0]?.id
  if (!androidCredsId) {
    const createdCreds = await gql(
      auth,
      `mutation($androidAppCredentialsInput: AndroidAppCredentialsInput!, $appId: ID!, $applicationIdentifier: String!) {
        androidAppCredentials {
          createAndroidAppCredentials(
            androidAppCredentialsInput: $androidAppCredentialsInput
            appId: $appId
            applicationIdentifier: $applicationIdentifier
          ) { id }
        }
      }`,
      {
        androidAppCredentialsInput: {},
        appId: app.id,
        applicationIdentifier: ANDROID_PACKAGE,
      }
    )
    androidCredsId = createdCreds?.androidAppCredentials?.createAndroidAppCredentials?.id
  }
  if (!androidCredsId) throw new Error('Could not resolve Android app credentials id')

  await gql(
    auth,
    `mutation($androidAppCredentialsId: ID!, $googleServiceAccountKeyId: ID!) {
      androidAppCredentials {
        setGoogleServiceAccountKeyForFcmV1(
          id: $androidAppCredentialsId
          googleServiceAccountKeyId: $googleServiceAccountKeyId
        ) { id }
      }
    }`,
    {
      androidAppCredentialsId: androidCredsId,
      googleServiceAccountKeyId: keyId,
    }
  )

  console.log('FCM V1 key assigned to Android credentials for', ANDROID_PACKAGE)
  console.log('Done. Verify at: https://expo.dev/accounts/alengasteven/projects/mamaplus-mobile/credentials')
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
