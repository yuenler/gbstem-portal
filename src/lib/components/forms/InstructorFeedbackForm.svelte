<script lang="ts">
  import { db, user } from '$lib/client/firebase'
  import { alert } from '$lib/stores'
  import Form from '$lib/components/Form.svelte'
  import Button from '../Button.svelte'
  import Input from '$lib/components/Input.svelte'
  import { cn } from '$lib/utils'
  import { doc, setDoc, query, collection, getDocs } from 'firebase/firestore'
  import { onMount } from 'svelte'
  import Link from '$lib/components/Link.svelte'
  import { coursesJson } from '$lib/data'
  import Card from '../Card.svelte'

  let disabled = false
  let showValidation = false
  let currentUser: Data.User.Store
  let loading = true
  let classDate = ''
  let classSession = 1
  let course = ''
  let classFeedback: {
    date: string
    feedback: string
  } = {
    date: '',
    feedback: '',
  }

  let values: {
    [key: string]: {
      course: string
      studentName: string
      date: string
      attendance: boolean
    }
  } = {}

  let classList: string[] = []

  onMount(() => {
    return user.subscribe(async (user) => {
      if (user) {
        currentUser = user
        classList = await getData()
        loading = false
      }
    })
  })

  async function getData() {
    const q = query(collection(db, 'classesSpring24'))
    const querySnapshot = await getDocs(q)
    console.log(querySnapshot)
    querySnapshot.forEach((doc) => {
      console.log(doc.data())
      console.log(currentUser.object.uid)
      if (doc.id === currentUser.object.uid) {
        classList = doc.data()['students']
        course = doc.data()['course']
        console.log(classList)
        classList.forEach((student: string) => {
          values[student] = {
            course: course,
            studentName: student,
            date: new Date().toISOString(),
            attendance: false,
          }
        })
      }
    })
    return classList
  }

  function handleSubmit() {
    if ($user) {
      const frozenUser = $user
      if (classDate === '' || classSession === 0) {
        alert.trigger('error', 'Please enter class date and session.')
      } else {
        disabled = true
        classList.forEach((studentName) => {
          console.log(studentName)
          console.log(values[studentName])
          classFeedback.date = classDate
          setDoc(
            doc(
              db,
              'instructorFeedback24',
              frozenUser.object.uid,
              studentName,
              String(classSession),
            ),
            values[studentName],
          ).catch((err) => {
            disabled = false
            alert.trigger('error', err.code, true)
          })
        })
        setDoc(
          doc(
            db,
            'instructorFeedback24',
            frozenUser.object.uid,
            'classFeedback',
            String(classSession),
          ),
          classFeedback,
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
      <div class="mt-7 sm:col-span-1">
        <Input
          type="number"
          min="1"
          max="20"
          bind:value={classSession}
          label="Class Session #"
          floating
          required
        />
      </div>
    </div>
    <Input
      type="text"
      bind:value={classFeedback.feedback}
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
                bind:value={values[student].attendance}
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
