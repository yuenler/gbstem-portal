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
    import StudentSelect from '../StudentSelect.svelte'

  let disabled = false
  let showValidation = false
  let pastClassNumber = 0
  let selectedStudentUid = ""
  let selectedStudentCourses: string[] = []
  let pastSelected = ""

  let values: {
    instructor: string
    classNumber: number
    studentId: string
    date: string
    course: string
    rating: number
    feedback: string
  } = {
    instructor: '',
    classNumber: 1,
    studentId: '',
    date: new Date().toISOString(),
    course: '',
    rating: 0,
    feedback: '',
  }

async function fetchCourseList(classIds: string[]) {
  const coursePromises = classIds.map((classId) =>
      getDoc(doc(db, 'classesSpring24', classId)),
  )
  const courseDocs = await Promise.all(coursePromises)
   selectedStudentCourses = courseDocs.map((doc) => {
      if(doc.exists()) {
        return doc.data().course;
      }
    })
  }

  function handleSubmit(e: CustomEvent<SubmitData>) {
    console.log(values.course);
    values.studentId = selectedStudentUid;
    if (e.detail.error === null) {
      showValidation = false
      disabled = true
      if ($user) {
        const frozenUser = $user
        setDoc(
          doc(
            db,
            'classFeedback24', selectedStudentUid, values.course, new Date().toISOString(),
          ),
          values,
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
    } else {
      showValidation = true
      alert.trigger('error', e.detail.error)
    }
  }

  $: if (selectedStudentUid) {
    if(selectedStudentUid !== pastSelected || pastSelected === "") {
      getDoc(doc(db, 'registrationsSpring24', selectedStudentUid)).then(
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const classIds = docSnapshot.data().classes || []
          fetchCourseList(classIds);
          console.log(selectedStudentCourses);
        }
      },
    )
    pastSelected = selectedStudentUid
    }    
}
</script>

{#if selectedStudentUid === "" && values.course === ""}
<div class="mb-5">
  <StudentSelect bind:selectedStudentUid/>
</div>

{:else if selectedStudentCourses.length == 0} 
<div class="mb-5">
  <StudentSelect bind:selectedStudentUid/>
</div>
<div>This student is not currently enrolled in a course.</div>

{:else}
<h2 class="ml-2 text-xl font-bold">Weekly Class Feedback Form</h2>

<Card class="ml-2">
  <div class="mb-5">
    <h2 class="font-bold text-lg">Select Course:</h2>
      {#each selectedStudentCourses as studentCourse}
      <label>
        <input type = "radio" bind:group={values.course} value = {studentCourse}/> 
        {studentCourse}
      </label>
      {/each}
    </div>
</Card>
<Card class="ml-2">
  <Form
    class={cn(showValidation && 'show-validation')}
    on:submit={handleSubmit}
  >
    {#if disabled}
      <Button color="blue" class="mb-5" on:click={() => (disabled = false)}
        >Edit class feedback</Button
      >
    {/if}

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
        type="number"
        bind:value={values.classNumber}
        label="Class session #"
        floating
        required
      />

      <div class="grid gap-1">
        <div class="grid gap-1 sm:grid-cols-3 sm:gap-3">
          <div class="sm:col-span-1">
            <Input type="date" bind:value={values.date} label="Date" required />
          </div>
          <div class="sm:col-span-3">
            <Input
              type="number"
              bind:value={values.rating}
              min="1"
              max="10"
              label="Rate Today's Class From 1-10"
              required
            />
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
  </Form>
</Card>
{/if}