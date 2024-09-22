<script lang="ts">
  import { db } from '$lib/client/firebase'
  import { doc, getDoc } from 'firebase/firestore'
  import StudentSelect from './StudentSelect.svelte'
  import Input from './Input.svelte'
  import Card from './Card.svelte'
  import Button from './Button.svelte'
  import { formatDate, formatDateString, timestampToDate } from '$lib/utils'
  import { classesCollection, registrationsCollection } from '$lib/data/constants'
  import { getContext, onMount } from 'svelte'
  import { selectedStudentId } from '$lib/stores'

  type ClassDate = {course: string, meetingTime: Date, link: string}
  let classes: ClassDate[] = []
  let nextClass: ClassDate = null 
  let listView: boolean = true
  let courses = new Set()
  let selectedStudentUid = ''
  let selectedStudentName = ''

  const subscribe = selectedStudentId.subscribe((value) => {
		selectedStudentUid = value;
	});

  async function fetchClassSchedules(classIds: string[]) {
    const schedulesPromises = classIds.map((classId) =>
      getDoc(doc(db, classesCollection, classId)),
    )
    let fetchedClasses: ClassDate[] = []
    const schedulesDocs = await Promise.all(schedulesPromises)
    schedulesDocs
      .map(async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = await docSnapshot.data() as Data.Class
          courses.add(data.course)
          data.meetingTimes.map((date) => {
            fetchedClasses.push({
              course: data.course,
              meetingTime: new Date(date.seconds * 1000),
              link: data.meetingLink,
            })
          })
        }
      })
      .flat() 
        return fetchedClasses
      }

  $: if (selectedStudentUid) {
    getDoc(doc(db, registrationsCollection, selectedStudentUid)).then(
      async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() 
          const classIds = data.classes || []
          selectedStudentName = data.personal.studentFirstName
          classes = await fetchClassSchedules(classIds)
          nextClass = classes.filter(classDate => new Date(classDate.meetingTime) > new Date()).sort((a, b) => new Date(a.meetingTime) - new Date(b.meetingTime))[0]
          console.log(nextClass.meetingTime)
          console.log(formatDate(timestampToDate(new Date(nextClass.meetingTime))))
        }
      },
    )
  }
</script>

<div class="p-0">
  <!-- <div class="mb-5">
    <StudentSelect bind:selectedStudentUid />
  </div> -->
  {#if selectedStudentUid}
    {#if classes.length === 0}
      <p>This student is not enrolled in any classes.</p>
    {:else}
    <Card>
      <div class="font-bold mb-2">Next Upcoming Class For {selectedStudentName}:</div>
        <div>
          {nextClass === undefined ? 'No Upcoming Classes' :  nextClass.course + ' ' + formatDate(timestampToDate(new Date(nextClass.meetingTime)))}
        </div>
        <Button color="blue" class="mb-2 mt-4" on:click={() => {window.open(nextClass?.link)}}
          >Join Class</Button>
      </Card>

      <div class="font-bold mb-2 mt-4">{selectedStudentName}'s Class Schedule</div>

      <Input type="checkbox" bind:value={listView} label={'Show As List?'} />

      {#if listView}
        <ul class="list-none space-y-2">
          {#each classes as classSession}
            <li
              class="flex items-center justify-between rounded-lg bg-gray-100 p-4"
            >
              <p class="class-name">{classSession.course}</p>
              <p class="meeting-time">{formatDate(classSession.meetingTime)}</p>
            </li>
          {/each}
        </ul>
      {:else}
        <table
          class={`grid grid-cols-${courses.size} justify-between gap-1`}
          style="margin-top:1rem;"
        >
          {#each courses as course}
            <div class="rounded-lg bg-gray-100 p-4">
              <div class="flex items-center justify-between p-4">
                <strong>{course}</strong>
              </div>
              {#each classes as classSession}
                {#if classSession.course === course}
                  <div
                    style="border-width:1px 0 0 0; border-color:gray; padding:1rem;"
                  >
                    <p class="meeting-time">
                      {formatDate(classSession.meetingTime)}
                    </p>
                  </div>
                {/if}
              {/each}
            </div>
          {/each}
        </table>
      {/if}
    {/if}
  {:else}
    <p>Please select a student to view their class schedule.</p>
  {/if}
</div>

<style>
  /* Add your styles for the schedule items here */
</style>
