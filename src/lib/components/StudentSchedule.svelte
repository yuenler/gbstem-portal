<script lang="ts">
  import { db } from '$lib/client/firebase'
  import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
  import StudentSelect from './StudentSelect.svelte'

  let classSchedules: { [k: string]: string }[] = []
  let selectedStudentUid = ''

  async function fetchClassSchedules(classIds: string[]) {
    const schedulesPromises = classIds.map((classId) =>
      getDoc(doc(db, 'classesSpring24', classId)),
    )
    const schedulesDocs = await Promise.all(schedulesPromises)
    classSchedules = schedulesDocs
      .map((docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data()
          return data.meetingTimes.map((time: any) => ({
            id: docSnapshot.id,
            course: data.course,
            meetingTime: new Date(time.seconds * 1000).toISOString(), // Convert Firestore timestamp to ISO string
          }))
        }
        return []
      })
      .flat()
      .sort((a, b) => new Date(a.meetingTime) - new Date(b.meetingTime)) // Sort by date
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  $: if (selectedStudentUid) {
    getDoc(doc(db, 'registrationsSpring24', selectedStudentUid)).then(
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const classIds = docSnapshot.data().classes || []
          fetchClassSchedules(classIds)
        }
      },
    )
  }
</script>

<div class="p-4">
  <div class="mb-5">
    <StudentSelect bind:selectedStudentUid />
  </div>
  {#if classSchedules.length > 0}
    <ul class="list-none space-y-2">
      {#each classSchedules as schedule}
        <li
          class="flex items-center justify-between rounded-lg bg-gray-100 p-4"
        >
          <p class="class-name">{schedule.course}</p>
          <p class="meeting-time">{formatDate(schedule.meetingTime)}</p>
        </li>
      {/each}
    </ul>
  {:else}
    <p>Please select a student to view their class schedule.</p>
  {/if}
</div>

<style>
  /* Add your styles for the schedule items here */
</style>
