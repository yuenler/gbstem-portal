<script lang="ts">
  import { db, user } from '$lib/client/firebase'
  import Card from '$lib/components/Card.svelte'
  import Link from '$lib/components/Link.svelte'
  import Loading from '$lib/components/Loading.svelte'
  import PageLayout from '$lib/components/PageLayout.svelte'
  import ConfirmationForm from '$lib/components/forms/ConfirmationForm.svelte'
  import { getDoc, doc } from 'firebase/firestore'
  import { fade } from 'svelte/transition'

  type ApplicationStatus = Data.Decision | 'submitted' | null
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
          getDoc(doc(db, 'applications', user.object.uid)).then((snapshot) => {
            if (snapshot.exists()) {
              const applicationData =
                snapshot.data() as Data.Application<'client'>
              if (applicationData.meta.submitted) {
                data.application.status = 'submitted'
                getDoc(doc(db, 'decisions', user.object.uid)).then(
                  (snapshot) => {
                    if (snapshot.exists()) {
                      data.application.status = snapshot.data()
                        .type as Data.Decision
                    }
                    resolve()
                  },
                )
              } else {
                resolve()
              }
            } else {
              resolve()
            }
          })
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
        <Card class="space-y-4">
          <h2 class="text-xl font-bold">Application Status</h2>
          {#if data.application.status === null}
            <div class="space-y-1">
              <p>
                Early applications are due on <span class="font-bold">
                  September 4th, 2023
                </span>
                at 11:59 PM ET. Regular applications are due on
                <span class="font-bold">September 25th, 2023</span> at 11:59 PM ET.
              </p>
            </div>
          {/if}
          <div class="space-y-4">
            <p>
              {#if data.application.status === 'accepted'}
                You have been accepted to HackHarvard 2023! We look forward to
                seeing you.
              {:else if data.application.status === 'waitlisted'}
                You have been waitlisted. We will follow up with more
                information!
              {:else if data.application.status === 'rejected'}
                Unfortunately, we have decided not to accept you for this year's
                hackathon.
              {:else if data.application.status === 'submitted'}
                Your application is submitted and in review!
              {:else}
                Your application is in progress. Make sure to submit by the
                deadline!
              {/if}
            </p>
            <Link href="/apply">View application</Link>
          </div>
        </Card>
        {#if data.application.status === 'accepted'}
          <Card class="space-y-4">
            <ConfirmationForm />
          </Card>
        {/if}
      </div>
    {/if}
  </div>
</PageLayout>
