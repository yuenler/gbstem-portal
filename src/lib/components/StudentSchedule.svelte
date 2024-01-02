<script lang="ts">
  import { onMount } from 'svelte'
  import { db, user } from '$lib/client/firebase'
  import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
  import Loading from '$lib/components/Loading.svelte'
  import Select from '$lib/components/Select.svelte'

  let loading = true
  let classSchedules: { [k: string]: string }[] = []
  let studentsOptions: { name: string }[] = []
  let selectedStudent = ''

  onMount(() => {
    return user.subscribe(async (userData) => {
      if (userData) {
        await fetchData(userData)
        loading = false
      }
    })
  })

  const nameToUid: Record<string, string> = {}
  let ready = false

  const fetchData = async (user: Data.User.Store) => {
    const uid = user.object.uid
    for (let i = 1; i < 6; ++i) {
      const docRef = await getDoc(
        doc(db, 'registrationsSpring24', `${uid}-${i}`),
      )
      if (docRef.exists() && docRef.data()?.meta.submitted) {
        const name =
          `${docRef.data().personal.studentFirstName} ${
            docRef.data().personal.studentLastName
          }`.trim() || `Child ${i}`
        studentsOptions.push({
          name,
        })
        nameToUid[name] = `${uid}-${i}`
      } else {
        break
      }
    }
    ready = true
  }

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

  $: if (selectedStudent) {
    const selectedStudentRegistration = studentsOptions.find(
      (option) => option.name === selectedStudent,
    )
    if (selectedStudentRegistration) {
      const studentUID = nameToUid[selectedStudentRegistration.name]
      getDoc(doc(db, 'registrationsSpring24', studentUID)).then(
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const classIds = docSnapshot.data().classes || []
            fetchClassSchedules(classIds)
          }
        },
      )
    }
  }
</script>

<div class="p-4">
  {#if loading}
    <Loading />
  {:else}
    <Select
      bind:value={selectedStudent}
      options={studentsOptions}
      label="Select a child"
      floating
      class="mb-5"
    />
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
  {/if}
</div>

<style>
  /* Add your styles for the schedule items here */
</style>
