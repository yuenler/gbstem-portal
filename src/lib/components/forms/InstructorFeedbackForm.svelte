<script lang="ts">
  import { db, user } from '$lib/client/firebase'
  import { alert } from '$lib/stores'
  import Form from '$lib/components/Form.svelte'
  import Button from '../Button.svelte'
  import Input from '$lib/components/Input.svelte'
  import { cn } from '$lib/utils'
  import {
    doc,
    setDoc,
    query,
    collection,
    getDocs,
    getDoc,
  } from 'firebase/firestore'
  import { onMount } from 'svelte'

  let disabled = false
  let showValidation = false
  let currentUser: Data.User.Store
  let loading = true
  let classDate = ''
  let course = ''
  let values: {
    date: string
    feedback: string
    attendanceList: Record<string, { present: boolean }>
    courseName: string
    instructorName: string
  } = {
    date: '',
    feedback: '',
    attendanceList: {},
    courseName: '',
    instructorName: '',
  }

  let classList: string[] = []

  onMount(() => {
    return user.subscribe(async (user) => {
      if (user) {
        currentUser = user
        getData()
        loading = false
      }
    })
  })

  async function getData() {
    const q = query(collection(db, 'classesSpring24'))
    const querySnapshot = await getDocs(q)
    querySnapshot.forEach((document) => {
      if (document.id === currentUser.object.uid) {
        const uids = document.data()['students']
        const classListPromises = uids.map((uid: string) =>
          getDoc(doc(db, 'registrationsSpring24', uid))
            .then((userDoc) => {
              const userData = userDoc.data()?.personal
              return `${userData['studentFirstName']} ${userData['studentLastName']}`
            })
            .catch((error) => {
              console.error('Error fetching student data:', error)
              return 'Error' // Or handle the error as appropriate
            }),
        )

        Promise.all(classListPromises)
          .then((list) => {
            classList = list
            course = document.data()['course']
            values.courseName = course
            values.instructorName =
              currentUser.profile.firstName + ' ' + currentUser.profile.lastName
            classList.forEach((student: string) => {
              values.attendanceList[student] = {
                present: false,
              }
            })
          })
          .catch((error) => {
            // Handle any errors that occurred during Promise.all
            console.error('Error with class list:', error)
          })
      }
    })
    return classList
  }

  function handleSubmit() {
    if ($user) {
      const frozenUser = $user
      if (classDate === '') {
        alert.trigger('error', 'Please enter class date.')
      } else {
        disabled = true
        values.date = classDate
        setDoc(
          doc(
            db,
            'instructorFeedback24',
            `${frozenUser.object.uid}-${Date.now()}`,
          ),
          values,
        ).catch((error) => {
          console.log(error)
        })
        alert.trigger('success', 'Class Feedback saved!')
      }
    }
  }
</script>

<h2 class="ml-2 mt-2 text-xl font-bold">{course} Weekly Class Feedback Form</h2>
{#if disabled}
  <Button color="blue" class="m-5" on:click={() => (disabled = false)}
    >Edit class feedback</Button
  >
{:else}
  <hr class="mb-3 mt-5" />
  <Form
    class={cn(showValidation && 'show-validation')}
    on:submit={() => {
      handleSubmit()
    }}
  >
    <h2 class="mb-4 mt-6 font-bold">Class Information</h2>
    <div class="grid gap-1 sm:grid-cols-2 sm:gap-2">
      <div class="sm:col-span-1">
        <Input
          type="date"
          bind:value={classDate}
          label="Date of Class"
          required
        />
      </div>
    </div>
    <Input
      type="text"
      bind:value={values.feedback}
      label="Reflect on how the class went. What went well? What could be improved? This will be shared with your course curriculum developer and track directors to help improve the class."
    />
    <hr class="mb-3 mt-5" />

    <h2 class="font-bold">Class Attendance</h2>
    {#each classList as student}
      <fieldset class="space-y-4">
        <div class="grid gap-1">
          <div class="grid gap-1 sm:grid-cols-3 sm:gap-3">
            <div class="sm:col-span-3">
              <Input
                type="checkbox"
                bind:value={values.attendanceList[student].present}
                label={student}
              />
            </div>
          </div>
        </div>
      </fieldset>
    {/each}
    <div class="justify m-3 mt-5 flex">
      <Button color="blue" type="submit">Submit</Button>
    </div>
  </Form>
{/if}
