<!-- AnnouncementList.svelte -->
<script>
  import { onSnapshot, getDocs, collection } from 'firebase/firestore'
  import { db } from '$lib/firebase' // Assuming you have a firebase.js file that exports the Firestore instance
  import { onMount, onDestroy } from 'svelte'

  let announcements = []

  // Function to fetch announcements from Firestore
  async function fetchAnnouncements() {
    const snapshot = await getDocs(collection($db, 'announcements'))
    announcements = snapshot.docs.map(doc => doc.data())
  }

  // Fetch announcements on component mount
  onMount(fetchAnnouncements)

  // Stop listening for updates when the component is destroyed
  onDestroy(() => {
    /* Optional: You can remove the listener here if needed. */
  })
</script>

<div class="rounded-lg bg-white p-4 shadow">
  <h2 class="mb-4 text-xl font-semibold">Announcements</h2>
  {#each announcements as announcement}
    <div class="mb-4" key={announcement.id}>
      <h3 class="text-lg font-semibold">{announcement.title}</h3>
      <p>{announcement.content}</p>
      <p class="mt-2 text-gray-500">
        {new Date(announcement.timestamp.seconds * 1000).toLocaleString()}
      </p>
    </div>
  {/each}
</div>
