import * as core from '@actions/core'
import {context, getOctokit} from '@actions/github'

async function run(): Promise<void> {
  try {
    let dontFailBuild: boolean
    try {
      dontFailBuild = JSON.parse(
        core.getInput('dont-fail-build', {required: false}).toLowerCase()
      )
    } catch {
      dontFailBuild = false
    }

    let environment: string | null = core
      .getInput('environment', {
        required: true
      })
      ?.toLowerCase()
    if (!environment) {
      environment = null
      const message = 'No environment provided'
      if (!dontFailBuild) {
        core.setFailed(message)
      } else {
        core.warning(message)
      }
    } else {
      const client = getOctokit(core.getInput('token', {required: true}))
      const environmentNames: string[] = []
      await client
        .paginate('GET /repos/{owner}/{repo}/environments', {
          owner: context.repo.owner,
          repo: context.repo.repo
        })
        .then(data =>
          (data as any[]).map((e: {name: string}) =>
            environmentNames.push(e.name)
          )
        )
      if (
        !environmentNames.find(
          e => e === environment || e.startsWith(`${environment}-`)
        )
      ) {
        const message = `${environment} is not a valid environment name`
        environment = null

        if (!dontFailBuild) {
          core.setFailed(message)
        } else {
          core.warning(message)
        }
      }
    }

    core.setOutput('environment', environment)
  } catch (error: any) {
    core.setFailed(
      `$An error occurred while verifying the environment: ${error.message}`
    )
  }
}

run()
