<script lang="ts">
  import { db, user } from '$lib/client/firebase'
  import { alert } from '$lib/stores'
  import Form from '$lib/components/Form.svelte'
  import Button from '../Button.svelte'
  import Select from '$lib/components/Select.svelte'
  import Input from '$lib/components/Input.svelte'
  import { cn } from '$lib/utils'
  import { doc, getDoc, setDoc } from 'firebase/firestore'
  import { onMount } from 'svelte'
  import Link from '$lib/components/Link.svelte'
  import { coursesJson } from '$lib/data'
  import Card from '../Card.svelte'

  let disabled = false
  let showValidation = false
  let pastClassNumber = 0
  let className = ''

  let values: {
    instructor: string
    classNumber: number
    studentName: string
    date: string
    course: string
    rating: number
    feedback: string
  } = {
    instructor: '',
    classNumber: 1,
    studentName: '',
    date: new Date().toISOString(),
    course: '',
    rating: 0,
    feedback: '',
  }

  function retrievePastClassFeedback(classNumber: number, className: string) {
    return user.subscribe((user) => {
      if (user) {
        getDoc(
          doc(db, 'classFeedback24', user.object.uid, className, String(classNumber)),
        ).then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data()
            values = data as {
              instructor: string
              classNumber: number
              studentName: string
              date: string
              course: string
              rating: number
              feedback: string
            }
            disabled = false
          } else {
            alert.trigger('error', 'Feedback not found.');
          }
        })
      }
    })
  }

  function handleSubmit(e: CustomEvent<SubmitData>) {
    if (e.detail.error === null) {
      showValidation = false
      disabled = true
      if ($user) {
        const frozenUser = $user
        setDoc(
          doc(
            db,
            'classFeedback24',
            frozenUser.object.uid, values.course, String(values.classNumber),
          ),
          values,
        )
          .then(() => {
            alert.trigger('success', 'Class Feedback saved!')
          })
          .catch((err) => {
            disabled = false
            alert.trigger('error', err.code, true)
          })
      }
    } else {
      showValidation = true
      alert.trigger('error', e.detail.error)
    }
  }
</script>

<h2 class="ml-2 text-xl font-bold">Weekly Class Feedback Form</h2>
<Card class="ml-2">
  <Form
    class={cn(showValidation && 'show-validation')}
    on:submit={retrievePastClassFeedback(pastClassNumber, className)}
  >
    <h2 class = "font-bold">Retrieve and Edit Feedback from Previous Class</h2>
    <Select
      bind:value={className}
      label="Course Name"
      options={coursesJson}
      floating
    />
    <Input
      type="number"
      min="1"
      max="14"
      bind:value={pastClassNumber}
      label="Class Number"
      floating
     class="mt-4"/>
    <Button color="blue" type="submit" class="mt-4">Retrieve</Button>
  </Form>
  <hr class="mt-6 mb-6"/>
  <Form
    class={cn(showValidation && 'show-validation')}
    on:submit={handleSubmit}
  >
    {#if disabled}
      <Button color="blue" class="mb-5" on:click={() => (disabled = false)}
        >Edit class feedback</Button
      >
    {:else}

    <fieldset class="space-y-4" {disabled}>
      <h2 class="font-bold">Feedback</h2>

      <Select
        bind:value={values.course}
        label="Course"
        options={coursesJson}
        floating
        required
      />

      <Input
        type="text"
        bind:value={values.instructor}
        label="Instructor Name"
        floating
        required
      />

      <Input
        type="text"
        bind:value={values.studentName}
        label="Student Name"
        floating
        required
      />

      <Input
        type="number"
        bind:value={values.classNumber}
        label="Class session #"
        floating
        required
      />

      <div class="grid gap-1">
        <div class="grid gap-1 sm:grid-cols-3 sm:gap-3">
          <div class="sm:col-span-1">
            <Input type="date" bind:value={values.date} label="Date of Class" required />
          </div>
          <div class="sm:col-span-3">
            <Input
              type="range"
              bind:value={values.rating}
              min="1"
              max="10"
              label="Rate Today's Class From 1-10"
              required
            />
            <div
              style="margin-top:-1.75rem; height:8px; background-color:gainsboro; margin-left:1rem; margin-right:1rem;"
            ></div>
            <p style="padding-top:1rem;">
              <i>Current Rating: {values.rating}</i>
            </p>
          </div>
        </div>
        <Input
          type="text"
          bind:value={values.feedback}
          label="Please provide any written feedback here."
          floating
          required
        />
      </div>
      <div class="justify flex">
        <Button color="blue" type="submit">Submit</Button>
      </div>
    </fieldset>
    {/if}
  </Form>
</Card>
