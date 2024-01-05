<script lang="ts">
  import { db, user } from '$lib/client/firebase'
  import { alert } from '$lib/stores'
  import Form from '$lib/components/Form.svelte'
  import Button from '../Button.svelte'
  import Select from '$lib/components/Select.svelte'
  import Input from '$lib/components/Input.svelte'
  import { cn } from '$lib/utils'
  import {
    doc,
    getDoc,
    setDoc,
    query,
    collection,
    getDocs,
  } from 'firebase/firestore'
  import { onMount } from 'svelte'
  import Link from '$lib/components/Link.svelte'
  import { coursesJson } from '$lib/data'
  import Card from '../Card.svelte'

  let disabled = false
  let showValidation = false
  let currentUser: Data.User.Store
  let studentName = ''
  let loading = true
  let classDate = ''
  let classSession = 1
  let course = ''

  let values: {
    [key: string]: {
      course: string
      classId: string
      studentName: string
      classNumber: number
      date: string
      attendance: boolean
      feedback: string
    }
  } = {}

  let retrievedStudent: {
    course: string
    classId: string
    studentName: string
    classNumber: number
    date: string
    attendance: boolean
    feedback: string
  }

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
            classId: '',
            studentName: student,
            classNumber: 1,
            date: new Date().toISOString(),
            attendance: false,
            feedback: '',
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
        setDoc(
          doc(
            db,
            'instructorFeedback24',
            frozenUser.object.uid,
            studentName,
            String(values[studentName].classNumber),
          ),
          values[studentName],
        )
          .then(() => {
            disabled = false
            alert.trigger('success', 'Class Feedback saved!')
          })
          .catch((err) => {
            disabled = false
            alert.trigger('error', err.code, true)
          })
      }
    }
  }
</script>

<h2 class="ml-2 mt-2 text-xl font-bold">{course} Weekly Class Feedback Form</h2>
{#if disabled}
  <Button color="blue" class="mb-5" on:click={() => (disabled = false)}
    >Edit class feedback</Button
  >
{:else}
  <hr class="mb-3 mt-5" />
  <h2 class="mb-4 mt-6 font-bold">Class Information</h2>
  <Input type="date" bind:value={classDate} label="Date of Class" required />
  <Input
    type="number"
    bind:value={classSession}
    label="Class session #"
    floating
    required
  />
  {#each classList as student}
    <hr class="mb-4 mt-6" />
    <Form
      class={cn(showValidation && 'show-validation')}
      on:submit={() => {
        studentName = student
        handleSubmit()
      }}
    >
      <fieldset class="space-y-4" {disabled}>
        <h2 class="font-bold">Feedback For {student}</h2>
        <div class="grid gap-1">
          <div class="grid gap-1 sm:grid-cols-3 sm:gap-3">
            <div class="sm:col-span-1"></div>
            <div class="sm:col-span-3">
              <Input
                type="checkbox"
                bind:value={values[student].attendance}
                label="Present At Today's Class"
                required
              />
            </div>
          </div>
          <Input
            type="text"
            bind:value={values[student].feedback}
            label="Please provide any written feedback here."
            floating
            required
          />
        </div>
        <div class="justify flex">
          <Button color="blue" type="submit">Submit</Button>
        </div>
      </fieldset>
    </Form>
  {/each}
{/if}
