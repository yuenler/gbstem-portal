<script lang="ts">
  import { db, user } from '$lib/client/firebase'
  import Card from '$lib/components/Card.svelte'
  import Link from '$lib/components/Link.svelte'
  import Loading from '$lib/components/Loading.svelte'
  import PageLayout from '$lib/components/PageLayout.svelte'
    import InterviewForm from '$lib/components/forms/InterviewForm.svelte'
  import { getDoc, doc } from 'firebase/firestore'
  import { fade } from 'svelte/transition'

  type ApplicationStatus =
    | 'accepted'
    | 'waitlisted'
    | 'rejected'
    | 'submitted'
    | 'scheduled'
    | null

  type DashboardData = {
    application: {
      status: ApplicationStatus
    }
  }
 
  let loading = true
  let data: DashboardData = {
    application: {
      status: null,
    },
  }

  user.subscribe((user) => {
    if (user) {
      let timer: number
      Promise.all([
        new Promise<void>((resolve) => {
          timer = window.setTimeout(resolve, 400)
        }),
        new Promise<void>((resolve) => {
          if (user.profile.role === 'instructor') {
            getDoc(doc(db, 'applicationsSpring24', user.object.uid)).then(
              (applicationDoc) => {
                const applicationExists = applicationDoc.exists()
                if (applicationExists) {
                  const applicationData =
                    applicationDoc.data() as Data.Application
                  if (applicationData.meta.submitted) {
                    data.application.status = 'submitted'
                  } 
                  if(applicationData.meta.scheduled) {
                    data.application.status = 'scheduled'
                  } else {
                    data.application.status = null
                  }
                }
                resolve()
              },
            )
          } else {
            getDoc(doc(db, 'registrationsSpring24', user.object.uid)).then(
              (applicationDoc) => {
                const applicationExists = applicationDoc.exists()
                if (applicationExists) {
                  const applicationData =
                    applicationDoc.data() as Data.Application
                  if (applicationData.meta.submitted) {
                    data.application.status = 'submitted'
                  } else {
                    data.application.status = null
                  }
                }
                resolve()
              },
            )
          }
        }),
      ]).then(() => {
        loading = false
      })
      return () => window.clearTimeout(timer)
    }
  })
</script>

<svelte:head>
  <title>Dashboard</title>
</svelte:head>

<PageLayout cols={2}>
  <svelte:fragment slot="title">Dashboard</svelte:fragment>
  <div class="relative w-full">
    {#if loading}
      <Loading
        class="absolute left-0 right-0 top-0 h-[calc(100vh-216px-80px)] md:h-[calc(100vh-216px)]"
      />
    {:else}
      <div
        class="space-y-6"
        transition:fade={{
          duration: 500,
        }}
      >
        <Card class="space-y-2">
          <h2 class="text-xl font-bold">Application</h2>
          {#if data.application.status === null}
            <div class="space-y-1">
              <p>
                Applications to be an instructor are due <span
                  class="font-bold"
                >
                  September 15th, 2023
                </span>
                at 11:59 PM ET. Registrations to be a student are due
                <span class="font-bold"> September 20th, 2023 </span> at 11:59 PM
                ET.
              </p>
            </div>
          {/if}
          <div class="space-y-1">
            <p>
              {#if data.application.status === 'accepted'}
                You have been accepted to gbSTEM as an instructor! We look
                forward to seeing you.
              {:else if data.application.status === 'waitlisted'}
                You have been waitlisted. We will follow up with more
                information!
              {:else if data.application.status === 'rejected'}
                Unfortunately, instructor applications were extremely
                competitive, and we were not able to accept you as an instructor
                for gbSTEM.
              {:else if data.application.status === 'submitted' || data.application.status === 'scheduled'}
                Your application is submitted and in review!
              {:else}
                Your application is in progress. Make sure to submit by the
                deadline!
              {/if}
            </p>
            <Link href="/apply">View application</Link>
          </div>
        </Card>
        <div>
          {#if data.application.status === 'submitted'}
            <Card>
              <h2 class="text-xl font-bold">Schedule Your Interview</h2>
              <div class="space-y-1">Thanks for filling out the application! Please sign up for an interview here.</div>
              <Link href="/interview">View Interview Slots</Link>
            </Card>
          {/if}
          {#if data.application.status === 'scheduled'}
          <Card>
            <h2 class="text-xl font-bold">Your Interview Has Been Scheduled</h2>
            <div class="space-y-1">Thanks for signing up! You should receive details soon.</div>
          </Card>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</PageLayout>
