<script lang="ts">
  import { db, user } from '$lib/client/firebase'
  import Card from '$lib/components/Card.svelte'
  import { getDoc, doc } from 'firebase/firestore'
  import { fade } from 'svelte/transition'

  const asyncData = new Promise(async (resolve) => {
    let data = {
      application: '',
      group: {},
    }
    if ($user) {
      getDoc(doc(db, 'applications', $user.object.uid)).then((res) => {
        if (res.exists()) {
          const application = res.data()

          if (application.status.accepted) {
            data.application =
              'You have been accepted to HackHarvard 2023! We look forward to seeing you.'
          } else {
            data.application = application.meta.submitted
              ? 'Submitted and in review!'
              : 'In progress.'
          }
        } else {
          data.application = 'Not started.'
        }
        resolve(data)
      })
    }
  })
</script>

<div
  class="mx-auto my-4 max-w-2xl border-2 border-blue-800 bg-blue-100 p-4 text-lg text-blue-900"
>
  <p>
    Early applications are due on <b>September 4th, 2023</b> at 11:59 PM ET.
  </p>
  <p>
    Regular applications are due on <b>September 25th, 2023</b> at 11:59 PM ET.
  </p>
</div>

{#await asyncData then data}
  <div class="grid grid-cols-2" transition:fade|local={{ duration: 150 }}>
    <Card>
      <svelte:fragment slot="title">Application</svelte:fragment>
      <div class="text-xl">{data.application}</div>
    </Card>
  </div>
{:catch}
  <div>Error loading data. Please try again.</div>
{/await}
