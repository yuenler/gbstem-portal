<script lang="ts">
  import { db, user } from '$lib/client/firebase'
  import { alert } from '$lib/stores'
  import Form from '$lib/components/Form.svelte'
  import Button from '../Button.svelte'
  import Select from '$lib/components/Select.svelte'
  import Input from '$lib/components/Input.svelte'
  import { cn } from '$lib/utils'
  import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
  import { onMount } from 'svelte'
  import Link from '$lib/components/Link.svelte'
  import { coursesJson, daysOfWeekJson } from '$lib/data'
  import { create } from 'lodash-es'

  let disabled = false
  let showValidation = false
  let values: {
    classDay1: string
    classTime1: string
    classDay2: string
    classTime2: string
    meetingLink: string
    course: string
    submitting: boolean
    meetingTimes: Date[]
    instructorFirstName: string
    instructorLastName: string
    classCap: number
  } = {
    classDay1: '',
    classTime1: '',
    classDay2: '',
    classTime2: '',
    meetingLink: '',
    course: '',
    submitting: false,
    meetingTimes: [],
    instructorFirstName: '',
    instructorLastName: '',
    classCap: 7,
  }

  let createClassSchedule = true

  let semesterDates: Data.SemesterDates = {
    classesEnd: '',
    classesStart: '',
    leadershipAppsDue: '',
    newInstructorAppsDue: '',
    returningInstructorAppsDue: '',
  }

  function getMeetingDates(
    classDay1: string,
    classDay2: string,
    classTime1: string,
    classTime2: string,
    startDate: Date,
    endDate: Date,
  ): Date[] {
    const meetingDates = []
    const dayMap: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    }

    let currentDate = new Date(startDate.getTime())
    while (currentDate <= endDate) {
      if (currentDate.getDay() === dayMap[classDay1]) {
        let meetingTime = parseTime(classTime1, currentDate)
        meetingDates.push(new Date(meetingTime))
      }
      if (currentDate.getDay() === dayMap[classDay2]) {
        let meetingTime = parseTime(classTime2, currentDate)
        meetingDates.push(new Date(meetingTime))
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return meetingDates
  }

  function parseTime(time: string, date: Date): Date {
    const [hours, minutes] = time.split(':').map((str) => parseInt(str, 10))
    date.setHours(hours, minutes, 0, 0)
    return date
  }

  onMount(() => {
    return user.subscribe((user) => {
      if (user) {
        getDoc(doc(db, 'classesSpring24', user.object.uid)).then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data()
            values = data as {
              classDay1: string
              classTime1: string
              classDay2: string
              classTime2: string
              meetingLink: string
              course: string
              submitting: boolean
              meetingTimes: Date[]
              instructorFirstName: string
              instructorLastName: string
              classCap: number
            }
            disabled = true
            createClassSchedule = false
          }
        })
        getDoc(doc(db, 'semesterDates', 'spring24')).then((datesDoc) => {
          const datesDocExists = datesDoc.exists()
          if (datesDocExists) {
            semesterDates = datesDoc.data() as Data.SemesterDates
          }
        })
      }
    })
  })

  function handleSubmit(e: CustomEvent<SubmitData>) {
    if (e.detail.error === null) {
      showValidation = false
      disabled = true
      if ($user) {
        const frozenUser = $user
        if (createClassSchedule) {
          const meetingTimes = getMeetingDates(
            values.classDay1,
            values.classDay2,
            values.classTime1,
            values.classTime2,
            new Date(semesterDates.classesStart),
            new Date(semesterDates.classesEnd),
          )
          values.meetingTimes = meetingTimes
        }
        values.instructorFirstName = frozenUser.profile.firstName
        values.instructorLastName = frozenUser.profile.lastName
        setDoc(doc(db, 'classesSpring24', frozenUser.object.uid), values)
          .then(() => {
            disabled = true
            alert.trigger('success', 'Class details saved!')
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

<Form class={cn(showValidation && 'show-validation')} on:submit={handleSubmit}>
  {#if disabled}
    <Button color="blue" class="mb-5" on:click={() => (disabled = false)}
      >Edit class details</Button
    >
    <p>Note that editing your class details will reset your class schedule.</p>
  {/if}

  <fieldset class="mt-4 space-y-4" {disabled}>
    <p>
      Please do not fill this form out until you have been told by gbSTEM
      leadership what class you will be teaching.
    </p>
    <h2 class="text-xl font-bold">Your class details</h2>

    <Select
      bind:value={values.course}
      label="Course"
      options={coursesJson}
      floating
      required
    />

    <Input
      type="text"
      bind:value={values.meetingLink}
      label="Meeting link"
      floating
      required
    />

    <div class="grid gap-1">
      <span class="font-bold"
        >Classes meet twice weekly at consistent days and times throughout the
        semester and run for 45-60 minutes each.
      </span>

      <div class="grid gap-1 sm:grid-cols-3 sm:gap-3">
        <div class="sm:col-span-2">
          <Select
            bind:value={values.classDay1}
            label="Meeting day 1"
            options={daysOfWeekJson}
            floating
            required
          />
        </div>
        <Input
          type="time"
          bind:value={values.classTime1}
          label="Meeting time 1"
          floating
          required
        />
      </div>

      <div class="grid gap-1 sm:grid-cols-3 sm:gap-3">
        <div class="sm:col-span-2">
          <Select
            bind:value={values.classDay2}
            label="Meeting day 2"
            options={daysOfWeekJson}
            floating
            required
          />
        </div>
        <Input
          type="time"
          bind:value={values.classTime2}
          label="Meeting time 2"
          floating
          required
        />
      </div>
    </div>

    <Input
      type="number"
      bind:value={values.classCap}
      label="Class capacity"
      floating
      required
    />

    <Input
      type="checkbox"
      bind:value={values.submitting}
      label="I understand submitting will make my class available for registration, so I should not submit until I am sure the class and class times work for me."
      required
    />

    <Input
      type="checkbox"
      bind:value={createClassSchedule}
      label="Would you like a class schedule to be automatically created for you? Typically, you want to check this box the first time you submit your class details, but you should avoid checking this box when submitting the form again to edit your class details because it will overwrite changes you have made to your existing class schedule."
    />

    <div class="flex justify-end">
      <Button color="blue" type="submit">Submit</Button>
    </div>
  </fieldset>
</Form>
