<script lang="ts">
  import { getDocs, collection, type Timestamp } from 'firebase/firestore'
  import { onMount } from 'svelte'
  import { format } from 'date-fns'
  import { db } from '$lib/client/firebase'

  type AnnouncementData = {
    title: string
    content: string
    timestamp: Timestamp
  }

  let announcements: Array<AnnouncementData> = []

  onMount(() => {
    getDocs(collection(db, 'announcements')).then((snapshot) => {
      announcements = snapshot.docs.map((doc) => doc.data() as AnnouncementData)
    })
  })
</script>

<svelte:head>
  <title>Announcements</title>
</svelte:head>

<div class="rounded-lg bg-white p-4 shadow">
  <h2 class="mb-4 text-xl font-semibold">Announcements</h2>
  {#each announcements as announcement}
    <div class="mb-4">
      <h3 class="text-lg font-semibold">{announcement.title}</h3>
      <p>{announcement.content}</p>
      <p class="mt-2 text-gray-500">
        {format(new Date(announcement.timestamp.seconds * 1000), 'yyyy.MM.dd')}
      </p>
    </div>
  {/each}
</div>
